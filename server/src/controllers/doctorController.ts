import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';
import { evaluateTriage } from '../services/triageEngine.js';
import {
  CareJourneyStatus,
  CareEventType,
  TeleconsultationStatus,
  DiagnosticOrderStatus,
  ReferralStatus,
  Urgency,
} from '@sethu/shared';

export async function getDoctorQueue(req: Request, res: Response): Promise<void> {
  const db = getDatabase();

  // Find patients currently active or awaiting doctor review
  const queueItems = db.prepare(`
    SELECT p.id as patient_id, p.full_name, p.village, p.gender, p.date_of_birth, p.phone,
           cj.id as care_journey_id, cj.status as journey_status, cj.primary_complaint, cj.started_at as arrival_time,
           e.id as encounter_id, e.encounter_type,
           ta.triage_level, ta.symptoms, ta.vitals, ta.warning_signs_checked
    FROM care_journeys cj
    JOIN patients p ON cj.patient_id = p.id
    LEFT JOIN encounters e ON e.care_journey_id = cj.id
    LEFT JOIN triage_assessments ta ON ta.encounter_id = e.id
    WHERE cj.status IN ('ACTIVE', 'AWAITING_TRIAGE', 'TRIAGED', 'CONSULTATION', 'TELECONSULTATION_PENDING', 'PATIENT_ARRIVED')
    ORDER BY 
      CASE ta.triage_level 
        WHEN 'EMERGENCY' THEN 1 
        WHEN 'URGENT' THEN 2 
        ELSE 3 
      END ASC,
      cj.started_at ASC
    LIMIT 10
  `).all() as any[];

  // Also get pending teleconsultation requests
  const teleconsults = db.prepare(`
    SELECT tc.id, tc.specialty_required, tc.reason_for_consult, tc.status, tc.scheduled_at,
           p.id as patient_id, p.full_name as patient_name, p.village, p.gender,
           u.full_name as requesting_doctor_name, f.name as requesting_facility_name
    FROM teleconsultations tc
    JOIN patients p ON tc.patient_id = p.id
    JOIN users u ON tc.requesting_doctor_id = u.id
    JOIN facilities f ON tc.requesting_facility_id = f.id
    WHERE tc.status IN ('REQUESTED', 'SCHEDULED', 'WAITING')
    ORDER BY tc.created_at ASC
    LIMIT 5
  `).all() as any[];

  res.json({
    success: true,
    data: {
      queue: queueItems.map(item => ({
        patientId: item.patient_id,
        fullName: item.full_name,
        village: item.village,
        gender: item.gender,
        dateOfBirth: item.date_of_birth,
        phone: item.phone,
        careJourneyId: item.care_journey_id,
        journeyStatus: item.journey_status,
        primaryComplaint: item.primary_complaint,
        arrivalTime: item.arrival_time,
        encounterId: item.encounter_id,
        encounterType: item.encounter_type,
        triageLevel: item.triage_level || 'ROUTINE',
        vitals: item.vitals ? JSON.parse(item.vitals) : {},
        symptoms: item.symptoms ? JSON.parse(item.symptoms) : [],
      })),
      teleconsults,
      counts: {
        totalQueue: Math.min(queueItems.length, 10),
        emergencyCount: queueItems.filter(q => q.triage_level === 'EMERGENCY').length,
        urgentCount: queueItems.filter(q => q.triage_level === 'URGENT').length,
        teleconsultsPending: teleconsults.length,
      },
    },
  });
}

export async function getClinicalSummary(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = getDatabase();

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(id) as any;
  if (!patient) {
    res.status(404).json({
      success: false,
      error: { code: 'PATIENT_NOT_FOUND', message: 'Patient not found' },
    });
    return;
  }

  // Active care journey
  const journey = db.prepare(`
    SELECT cj.*, f.name as facility_name
    FROM care_journeys cj
    LEFT JOIN facilities f ON cj.current_facility_id = f.id
    WHERE cj.patient_id = ? AND cj.completed_at IS NULL
    ORDER BY cj.started_at DESC LIMIT 1
  `).get(id) as any;

  // Latest triage assessment
  const triage = db.prepare(`
    SELECT ta.*
    FROM triage_assessments ta
    WHERE ta.patient_id = ?
    ORDER BY ta.assessed_at DESC LIMIT 1
  `).get(id) as any;

  let triageAnalysis = null;
  if (triage) {
    const vitals = JSON.parse(triage.vitals || '{}');
    const symptoms = JSON.parse(triage.symptoms || '[]');
    const warningSigns = JSON.parse(triage.warning_signs_checked || '[]');
    triageAnalysis = evaluateTriage({ vitals, symptoms, warningSigns });
  }

  // Encounters & vitals history
  const encounters = db.prepare(`
    SELECT e.*, u.full_name as clinician_name, ta.vitals, ta.symptoms, ta.triage_level
    FROM encounters e
    LEFT JOIN users u ON e.clinician_id = u.id
    LEFT JOIN triage_assessments ta ON ta.encounter_id = e.id
    WHERE e.patient_id = ?
    ORDER BY e.started_at DESC
  `).all(id) as any[];

  // Previous consultations
  const consultations = db.prepare(`
    SELECT c.*, u.full_name as doctor_name
    FROM consultations c
    JOIN users u ON c.doctor_id = u.id
    WHERE c.patient_id = ?
    ORDER BY c.created_at DESC
  `).all(id);

  // Diagnostic results
  const diagnostics = db.prepare(`
    SELECT do.diagnostic_type, do.diagnostic_name, do.status, do.ordered_at,
           dr.result_summary, dr.reported_at, dr.is_normal
    FROM diagnostic_orders do
    LEFT JOIN diagnostic_results dr ON do.id = dr.diagnostic_order_id
    WHERE do.patient_id = ?
    ORDER BY do.ordered_at DESC
  `).all(id);

  // Prescriptions and medicines
  const prescriptions = db.prepare(`
    SELECT p.id, p.notes, p.created_at, u.full_name as doctor_name
    FROM prescriptions p
    JOIN users u ON p.prescribed_by = u.id
    WHERE p.patient_id = ?
    ORDER BY p.created_at DESC
  `).all(id) as any[];

  for (const pr of prescriptions) {
    pr.items = db.prepare(`
      SELECT pi.*, m.generic_name, m.unit
      FROM prescription_items pi
      JOIN medicines m ON pi.medicine_id = m.id
      WHERE pi.prescription_id = ?
    `).all(pr.id);
  }

  res.json({
    success: true,
    data: {
      patient,
      journey,
      triage: triage ? {
        id: triage.id,
        triageLevel: triage.triage_level,
        triageNotes: triage.triage_notes,
        assessedAt: triage.assessed_at,
        vitals: JSON.parse(triage.vitals || '{}'),
        symptoms: JSON.parse(triage.symptoms || '[]'),
        warningSigns: JSON.parse(triage.warning_signs_checked || '[]'),
        analysis: triageAnalysis,
      } : null,
      encounters: encounters.map(e => ({
        ...e,
        vitals: e.vitals ? JSON.parse(e.vitals) : {},
        symptoms: e.symptoms ? JSON.parse(e.symptoms) : [],
      })),
      consultations,
      diagnostics,
      prescriptions,
    },
  });
}

export async function createConsultation(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const doctorId = req.user?.userId || 'usr-doctor-01';
  const {
    patientId,
    encounterId,
    careJourneyId,
    clinicalNotes,
    assessment,
    treatmentPlan,
    actionType, // 'LOCAL_TREATMENT' | 'REQUEST_TELECONSULT' | 'ORDER_DIAGNOSTICS' | 'REFERRAL'
    medicines = [],
    followUpDays = 7,
    specialtyRequired,
    reasonForTeleconsult,
    diagnosticsToOrder = [],
    referralTargetFacilityId,
    referralReason,
  } = req.body;

  if (!patientId || !clinicalNotes || !assessment) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Patient ID, clinical notes, and assessment are required' },
    });
    return;
  }

  try {
    const consultationId = `con-${uuidv4().substring(0, 8)}`;
    const careRequirementId = `cr-${uuidv4().substring(0, 8)}`;
    let finalJourneyId = careJourneyId;
    let finalEncounterId = encounterId;

    db.transaction(() => {
      // 1. Ensure a valid active care journey exists
      if (!finalJourneyId) {
        const j = db.prepare(`SELECT id FROM care_journeys WHERE patient_id = ? AND completed_at IS NULL ORDER BY created_at DESC LIMIT 1`).get(patientId) as any;
        finalJourneyId = j?.id;
      }
      if (!finalJourneyId) {
        finalJourneyId = `cj-${uuidv4().substring(0, 8)}`;
        db.prepare(`
          INSERT INTO care_journeys (id, patient_id, primary_complaint, status, started_at)
          VALUES (?, ?, ?, 'ACTIVE', datetime('now'))
        `).run(finalJourneyId, patientId, assessment || 'Clinical consultation');
      }

      // 2. Ensure a valid encounter exists (foreign key check)
      if (finalEncounterId) {
        const existingEnc = db.prepare(`SELECT id FROM encounters WHERE id = ?`).get(finalEncounterId);
        if (!existingEnc) finalEncounterId = null;
      }
      if (!finalEncounterId) {
        const latestEnc = db.prepare(`SELECT id FROM encounters WHERE patient_id = ? ORDER BY started_at DESC LIMIT 1`).get(patientId) as any;
        if (latestEnc) {
          finalEncounterId = latestEnc.id;
        } else {
          finalEncounterId = `enc-${uuidv4().substring(0, 8)}`;
          db.prepare(`
            INSERT INTO encounters (id, patient_id, care_journey_id, facility_id, clinician_id, encounter_type, chief_complaint, started_at)
            VALUES (?, ?, ?, 'fac-phc-01', ?, 'CLINIC_VISIT', ?, datetime('now'))
          `).run(finalEncounterId, patientId, finalJourneyId, doctorId, assessment || 'Clinical consultation');
        }
      }

      // 3. Insert Consultation
      db.prepare(`
        INSERT INTO consultations (id, encounter_id, doctor_id, patient_id, clinical_notes, assessment, treatment_plan)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(consultationId, finalEncounterId, doctorId, patientId, clinicalNotes, assessment, treatmentPlan || null);

      // 4. Create Structured Care Requirement Object
      db.prepare(`
        INSERT INTO care_requirements (
          id, encounter_id, patient_id, care_journey_id, specialist_type,
          diagnostics_needed, medicines_needed, requires_physical_exam, follow_up_days, urgency, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'URGENT', ?, ?)
      `).run(
        careRequirementId,
        finalEncounterId,
        patientId,
        finalJourneyId,
        specialtyRequired || null,
        JSON.stringify(diagnosticsToOrder || []),
        JSON.stringify(medicines || []),
        actionType === 'REFERRAL' ? 1 : 0,
        followUpDays || 7,
        clinicalNotes,
        doctorId
      );

      // 5. Process Selected Clinical Next-Step Action
      let nextStatus = CareJourneyStatus.TREATMENT_IN_PROGRESS;

      if (actionType === 'REQUEST_TELECONSULT' && specialtyRequired) {
        nextStatus = CareJourneyStatus.TELECONSULTATION_PENDING;
        const teleconsultId = `tc-${uuidv4().substring(0, 8)}`;
        db.prepare(`
          INSERT INTO teleconsultations (
            id, consultation_id, patient_id, specialist_id, requesting_doctor_id, requesting_facility_id, status, specialty_required, reason_for_consult
          ) VALUES (?, ?, ?, 'usr-doctor-03', ?, 'fac-phc-01', 'REQUESTED', ?, ?)
        `).run(teleconsultId, consultationId, patientId, doctorId, specialtyRequired, reasonForTeleconsult || assessment);
      } else if (actionType === 'ORDER_DIAGNOSTICS' && diagnosticsToOrder.length > 0) {
        nextStatus = CareJourneyStatus.AWAITING_DIAGNOSTIC;
        for (const diag of diagnosticsToOrder) {
          db.prepare(`
            INSERT INTO diagnostic_orders (
              id, care_requirement_id, patient_id, care_journey_id, diagnostic_type, diagnostic_name, facility_id, status, ordered_by
            ) VALUES (?, ?, ?, ?, ?, ?, 'fac-dh-01', 'REQUESTED', ?)
          `).run(`do-${uuidv4().substring(0, 8)}`, careRequirementId, patientId, finalJourneyId, diag, diag, doctorId);
        }
      } else if (actionType === 'REFERRAL' && referralTargetFacilityId) {
        nextStatus = CareJourneyStatus.REFERRED;
        const referralId = `ref-${uuidv4().substring(0, 8)}`;
        db.prepare(`
          INSERT INTO referrals (
            id, care_requirement_id, patient_id, care_journey_id, source_facility_id, target_facility_id, referring_doctor_id, status, urgency, reason, clinical_notes, expected_arrival_by, created_by
          ) VALUES (?, ?, ?, ?, 'fac-phc-01', ?, ?, 'SENT', 'URGENT', ?, ?, datetime('now', '+3 days'), ?)
        `).run(referralId, careRequirementId, patientId, finalJourneyId, referralTargetFacilityId, doctorId, referralReason || assessment, clinicalNotes, doctorId);
      } else {
        // Local treatment & Prescription
        nextStatus = CareJourneyStatus.AWAITING_FOLLOWUP;
        if (medicines.length > 0) {
          const prescriptionId = `rx-${uuidv4().substring(0, 8)}`;
          db.prepare(`
            INSERT INTO prescriptions (id, consultation_id, patient_id, care_journey_id, prescribed_by, facility_id, notes)
            VALUES (?, ?, ?, ?, ?, 'fac-phc-01', ?)
          `).run(prescriptionId, consultationId, patientId, finalJourneyId, doctorId, treatmentPlan || null);

          for (const m of medicines) {
            // Ensure medicine_id exists in medicines table
            let validMedId = m.medicineId || 'med-01';
            const medCheck = db.prepare(`SELECT id FROM medicines WHERE id = ?`).get(validMedId);
            if (!medCheck) validMedId = 'med-01';

            db.prepare(`
              INSERT INTO prescription_items (id, prescription_id, medicine_id, medicine_name, dosage, frequency, duration_days, instructions)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(`pi-${uuidv4().substring(0, 8)}`, prescriptionId, validMedId, m.name || 'Medicine', m.dosage || '1 tab', m.frequency || 'Daily', m.durationDays || 5, m.instructions || null);
          }
        }

        // Schedule follow-up
        if (followUpDays) {
          db.prepare(`
            INSERT INTO followups (id, patient_id, care_journey_id, assigned_worker_id, follow_up_type, due_date, status)
            VALUES (?, ?, ?, 'usr-worker-01', 'post_treatment', datetime('now', '+' || ? || ' days'), 'PENDING')
          `).run(`fu-${uuidv4().substring(0, 8)}`, patientId, finalJourneyId, followUpDays);
        }
      }

      // 6. Update Care Journey Status
      if (finalJourneyId) {
        db.prepare(`UPDATE care_journeys SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, finalJourneyId);

        // Record on Longitudinal Timeline
        db.prepare(`
          INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          `ce-${uuidv4().substring(0, 8)}`,
          finalJourneyId,
          patientId,
          CareEventType.CONSULTATION_COMPLETED,
          JSON.stringify({
            consultationId,
            careRequirementId,
            assessment,
            actionType,
            nextStatus,
          }),
          doctorId
        );
      }
    })();

    res.status(201).json({
      success: true,
      data: {
        consultationId,
        careRequirementId,
        message: 'Consultation recorded and care journey state updated.',
      },
    });
  } catch (error: any) {
    console.error('[DoctorController] Failed to record consultation:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error?.message || 'Failed to record consultation' },
    });
  }
}
