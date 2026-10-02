import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { runCareRouteAssurance } from '../services/careRouteAssurance.js';
import { CareJourneyStatus, CareEventType, ReferralStatus } from '@sethu/shared';

// POST /api/care-route/evaluate
export function evaluateCareRoute(req: Request, res: Response): void {
  try {
    const { careRequirementId } = req.body;
    if (!careRequirementId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'careRequirementId is required' },
      });
      return;
    }

    const evaluatedByUserId = (req as any).user?.userId || 'usr-doctor-01';

    const result = runCareRouteAssurance({
      careRequirementId,
      evaluatedByUserId,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[CareRoute] Evaluation failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EVALUATION_ERROR', message: error.message },
    });
  }
}

// GET /api/care-route/evaluation/:id
export function getCareRouteEvaluation(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const evaluation = db.prepare(`
      SELECT cre.*, p.full_name as patient_name, p.gender, p.phone, f.name as selected_facility_name
      FROM care_route_evaluations cre
      JOIN patients p ON cre.patient_id = p.id
      LEFT JOIN facilities f ON cre.selected_facility_id = f.id
      WHERE cre.id = ?
    `).get(id) as any;

    if (!evaluation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Care route evaluation not found' },
      });
      return;
    }

    const matches = db.prepare(`
      SELECT fm.*, f.name as facility_name, f.type as facility_type, f.address as facility_address, f.phone as facility_phone
      FROM facility_matches fm
      JOIN facilities f ON fm.facility_id = f.id
      WHERE fm.evaluation_id = ?
      ORDER BY fm.overall_score DESC
    `).all(id) as any[];

    const formattedMatches = matches.map((m) => ({
      facilityId: m.facility_id,
      facilityName: m.facility_name,
      facilityType: m.facility_type,
      facilityAddress: m.facility_address,
      facilityPhone: m.facility_phone,
      distanceKm: m.distance_km,
      estimatedWaitMinutes: m.estimated_wait_minutes,
      overallScore: m.overall_score,
      canCompleteCare: Boolean(m.can_complete_care),
      recommendation: m.recommendation,
      dataFreshnessScore: m.data_freshness_score,
      diagnosticsMatch: JSON.parse(m.diagnostics_match || '[]'),
      medicinesMatch: JSON.parse(m.medicine_match || '[]'),
      concerns: JSON.parse(m.concerns || '[]'),
      selectionExplanation: m.selection_explanation,
    }));

    res.json({
      success: true,
      data: {
        evaluation,
        matches: formattedMatches,
      },
    });
  } catch (error: any) {
    console.error('[CareRoute] Failed to get evaluation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/care-route/confirm
export function confirmCareRoute(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { careRequirementId, facilityId, reason, expectedArrivalDays } = req.body;
    const actorId = (req as any).user?.userId || 'usr-doctor-01';

    if (!careRequirementId || !facilityId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'careRequirementId and facilityId are required' },
      });
      return;
    }

    const careReq = db.prepare(`
      SELECT cr.*, p.full_name as patient_name
      FROM care_requirements cr
      JOIN patients p ON cr.patient_id = p.id
      WHERE cr.id = ?
    `).get(careRequirementId) as any;

    if (!careReq) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Care Requirement not found' },
      });
      return;
    }

    const referralId = `ref-${uuidv4().substring(0, 8)}`;
    const arrivalDays = expectedArrivalDays || 3;

    db.transaction(() => {
      // 1. Create Referral linked to confirmed Care Requirement
      db.prepare(`
        INSERT INTO referrals (
          id, care_requirement_id, patient_id, care_journey_id,
          source_facility_id, target_facility_id, referring_doctor_id,
          status, urgency, reason, clinical_notes, expected_arrival_by, created_by
        ) VALUES (?, ?, ?, ?, 'fac-phc-01', ?, ?, 'ACCEPTED', ?, ?, ?, datetime('now', '+' || ? || ' days'), ?)
      `).run(
        referralId,
        careRequirementId,
        careReq.patient_id,
        careReq.care_journey_id,
        facilityId,
        actorId,
        careReq.urgency || 'URGENT',
        reason || 'Care Route Assured referral for complete treatment',
        careReq.notes || null,
        arrivalDays,
        actorId
      );

      // 2. Advance Care Journey Status to REFERRED
      db.prepare(`
        UPDATE care_journeys
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(CareJourneyStatus.REFERRED, careReq.care_journey_id);

      // 3. Append to Longitudinal Care Event Timeline
      db.prepare(`
        INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `ce-${uuidv4().substring(0, 8)}`,
        careReq.care_journey_id,
        careReq.patient_id,
        CareEventType.REFERRAL_CREATED,
        JSON.stringify({
          referralId,
          careRequirementId,
          targetFacilityId: facilityId,
          expectedArrivalDays: arrivalDays,
          status: ReferralStatus.ACCEPTED,
        }),
        actorId
      );
    })();

    res.json({
      success: true,
      data: {
        referralId,
        careRequirementId,
        facilityId,
        message: 'Care Route Assured: Referral successfully created and journey advanced.',
      },
    });
  } catch (error: any) {
    console.error('[CareRoute] Failed to confirm care route:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}
