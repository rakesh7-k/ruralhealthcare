import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { CareJourneyStatus, CareEventType } from '@sethu/shared';

// GET /api/care-requirements/:id
export function getCareRequirementById(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const careReq = db.prepare(`
      SELECT cr.*,
             p.full_name as patient_name, p.gender as patient_gender, p.village as patient_village, p.phone as patient_phone,
             cj.status as journey_status, cj.primary_complaint
      FROM care_requirements cr
      JOIN patients p ON cr.patient_id = p.id
      JOIN care_journeys cj ON cr.care_journey_id = cj.id
      WHERE cr.id = ?
    `).get(id) as any;

    if (!careReq) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Care requirement not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...careReq,
        diagnosticsNeeded: JSON.parse(careReq.diagnostics_needed || '[]'),
        medicinesNeeded: JSON.parse(careReq.medicines_needed || '[]'),
      },
    });
  } catch (error: any) {
    console.error('[CareRequirement] Failed to get care requirement:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/care-requirements
export function createCareRequirement(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const {
      patientId,
      careJourneyId,
      encounterId,
      specialistType,
      diagnosticsNeeded,
      medicinesNeeded,
      requiresPhysicalExam,
      followUpDays,
      urgency,
      notes,
    } = req.body;

    const actorId = (req as any).user?.userId || 'usr-doctor-01';
    const id = `cr-${uuidv4().substring(0, 8)}`;

    let journeyId = careJourneyId;
    if (!journeyId) {
      const activeJourney = db.prepare(`SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL LIMIT 1`).get(patientId) as any;
      journeyId = activeJourney?.id;
    }

    let encId = encounterId;
    if (!encId) {
      const activeEnc = db.prepare(`SELECT id FROM encounters WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1`).get(patientId) as any;
      encId = activeEnc?.id;
    }

    db.transaction(() => {
      db.prepare(`
        INSERT INTO care_requirements (
          id, encounter_id, patient_id, care_journey_id, specialist_type,
          diagnostics_needed, medicines_needed, requires_physical_exam, follow_up_days, urgency, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        encId,
        patientId,
        journeyId,
        specialistType || null,
        JSON.stringify(diagnosticsNeeded || []),
        JSON.stringify(medicinesNeeded || []),
        requiresPhysicalExam ? 1 : 0,
        followUpDays || 7,
        urgency || 'ROUTINE',
        notes || '',
        actorId
      );

      if (journeyId) {
        db.prepare(`UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
          CareJourneyStatus.CARE_REQUIREMENT_CREATED,
          journeyId
        );

        db.prepare(`
          INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `ce-${uuidv4().substring(0, 8)}`,
          journeyId,
          patientId,
          CareEventType.CARE_REQUIREMENT_CREATED,
          JSON.stringify({ careRequirementId: id, specialistType, requiresPhysicalExam }),
          actorId
        );
      }
    })();

    res.status(201).json({
      success: true,
      data: {
        id,
        message: 'Care requirement created successfully',
      },
    });
  } catch (error: any) {
    console.error('[CareRequirement] Failed to create care requirement:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}
