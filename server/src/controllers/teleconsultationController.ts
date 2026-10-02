import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { CareJourneyStatus, CareEventType } from '@sethu/shared';

// GET /api/teleconsultations
export function listTeleconsultations(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const user = (req as any).user;
    let query = `
      SELECT tc.*, 
             p.full_name as patient_name, p.gender as patient_gender, p.village as patient_village,
             rf.name as requesting_facility_name,
             rd.full_name as requesting_doctor_name,
             sp.full_name as specialist_name
      FROM teleconsultations tc
      JOIN patients p ON tc.patient_id = p.id
      JOIN facilities rf ON tc.requesting_facility_id = rf.id
      JOIN users rd ON tc.requesting_doctor_id = rd.id
      LEFT JOIN users sp ON tc.specialist_id = sp.id
      ORDER BY tc.created_at DESC
    `;

    const teleconsults = db.prepare(query).all();

    res.json({
      success: true,
      data: teleconsults,
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to list teleconsultations:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// GET /api/teleconsultations/:id
export function getTeleconsultationById(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const teleconsult = db.prepare(`
      SELECT tc.*, 
             p.id as patient_id, p.full_name as patient_name, p.gender as patient_gender, p.village as patient_village, p.phone as patient_phone, p.blood_group,
             rf.name as requesting_facility_name,
             rd.full_name as requesting_doctor_name,
             sp.full_name as specialist_name,
             cj.id as care_journey_id, cj.primary_complaint as chief_complaint, cj.status as journey_status
      FROM teleconsultations tc
      JOIN patients p ON tc.patient_id = p.id
      JOIN facilities rf ON tc.requesting_facility_id = rf.id
      JOIN users rd ON tc.requesting_doctor_id = rd.id
      LEFT JOIN users sp ON tc.specialist_id = sp.id
      LEFT JOIN care_journeys cj ON tc.patient_id = cj.patient_id AND cj.completed_at IS NULL
      WHERE tc.id = ?
    `).get(id) as any;

    if (!teleconsult) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Teleconsultation session not found' },
      });
      return;
    }

    // Get triage assessment and vitals
    const triage = db.prepare(`
      SELECT * FROM triage_assessments WHERE patient_id = ? ORDER BY assessed_at DESC LIMIT 1
    `).get(teleconsult.patient_id) as any;

    // Get active care requirement if already generated
    const careRequirement = db.prepare(`
      SELECT * FROM care_requirements WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(teleconsult.patient_id) as any;

    res.json({
      success: true,
      data: {
        teleconsult,
        triage: triage ? {
          ...triage,
          vitals: JSON.parse(triage.vitals || '{}'),
          symptoms: JSON.parse(triage.symptoms || '[]'),
          warningSigns: JSON.parse(triage.warning_signs_checked || '[]'),
        } : null,
        careRequirement: careRequirement ? {
          ...careRequirement,
          diagnosticsNeeded: JSON.parse(careRequirement.diagnostics_needed || '[]'),
          medicinesNeeded: JSON.parse(careRequirement.medicines_needed || '[]'),
        } : null,
      },
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to get teleconsultation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/teleconsultations/:id/complete
export function completeTeleconsultation(req: Request, res: Response): void {
  const { id } = req.params;
  const {
    specialistNotes,
    specialistRecommendation,
    requiresPhysicalExam,
    diagnosticsRecommended,
    medicinesRecommended,
    followUpDays,
  } = req.body;

  try {
    const db = getDatabase();
    const teleconsult = db.prepare(`SELECT * FROM teleconsultations WHERE id = ?`).get(id) as any;
    if (!teleconsult) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Teleconsultation not found' },
      });
      return;
    }

    const careRequirementId = `cr-${uuidv4().substring(0, 8)}`;
    const actorId = (req as any).user?.userId || 'usr-doctor-03';

    db.transaction(() => {
      // 1. Update Teleconsultation record
      db.prepare(`
        UPDATE teleconsultations
        SET status = 'COMPLETED',
            ended_at = datetime('now'),
            specialist_notes = ?,
            specialist_recommendation = ?,
            requires_physical_exam = ?,
            requires_diagnostics = ?
        WHERE id = ?
      `).run(
        specialistNotes || 'Teleconsultation completed.',
        specialistRecommendation || 'Clinical review completed.',
        requiresPhysicalExam ? 1 : 0,
        (diagnosticsRecommended && diagnosticsRecommended.length > 0) ? 1 : 0,
        id
      );

      // 2. Locate active encounter and care journey
      let journey = db.prepare(`
        SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL ORDER BY created_at DESC LIMIT 1
      `).get(teleconsult.patient_id) as any;

      let encounter = db.prepare(`
        SELECT id FROM encounters WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1
      `).get(teleconsult.patient_id) as any;

      const journeyId = journey?.id;
      const encounterId = encounter?.id || `enc-${uuidv4().substring(0, 8)}`;

      if (!encounter) {
        db.prepare(`
          INSERT INTO encounters (id, patient_id, facility_id, clinician_id, encounter_type, chief_complaint, started_at)
          VALUES (?, ?, 'fac-phc-01', ?, 'TELECONSULT', 'Specialist Teleconsultation', datetime('now'))
        `).run(encounterId, teleconsult.patient_id, actorId);
      }

      // 3. Create Structured Care Requirement Object
      db.prepare(`
        INSERT INTO care_requirements (
          id, encounter_id, patient_id, care_journey_id, specialist_type,
          diagnostics_needed, medicines_needed, requires_physical_exam, follow_up_days, urgency, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'URGENT', ?, ?)
      `).run(
        careRequirementId,
        encounterId,
        teleconsult.patient_id,
        journeyId,
        teleconsult.specialty_required || 'cardiology',
        JSON.stringify(diagnosticsRecommended || ['ECG', 'Chest X-ray']),
        JSON.stringify(medicinesRecommended || ['Amlodipine 5mg', 'Aspirin 75mg']),
        requiresPhysicalExam ? 1 : 0,
        followUpDays || 7,
        specialistNotes || 'Post-teleconsult specialist assessment',
        actorId
      );

      // 4. Update Care Journey status
      const nextStatus = requiresPhysicalExam
        ? CareJourneyStatus.CARE_REQUIREMENT_CREATED
        : CareJourneyStatus.TREATMENT_IN_PROGRESS;

      if (journeyId) {
        db.prepare(`UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, journeyId);

        // Append to care events
        db.prepare(`
          INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `ce-${uuidv4().substring(0, 8)}`,
          journeyId,
          teleconsult.patient_id,
          CareEventType.TELECONSULTATION_COMPLETED,
          JSON.stringify({
            teleconsultId: id,
            requiresPhysicalExam: !!requiresPhysicalExam,
            careRequirementId,
            recommendation: specialistRecommendation,
          }),
          actorId
        );
      }
    })();

    res.json({
      success: true,
      data: {
        teleconsultId: id,
        careRequirementId,
        requiresPhysicalExam: !!requiresPhysicalExam,
        message: 'Teleconsultation completed and Care Requirement generated.',
      },
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to complete teleconsultation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/teleconsultations
export function createTeleconsultation(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const user = (req as any).user;
    const {
      patientId,
      specialtyRequired = 'cardiology',
      reasonForConsult = 'Clinical teleconsultation requested',
      specialistId = 'usr-doctor-03',
      requestingFacilityId = 'fac-phc-01',
      requestingDoctorId,
    } = req.body;

    if (!patientId) {
      res.status(400).json({ success: false, error: { message: 'patientId is required' } });
      return;
    }

    const doctorId = requestingDoctorId || user?.userId || 'usr-doctor-01';

    // Find or create consultation record with valid schema columns.
    let consult = db.prepare(`SELECT id, encounter_id FROM consultations WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1`).get(patientId) as any;
    let consultationId = consult?.id;
    let encounterId = consult?.encounter_id;

    if (!consultationId || !encounterId) {
      const journey = db.prepare(`SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 1`).get(patientId) as any;
      const latestEncounter = db.prepare(`SELECT id FROM encounters WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1`).get(patientId) as any;
      encounterId = latestEncounter?.id || `enc-${uuidv4().substring(0, 8)}`;

      if (!latestEncounter) {
        db.prepare(`
          INSERT INTO encounters (id, patient_id, care_journey_id, facility_id, clinician_id, encounter_type, chief_complaint, started_at)
          VALUES (?, ?, ?, ?, ?, 'TELECONSULT', ?, datetime('now'))
        `).run(encounterId, patientId, journey?.id || `cj-${uuidv4().substring(0, 8)}`, requestingFacilityId, doctorId, reasonForConsult);
      }

      consultationId = consultationId || `con-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO consultations (id, encounter_id, doctor_id, patient_id, clinical_notes, assessment, treatment_plan)
        VALUES (?, ?, ?, ?, ?, ?, 'Teleconsultation requested for specialist review')
      `).run(consultationId, encounterId, doctorId, patientId, reasonForConsult, `Teleconsultation requested: ${specialtyRequired}`);
    }

    const teleconsultId = `tc-${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO teleconsultations (
        id, consultation_id, patient_id, specialist_id, requesting_doctor_id, requesting_facility_id, status, specialty_required, reason_for_consult
      ) VALUES (?, ?, ?, ?, ?, ?, 'REQUESTED', ?, ?)
    `).run(teleconsultId, consultationId, patientId, specialistId, doctorId, requestingFacilityId, specialtyRequired, reasonForConsult);

    // Update active care journey if exists
    const journey = db.prepare(`SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL`).get(patientId) as any;
    if (journey) {
      db.prepare(`UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(CareJourneyStatus.TELECONSULTATION_PENDING, journey.id);
    }

    res.json({
      success: true,
      data: {
        id: teleconsultId,
        patientId,
        specialtyRequired,
        status: 'REQUESTED',
        reasonForConsult,
      },
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to create teleconsultation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/teleconsultations/:id/start
export function startTeleconsultation(req: Request, res: Response): void {
  try {
    const db = getDatabase();
    const { id } = req.params;
    db.prepare(`
      UPDATE teleconsultations
      SET status = 'IN_PROGRESS',
          started_at = COALESCE(started_at, datetime('now'))
      WHERE id = ?
    `).run(id);

    res.json({
      success: true,
      data: { id, status: 'IN_PROGRESS' },
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to start teleconsultation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}

// POST /api/teleconsultations/:id/snapshot
export function saveTeleconsultationSnapshot(req: Request, res: Response): void {
  try {
    const { id } = req.params;
    const { imageData, label = 'Clinical Video Capture' } = req.body;

    // Snapshot is acknowledged and can be used in consultation documentation
    res.json({
      success: true,
      data: {
        teleconsultId: id,
        label,
        capturedAt: new Date().toISOString(),
        snapshotReceived: !!imageData,
      },
    });
  } catch (error: any) {
    console.error('[Teleconsult] Failed to save snapshot:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}
