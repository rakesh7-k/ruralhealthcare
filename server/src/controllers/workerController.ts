import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export async function getWorkerDashboard(req: Request, res: Response): Promise<void> {
  const db = getDatabase();
  const workerId = req.user?.userId || 'usr-worker-01';

  // 1. Care Breaks requiring immediate intervention
  const careBreaks = db.prepare(`
    SELECT cb.id, cb.care_journey_id, cb.patient_id, cb.break_type, cb.expected_action,
           cb.expected_by, cb.detected_at, cb.status, p.full_name as patient_name,
           p.village, p.phone, p.gender, br.barrier_type, br.description as barrier_description
    FROM care_breaks cb
    JOIN patients p ON cb.patient_id = p.id
    LEFT JOIN barrier_reports br ON cb.id = br.care_break_id
    WHERE cb.status IN ('DETECTED', 'ASSIGNED', 'INVESTIGATING')
    ORDER BY cb.detected_at DESC
  `).all() as any[];

  // 2. Overdue & Due Follow-ups
  const overdueFollowups = db.prepare(`
    SELECT f.id, f.patient_id, f.care_journey_id, f.follow_up_type, f.due_date, f.status,
           p.full_name as patient_name, p.village, p.phone, p.gender,
           cj.primary_complaint
    FROM followups f
    JOIN patients p ON f.patient_id = p.id
    LEFT JOIN care_journeys cj ON f.care_journey_id = cj.id
    WHERE f.status = 'MISSED' OR (f.status = 'PENDING' AND date(f.due_date) < date('now'))
    ORDER BY f.due_date ASC
  `).all() as any[];

  const todayFollowups = db.prepare(`
    SELECT f.id, f.patient_id, f.care_journey_id, f.follow_up_type, f.due_date, f.status,
           p.full_name as patient_name, p.village, p.phone, p.gender,
           cj.primary_complaint
    FROM followups f
    JOIN patients p ON f.patient_id = p.id
    LEFT JOIN care_journeys cj ON f.care_journey_id = cj.id
    WHERE f.status = 'PENDING' AND date(f.due_date) = date('now')
    ORDER BY f.due_date ASC
  `).all() as any[];

  const upcomingFollowups = db.prepare(`
    SELECT f.id, f.patient_id, f.care_journey_id, f.follow_up_type, f.due_date, f.status,
           p.full_name as patient_name, p.village, p.phone, p.gender,
           cj.primary_complaint
    FROM followups f
    JOIN patients p ON f.patient_id = p.id
    LEFT JOIN care_journeys cj ON f.care_journey_id = cj.id
    WHERE f.status = 'PENDING' AND date(f.due_date) > date('now')
    ORDER BY f.due_date ASC LIMIT 5
  `).all() as any[];

  // 3. Referrals in transit for community patients
  const activeReferrals = db.prepare(`
    SELECT r.id, r.patient_id, r.care_journey_id, r.status, r.urgency, r.reason,
           r.expected_arrival_by, r.created_at, p.full_name as patient_name,
           p.village, p.phone, sf.name as source_facility_name, tf.name as target_facility_name
    FROM referrals r
    JOIN patients p ON r.patient_id = p.id
    LEFT JOIN facilities sf ON r.source_facility_id = sf.id
    LEFT JOIN facilities tf ON r.target_facility_id = tf.id
    WHERE r.status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')
    ORDER BY r.created_at DESC LIMIT 5
  `).all() as any[];

  // 4. Today's Appointments
  const todayAppointments = db.prepare(`
    SELECT a.id, a.patient_id, a.facility_id, a.appointment_type, a.scheduled_at, a.status,
           p.full_name as patient_name, p.village, p.phone, f.name as facility_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    LEFT JOIN facilities f ON a.facility_id = f.id
    WHERE date(a.scheduled_at) = date('now')
    ORDER BY a.scheduled_at ASC
  `).all() as any[];

  // 5. Worker metrics summary
  const summary = {
    criticalCareBreaksCount: careBreaks.length,
    overdueFollowupsCount: overdueFollowups.length,
    todayFollowupsCount: todayFollowups.length,
    activeReferralsCount: activeReferrals.length,
    totalCommunityPatients: (db.prepare(`SELECT COUNT(*) as count FROM patients`).get() as any).count,
  };

  res.json({
    success: true,
    data: {
      summary,
      careBreaks,
      overdueFollowups,
      todayFollowups,
      upcomingFollowups,
      activeReferrals,
      todayAppointments,
    },
  });
}
