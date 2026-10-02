import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';
import { CareJourneyStatus, CareEventType, EncounterType, TriageLevel } from '@sethu/shared';

export async function createEncounter(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const clinicianId = req.user?.userId || 'usr-worker-01';
  const {
    patientId,
    encounterType = EncounterType.HOME_VISIT,
    chiefComplaint,
    notes,
    vitals = {},
    symptoms = [],
    warningSigns = [],
    isOfflineCreated = false,
  } = req.body;

  if (!patientId || !chiefComplaint) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Patient ID and chief complaint are required' },
    });
    return;
  }

  // Find or create active care journey
  let journey = db.prepare(`
    SELECT * FROM care_journeys
    WHERE patient_id = ? AND completed_at IS NULL
    ORDER BY started_at DESC LIMIT 1
  `).get(patientId) as any;

  const encounterId = `enc-${uuidv4().substring(0, 8)}`;
  let journeyId = journey?.id;

  db.transaction(() => {
    if (!journeyId) {
      journeyId = `cj-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO care_journeys (id, patient_id, status, primary_complaint, assigned_worker_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(journeyId, patientId, CareJourneyStatus.ACTIVE, chiefComplaint, clinicianId);
    }

    // Insert Encounter
    db.prepare(`
      INSERT INTO encounters (
        id, patient_id, care_journey_id, clinician_id, encounter_type, chief_complaint, notes, is_offline_created
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      encounterId,
      patientId,
      journeyId,
      clinicianId,
      encounterType,
      chiefComplaint,
      notes || null,
      isOfflineCreated ? 1 : 0
    );

    // If vitals or symptoms were entered, also store in triage_assessments as preliminary triage note
    const triageId = `tri-${uuidv4().substring(0, 8)}`;
    const hasEmergencySign = warningSigns.some((w: any) => w.present === true);
    const triageLevel = hasEmergencySign ? TriageLevel.EMERGENCY : TriageLevel.ROUTINE;

    db.prepare(`
      INSERT INTO triage_assessments (
        id, encounter_id, patient_id, symptoms, vitals, warning_signs_checked, medical_history_flags, triage_level, triage_notes, assessed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      triageId,
      encounterId,
      patientId,
      JSON.stringify(symptoms),
      JSON.stringify(vitals),
      JSON.stringify(warningSigns),
      JSON.stringify([]),
      triageLevel,
      `Initial capture by worker: ${chiefComplaint}`,
      clinicianId
    );

    // Record on Longitudinal Care Timeline
    db.prepare(`
      INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      `ce-${uuidv4().substring(0, 8)}`,
      journeyId,
      patientId,
      CareEventType.ENCOUNTER_STARTED,
      JSON.stringify({
        encounterId,
        encounterType,
        chiefComplaint,
        vitals,
        triageLevel,
      }),
      clinicianId
    );

    // Update journey status to AWAITING_TRIAGE or TRIAGED
    db.prepare(`
      UPDATE care_journeys
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(CareJourneyStatus.TRIAGED, journeyId);
  })();

  res.status(201).json({
    success: true,
    data: {
      encounterId,
      journeyId,
      message: 'Encounter and vitals logged to longitudinal record.',
    },
  });
}

export async function getEncountersByPatient(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = getDatabase();

  const encounters = db.prepare(`
    SELECT e.*, u.full_name as clinician_name, f.name as facility_name,
           ta.vitals, ta.symptoms, ta.triage_level, ta.warning_signs_checked
    FROM encounters e
    LEFT JOIN users u ON e.clinician_id = u.id
    LEFT JOIN facilities f ON e.facility_id = f.id
    LEFT JOIN triage_assessments ta ON e.id = ta.encounter_id
    WHERE e.patient_id = ?
    ORDER BY e.started_at DESC
  `).all(id) as any[];

  res.json({
    success: true,
    data: encounters.map(e => ({
      id: e.id,
      patientId: e.patient_id,
      careJourneyId: e.care_journey_id,
      clinicianName: e.clinician_name,
      facilityName: e.facility_name,
      encounterType: e.encounter_type,
      chiefComplaint: e.chief_complaint,
      notes: e.notes,
      startedAt: e.started_at,
      vitals: e.vitals ? JSON.parse(e.vitals) : {},
      symptoms: e.symptoms ? JSON.parse(e.symptoms) : [],
      triageLevel: e.triage_level,
    })),
  });
}
