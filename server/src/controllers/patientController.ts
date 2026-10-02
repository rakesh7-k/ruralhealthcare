import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../config/database.js';
import { CareJourneyStatus, CareEventType, Gender } from '@sethu/shared';

export async function listPatients(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const query = (req.query.q as string || '').trim().toLowerCase();
  const village = (req.query.village as string || '').trim();

  let sql = `
    SELECT p.id, p.user_id, p.full_name, p.date_of_birth, p.gender, p.blood_group,
           p.village, p.district, p.phone, p.abha_id, p.registered_at,
           cj.id as active_journey_id, cj.status as journey_status, cj.primary_complaint,
           (SELECT COUNT(*) FROM followups f WHERE f.patient_id = p.id AND f.status = 'PENDING') as pending_followups_count,
           (SELECT COUNT(*) FROM care_breaks cb WHERE cb.patient_id = p.id AND cb.status IN ('DETECTED', 'ASSIGNED', 'INVESTIGATING')) as active_care_breaks_count
    FROM patients p
    LEFT JOIN care_journeys cj ON p.id = cj.patient_id AND cj.completed_at IS NULL
    WHERE 1=1
  `;
  const params: any[] = [];

  if (query) {
    sql += ` AND (LOWER(p.full_name) LIKE ? OR p.phone LIKE ? OR p.abha_id LIKE ? OR LOWER(p.village) LIKE ?)`;
    params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
  }

  if (village) {
    sql += ` AND LOWER(p.village) = LOWER(?)`;
    params.push(village);
  }

  sql += ` ORDER BY p.registered_at DESC LIMIT 50`;

  const rows = db.prepare(sql).all(...params) as any[];

  res.json({
    success: true,
    data: rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      fullName: r.full_name,
      dateOfBirth: r.date_of_birth,
      gender: r.gender,
      bloodGroup: r.blood_group,
      village: r.village,
      district: r.district,
      phone: r.phone,
      abhaId: r.abha_id,
      registeredAt: r.registered_at,
      activeJourney: r.active_journey_id ? {
        id: r.active_journey_id,
        status: r.journey_status,
        primaryComplaint: r.primary_complaint,
      } : null,
      pendingFollowupsCount: r.pending_followups_count,
      activeCareBreaksCount: r.active_care_breaks_count,
    })),
  });
}

export async function getPatientById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = getDatabase();

  const patient = db.prepare(`
    SELECT p.*, u.preferred_language
    FROM patients p
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(id) as any;

  if (!patient) {
    res.status(404).json({
      success: false,
      error: { code: 'PATIENT_NOT_FOUND', message: 'Patient record not found' },
    });
    return;
  }

  const caregivers = db.prepare(`
    SELECT id, caregiver_name, relationship, phone, is_primary
    FROM patient_caregivers
    WHERE patient_id = ?
  `).all(id);

  const activeJourney = db.prepare(`
    SELECT cj.*, f.name as facility_name, u.full_name as worker_name
    FROM care_journeys cj
    LEFT JOIN facilities f ON cj.current_facility_id = f.id
    LEFT JOIN users u ON cj.assigned_worker_id = u.id
    WHERE cj.patient_id = ? AND cj.completed_at IS NULL
    ORDER BY cj.started_at DESC LIMIT 1
  `).get(id) as any;

  res.json({
    success: true,
    data: {
      patient: {
        id: patient.id,
        userId: patient.user_id,
        fullName: patient.full_name,
        dateOfBirth: patient.date_of_birth,
        gender: patient.gender,
        bloodGroup: patient.blood_group,
        village: patient.village,
        district: patient.district,
        state: patient.state,
        phone: patient.phone,
        abhaId: patient.abha_id,
        registrationSource: patient.registration_source,
        registeredAt: patient.registered_at,
      },
      caregivers,
      activeJourney: activeJourney ? {
        id: activeJourney.id,
        status: activeJourney.status,
        primaryComplaint: activeJourney.primary_complaint,
        startedAt: activeJourney.started_at,
        currentFacilityName: activeJourney.facility_name,
        assignedWorkerName: activeJourney.worker_name,
      } : null,
    },
  });
}

export async function createPatient(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const {
    fullName,
    dateOfBirth,
    gender,
    village,
    district = 'Kaveri',
    state = 'Tamil Nadu',
    phone,
    abhaId,
    caregiverName,
    caregiverRelationship,
    caregiverPhone,
    initialComplaint,
  } = req.body;

  if (!fullName || !village || !gender) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Full name, village, and gender are required' },
    });
    return;
  }

  const patientId = `pat-${uuidv4().substring(0, 8)}`;
  const registeredBy = req.user?.userId || 'usr-worker-01';

  db.transaction(() => {
    // 1. Insert patient
    db.prepare(`
      INSERT INTO patients (id, full_name, date_of_birth, gender, village, district, state, phone, abha_id, registration_source, registered_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WORKER', ?)
    `).run(patientId, fullName, dateOfBirth || null, gender, village, district, state, phone || null, abhaId || null, registeredBy);

    // 2. Insert caregiver if provided
    if (caregiverName && caregiverPhone) {
      db.prepare(`
        INSERT INTO patient_caregivers (id, patient_id, caregiver_name, relationship, phone, is_primary)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(`cg-${uuidv4().substring(0, 8)}`, patientId, caregiverName, caregiverRelationship || 'Family', caregiverPhone);
    }

    // 3. Initiate active care journey if initial complaint provided
    if (initialComplaint) {
      const journeyId = `cj-${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO care_journeys (id, patient_id, status, primary_complaint, assigned_worker_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(journeyId, patientId, CareJourneyStatus.ACTIVE, initialComplaint, registeredBy);

      // Record Care Event
      db.prepare(`
        INSERT INTO care_events (id, care_journey_id, patient_id, event_type, event_data, actor_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `ce-${uuidv4().substring(0, 8)}`,
        journeyId,
        patientId,
        CareEventType.REGISTRATION,
        JSON.stringify({ complaint: initialComplaint, source: 'assisted_registration' }),
        registeredBy
      );
    }
  })();

  res.status(201).json({
    success: true,
    data: {
      patientId,
      message: 'Patient registered successfully with active care journey.',
    },
  });
}

export async function getPatientJourney(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = getDatabase();

  const journey = db.prepare(`
    SELECT cj.*, f.name as facility_name, u.full_name as worker_name, p.full_name as patient_name,
           p.village, p.phone, p.gender, p.date_of_birth
    FROM care_journeys cj
    JOIN patients p ON cj.patient_id = p.id
    LEFT JOIN facilities f ON cj.current_facility_id = f.id
    LEFT JOIN users u ON cj.assigned_worker_id = u.id
    WHERE cj.patient_id = ?
    ORDER BY cj.started_at DESC LIMIT 1
  `).get(id) as any;

  if (!journey) {
    res.status(404).json({
      success: false,
      error: { code: 'JOURNEY_NOT_FOUND', message: 'No care journey found for this patient' },
    });
    return;
  }

  // Get chronological events
  const events = db.prepare(`
    SELECT ce.id, ce.event_type, ce.event_data, ce.created_at, f.name as facility_name, u.full_name as actor_name
    FROM care_events ce
    LEFT JOIN facilities f ON ce.facility_id = f.id
    LEFT JOIN users u ON ce.actor_id = u.id
    WHERE ce.care_journey_id = ?
    ORDER BY ce.created_at ASC
  `).all(journey.id) as any[];

  // Get appointments
  const appointments = db.prepare(`
    SELECT a.*, f.name as facility_name, f.address as facility_address, f.phone as facility_phone
    FROM appointments a
    LEFT JOIN facilities f ON a.facility_id = f.id
    WHERE a.care_journey_id = ? OR a.patient_id = ?
    ORDER BY a.scheduled_at ASC
  `).all(journey.id, id);

  // Get referrals
  const referrals = db.prepare(`
    SELECT r.*, sf.name as source_facility_name, tf.name as target_facility_name,
           tf.address as target_facility_address, tf.phone as target_facility_phone
    FROM referrals r
    LEFT JOIN facilities sf ON r.source_facility_id = sf.id
    LEFT JOIN facilities tf ON r.target_facility_id = tf.id
    WHERE r.care_journey_id = ? OR r.patient_id = ?
    ORDER BY r.created_at DESC
  `).all(journey.id, id);

  // Get follow-ups
  const followups = db.prepare(`
    SELECT f.*, u.full_name as worker_name, u.phone as worker_phone
    FROM followups f
    LEFT JOIN users u ON f.assigned_worker_id = u.id
    WHERE f.care_journey_id = ? OR f.patient_id = ?
    ORDER BY f.due_date ASC
  `).all(journey.id, id);

  // Get care breaks
  const careBreaks = db.prepare(`
    SELECT cb.*, br.barrier_type, br.description as barrier_description
    FROM care_breaks cb
    LEFT JOIN barrier_reports br ON cb.id = br.care_break_id
    WHERE cb.care_journey_id = ? OR cb.patient_id = ?
  `).all(journey.id, id);

  res.json({
    success: true,
    data: {
      journey: {
        id: journey.id,
        patientId: journey.patient_id,
        patientName: journey.patient_name,
        village: journey.village,
        phone: journey.phone,
        gender: journey.gender,
        dateOfBirth: journey.date_of_birth,
        status: journey.status,
        primaryComplaint: journey.primary_complaint,
        startedAt: journey.started_at,
        completedAt: journey.completed_at,
        currentFacilityName: journey.facility_name,
        assignedWorkerName: journey.worker_name,
      },
      events: events.map(e => ({
        id: e.id,
        eventType: e.event_type,
        eventData: typeof e.event_data === 'string' ? JSON.parse(e.event_data || '{}') : e.event_data,
        facilityName: e.facility_name,
        actorName: e.actor_name,
        createdAt: e.created_at,
      })),
      appointments,
      referrals,
      followups,
      careBreaks,
    },
  });
}

export async function getMyJourney(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const userId = req.user?.userId;

  // Find patient record mapped to logged-in user (fallback to pat-01 for demo if needed)
  let patient = db.prepare(`SELECT * FROM patients WHERE user_id = ?`).get(userId) as any;
  if (!patient) {
    patient = db.prepare(`SELECT * FROM patients WHERE id = 'pat-01'`).get() as any;
  }

  if (!patient) {
    res.status(404).json({
      success: false,
      error: { code: 'PATIENT_NOT_FOUND', message: 'No patient record linked to current user' },
    });
    return;
  }

  // Get active journey
  const journey = db.prepare(`
    SELECT cj.*, f.name as facility_name, f.address as facility_address, f.phone as facility_phone,
           u.full_name as worker_name, u.phone as worker_phone
    FROM care_journeys cj
    LEFT JOIN facilities f ON cj.current_facility_id = f.id
    LEFT JOIN users u ON cj.assigned_worker_id = u.id
    WHERE cj.patient_id = ?
    ORDER BY cj.started_at DESC LIMIT 1
  `).get(patient.id) as any;

  // Upcoming appointment if any
  const nextAppointment = db.prepare(`
    SELECT a.*, f.name as facility_name, f.address as facility_address, f.phone as facility_phone
    FROM appointments a
    JOIN facilities f ON a.facility_id = f.id
    WHERE a.patient_id = ? AND a.status IN ('SCHEDULED', 'CONFIRMED')
    ORDER BY a.scheduled_at ASC LIMIT 1
  `).get(patient.id) as any;

  // Active referral if any
  const activeReferral = db.prepare(`
    SELECT r.*, tf.name as target_facility_name, tf.address as target_facility_address,
           tf.phone as target_facility_phone
    FROM referrals r
    JOIN facilities tf ON r.target_facility_id = tf.id
    WHERE r.patient_id = ? AND r.status NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')
    ORDER BY r.created_at DESC LIMIT 1
  `).get(patient.id) as any;

  // Pending follow-up
  const nextFollowup = db.prepare(`
    SELECT f.*, u.full_name as worker_name, u.phone as worker_phone
    FROM followups f
    LEFT JOIN users u ON f.assigned_worker_id = u.id
    WHERE f.patient_id = ? AND f.status = 'PENDING'
    ORDER BY f.due_date ASC LIMIT 1
  `).get(patient.id) as any;

  // Active care break
  const activeCareBreak = db.prepare(`
    SELECT cb.*, br.barrier_type, br.description as barrier_description
    FROM care_breaks cb
    LEFT JOIN barrier_reports br ON cb.id = br.care_break_id
    WHERE cb.patient_id = ? AND cb.status IN ('DETECTED', 'ASSIGNED', 'INVESTIGATING')
    LIMIT 1
  `).get(patient.id) as any;

  // Derive plain-language "NEXT ACTION"
  let nextAction = {
    actionType: 'REST_AND_MONITOR',
    title: 'Rest & Await Follow-Up',
    description: 'Continue your prescribed medications. Your health worker will contact you for your routine check.',
    facilityName: journey?.facility_name || 'Nilgiri Health Centre',
    facilityAddress: journey?.facility_address || 'Village Sub Centre',
    facilityPhone: journey?.facility_phone || '04262-200001',
    date: nextFollowup?.due_date || null,
    contactWorkerName: journey?.worker_name || 'Asha Devi',
    contactWorkerPhone: journey?.worker_phone || '9876500001',
  };

  if (activeCareBreak) {
    nextAction = {
      actionType: 'RESOLVE_BARRIER',
      title: 'Action Needed: Care Continuity Issue Detected',
      description: `A break in your care journey was detected (${activeCareBreak.break_type.replace(/_/g, ' ')}). Your health worker ${journey?.worker_name || 'Asha Devi'} is coordinating support.`,
      facilityName: journey?.facility_name || '',
      facilityAddress: journey?.facility_address || '',
      facilityPhone: journey?.facility_phone || '',
      date: null,
      contactWorkerName: journey?.worker_name || 'Asha Devi',
      contactWorkerPhone: journey?.worker_phone || '9876500001',
    };
  } else if (activeReferral) {
    nextAction = {
      actionType: 'TRAVEL_TO_FACILITY',
      title: `Visit ${activeReferral.target_facility_name}`,
      description: `You have been referred for ${activeReferral.reason}. Please visit the hospital by ${new Date(activeReferral.expected_arrival_by || Date.now()).toLocaleDateString()}.`,
      facilityName: activeReferral.target_facility_name,
      facilityAddress: activeReferral.target_facility_address,
      facilityPhone: activeReferral.target_facility_phone,
      date: activeReferral.expected_arrival_by,
      contactWorkerName: journey?.worker_name || 'Asha Devi',
      contactWorkerPhone: journey?.worker_phone || '9876500001',
    };
  } else if (nextAppointment) {
    nextAction = {
      actionType: 'ATTEND_APPOINTMENT',
      title: `Scheduled Visit at ${nextAppointment.facility_name}`,
      description: `Your appointment is scheduled for ${new Date(nextAppointment.scheduled_at).toLocaleString()}.`,
      facilityName: nextAppointment.facility_name,
      facilityAddress: nextAppointment.facility_address,
      facilityPhone: nextAppointment.facility_phone,
      date: nextAppointment.scheduled_at,
      contactWorkerName: journey?.worker_name || 'Asha Devi',
      contactWorkerPhone: journey?.worker_phone || '9876500001',
    };
  } else if (nextFollowup) {
    nextAction = {
      actionType: 'HOME_VISIT_DUE',
      title: `Upcoming Health Worker Check (${nextFollowup.follow_up_type.replace(/_/g, ' ')})`,
      description: `Your health worker ${nextFollowup.worker_name || 'Asha Devi'} will check on you on or before ${new Date(nextFollowup.due_date).toLocaleDateString()}.`,
      facilityName: journey?.facility_name || 'Local Health Centre',
      facilityAddress: journey?.facility_address || '',
      facilityPhone: journey?.facility_phone || '',
      date: nextFollowup.due_date,
      contactWorkerName: nextFollowup.worker_name || 'Asha Devi',
      contactWorkerPhone: nextFollowup.worker_phone || '9876500001',
    };
  }

  res.json({
    success: true,
    data: {
      patient: {
        id: patient.id,
        fullName: patient.full_name,
        village: patient.village,
        phone: patient.phone,
        bloodGroup: patient.blood_group,
        gender: patient.gender,
      },
      journey: journey ? {
        id: journey.id,
        status: journey.status,
        primaryComplaint: journey.primary_complaint,
        startedAt: journey.started_at,
        currentFacilityName: journey.facility_name,
        assignedWorkerName: journey.worker_name,
        assignedWorkerPhone: journey.worker_phone,
      } : null,
      nextAction,
      nextAppointment,
      activeReferral,
      nextFollowup,
      activeCareBreak,
    },
  });
}
