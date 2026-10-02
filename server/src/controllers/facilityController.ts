import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { CareJourneyStatus, CareEventType, ReferralStatus, ResourceStatus, UpdateSource, VerificationState } from '@sethu/shared';
import { calculateDataTrustScore } from '../services/dataTrustScorer.js';

// GET /api/facility/dashboard
export function getFacilityDashboard(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    // Default facility is Kaveri District Hospital (or scoped from user)
    const facilityId = (req as any).user?.facilityId || 'fac-dh-01';

    const facility = db.prepare(`SELECT * FROM facilities WHERE id = ?`).get(facilityId) as any;

    // Incoming Referrals
    const referrals = db.prepare(`
      SELECT r.*, p.full_name as patient_name, p.gender as patient_gender, p.village as patient_village, p.phone as patient_phone,
             sf.name as source_facility_name, rd.full_name as referring_doctor_name,
             cr.specialist_type, cr.diagnostics_needed, cr.medicines_needed
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN facilities sf ON r.source_facility_id = sf.id
      JOIN users rd ON r.referring_doctor_id = rd.id
      LEFT JOIN care_requirements cr ON r.care_requirement_id = cr.id
      WHERE r.target_facility_id = ?
      ORDER BY r.created_at DESC
    `).all(facilityId) as any[];

    // Pending Diagnostic Orders
    const diagnostics = db.prepare(`
      SELECT do.*, p.full_name as patient_name, p.gender as patient_gender, p.village as patient_village,
             u.full_name as ordered_by_name, dr.result_summary, dr.is_normal
      FROM diagnostic_orders do
      JOIN patients p ON do.patient_id = p.id
      JOIN users u ON do.ordered_by = u.id
      LEFT JOIN diagnostic_results dr ON do.id = dr.diagnostic_order_id
      WHERE do.facility_id = ?
      ORDER BY do.ordered_at DESC
    `).all(facilityId) as any[];

    // Facility Resources & Freshness Scores
    const resources = db.prepare(`
      SELECT * FROM facility_resources WHERE facility_id = ? ORDER BY resource_type, resource_name
    `).all(facilityId) as any[];

    const scoredResources = resources.map((r) => ({
      ...r,
      trustScore: calculateDataTrustScore({
        lastUpdatedAt: r.last_updated_at,
        source: r.update_source || UpdateSource.FACILITY_STAFF,
        verificationState: r.verification_state || VerificationState.VERIFIED,
      }),
    }));

    // Medicine Stock
    const medicines = db.prepare(`
      SELECT fm.*, m.name as medicine_name, m.generic_name, m.category, m.unit
      FROM facility_medicines fm
      JOIN medicines m ON fm.medicine_id = m.id
      WHERE fm.facility_id = ?
      ORDER BY m.name
    `).all(facilityId) as any[];

    const activeReferralsCount = referrals.filter(r => r.status !== ReferralStatus.COMPLETED && r.status !== ReferralStatus.FAILED).length;
    const arrivedPatientsCount = referrals.filter(r => r.status === ReferralStatus.PATIENT_ARRIVED).length;
    const pendingDiagnosticsCount = diagnostics.filter(d => d.status === 'REQUESTED' || d.status === 'IN_PROGRESS').length;

    res.json({
      success: true,
      data: {
        facility,
        counts: {
          activeReferrals: activeReferralsCount,
          arrivedPatients: arrivedPatientsCount,
          pendingDiagnostics: pendingDiagnosticsCount,
          totalResources: resources.length,
          totalMedicines: medicines.length,
        },
        referrals: referrals.map(r => ({
          ...r,
          diagnosticsNeeded: JSON.parse(r.diagnostics_needed || '[]'),
          medicinesNeeded: JSON.parse(r.medicines_needed || '[]'),
        })),
        diagnostics,
        resources: scoredResources,
        medicines,
      },
    });
  } catch (error: any) {
    console.error('[FacilityController] Failed to get dashboard:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/facility/referrals/:id/status
export function updateReferralStatus(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { newStatus, notes, failureReason } = req.body;
    const actorId = (req as any).user?.userId || 'usr-fstaff-01';

    const referral = db.prepare(`SELECT * FROM referrals WHERE id = ?`).get(id) as any;
    if (!referral) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Referral not found' },
      });
      return;
    }

    db.transaction(() => {
      // 1. Update Referral
      db.prepare(`
        UPDATE referrals
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newStatus, id);

      // 2. Log Referral Event
      db.prepare(`
        INSERT INTO referral_events (id, referral_id, event_type, previous_status, new_status, actor_id, notes)
        VALUES (?, ?, 'STATUS_CHANGED', ?, ?, ?, ?)
      `).run(
        `re-${uuidv4().substring(0, 8)}`,
        id,
        referral.status,
        newStatus,
        actorId,
        notes || failureReason || null
      );

      // 3. Coordinate with Care Journey state machine
      if (referral.care_journey_id) {
        let journeyStatus: CareJourneyStatus | null = null;
        let eventType: CareEventType = CareEventType.REFERRAL_STATUS_CHANGED;

        if (newStatus === ReferralStatus.PATIENT_ARRIVED) {
          journeyStatus = CareJourneyStatus.PATIENT_ARRIVED;
        } else if (newStatus === ReferralStatus.CARE_PROVIDED || newStatus === ReferralStatus.COMPLETED) {
          journeyStatus = CareJourneyStatus.TREATMENT_IN_PROGRESS;
        } else if (newStatus === ReferralStatus.FAILED) {
          journeyStatus = CareJourneyStatus.CARE_BREAK;
          eventType = CareEventType.CARE_BREAK_DETECTED;

          // Record Care Break automatically on referral failure
          db.prepare(`
            INSERT INTO care_breaks (
              id, patient_id, care_journey_id, break_type, severity, detection_source, status, notes
            ) VALUES (?, ?, ?, 'REFERRAL_NOT_COMPLETED', 'HIGH', 'SYSTEM_DETECTION', 'DETECTED', ?)
          `).run(
            `cb-${uuidv4().substring(0, 8)}`,
            referral.patient_id,
            referral.care_journey_id,
            failureReason || 'Patient referral failed at receiving facility.'
          );
        }

        if (journeyStatus) {
          db.prepare(`
            UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?
          `).run(journeyStatus, referral.care_journey_id);

          db.prepare(`
            INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            `ce-${uuidv4().substring(0, 8)}`,
            referral.care_journey_id,
            referral.patient_id,
            eventType,
            JSON.stringify({
              referralId: id,
              previousStatus: referral.status,
              newStatus,
              notes,
              failureReason,
            }),
            actorId
          );
        }
      }
    })();

    res.json({
      success: true,
      data: {
        referralId: id,
        status: newStatus,
        message: `Referral status updated to ${newStatus}`,
      },
    });
  } catch (error: any) {
    console.error('[FacilityController] Failed to update referral status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/facility/diagnostics/:id/result
export function uploadDiagnosticResult(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { resultSummary, isNormal, resultData } = req.body;
    const actorId = (req as any).user?.userId || 'usr-fstaff-01';

    const order = db.prepare(`SELECT * FROM diagnostic_orders WHERE id = ?`).get(id) as any;
    if (!order) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Diagnostic order not found' },
      });
      return;
    }

    db.transaction(() => {
      // 1. Update diagnostic order to COMPLETED
      db.prepare(`
        UPDATE diagnostic_orders
        SET status = 'COMPLETED', completed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(id);

      // 2. Insert Diagnostic Result record
      const resultId = `dr-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO diagnostic_results (id, diagnostic_order_id, result_summary, result_data, is_normal)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        resultId,
        id,
        resultSummary || 'Diagnostic scan completed without acute abnormalities.',
        JSON.stringify(resultData || {}),
        isNormal ? 1 : 0
      );

      // 3. Advance Care Journey Status to DIAGNOSTIC_COMPLETE
      if (order.care_journey_id) {
        db.prepare(`
          UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?
        `).run(CareJourneyStatus.DIAGNOSTIC_COMPLETE, order.care_journey_id);

        db.prepare(`
          INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `ce-${uuidv4().substring(0, 8)}`,
          order.care_journey_id,
          order.patient_id,
          CareEventType.DIAGNOSTIC_RESULT_AVAILABLE,
          JSON.stringify({
            orderId: id,
            diagnosticName: order.diagnostic_name,
            resultSummary,
            isNormal: !!isNormal,
          }),
          actorId
        );
      }
    })();

    res.json({
      success: true,
      data: {
        orderId: id,
        message: 'Diagnostic result uploaded and care journey advanced.',
      },
    });
  } catch (error: any) {
    console.error('[FacilityController] Failed to upload diagnostic result:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/facility/medicines/dispense
export function dispenseMedicine(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { patientId, medicineId, quantity, notes } = req.body;
    const actorId = (req as any).user?.userId || 'usr-fstaff-01';
    const facilityId = (req as any).user?.facilityId || 'fac-dh-01';

    const journey = db.prepare(`
      SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL ORDER BY created_at DESC LIMIT 1
    `).get(patientId) as any;

    const transactionId = `mt-${uuidv4().substring(0, 8)}`;

    db.transaction(() => {
      // Find prescription item or create transaction directly
      db.prepare(`
        INSERT INTO medicine_transactions (
          id, prescription_item_id, patient_id, facility_id, fulfillment_type, quantity, recorded_by, notes
        ) VALUES (?, 'pi-dispensed', ?, ?, 'FACILITY_DISPENSED', ?, ?, ?)
      `).run(
        transactionId,
        patientId,
        facilityId,
        quantity || 14,
        actorId,
        notes || 'Dispensed at hospital pharmacy counter'
      );

      if (journey?.id) {
        db.prepare(`
          INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `ce-${uuidv4().substring(0, 8)}`,
          journey.id,
          patientId,
          CareEventType.MEDICINE_DISPENSED,
          JSON.stringify({
            medicineId,
            quantity: quantity || 14,
            facilityId,
          }),
          actorId
        );
      }
    })();

    res.json({
      success: true,
      data: {
        transactionId,
        message: 'Medicine successfully dispensed and logged to care journey.',
      },
    });
  } catch (error: any) {
    console.error('[FacilityController] Failed to dispense medicine:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/facility/resources/update
export function updateResourceStatus(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { resourceId, status, notes } = req.body;
    const actorId = (req as any).user?.userId || 'usr-fstaff-01';

    const resource = db.prepare(`SELECT * FROM facility_resources WHERE id = ?`).get(resourceId) as any;
    if (!resource) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
      return;
    }

    db.transaction(() => {
      db.prepare(`
        UPDATE facility_resources
        SET status = ?, last_updated_at = datetime('now'), updated_by_user_id = ?,
            verification_state = 'VERIFIED', verification_timestamp = datetime('now'), notes = ?
        WHERE id = ?
      `).run(status, actorId, notes || null, resourceId);

      db.prepare(`
        INSERT INTO resource_updates (id, resource_id, previous_status, new_status, updated_by, update_source, notes)
        VALUES (?, ?, ?, ?, ?, 'FACILITY_STAFF', ?)
      `).run(
        `ru-${uuidv4().substring(0, 8)}`,
        resourceId,
        resource.status,
        status,
        actorId,
        notes || 'Live update by facility operations staff'
      );
    })();

    res.json({
      success: true,
      data: {
        resourceId,
        status,
        message: 'Facility resource status updated with fresh verification timestamp.',
      },
    });
  } catch (error: any) {
    console.error('[FacilityController] Failed to update resource status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}
