import { Request, Response } from 'express';
import { getDatabase } from '../config/database.js';

export function getDistrictDashboard(req: Request, res: Response): void {
  try {
    const db = getDatabase();

    const facilityCount = db.prepare('SELECT COUNT(*) as count FROM facilities').get() as { count: number };
    const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
    const activeCareJourneys = db.prepare(
      "SELECT COUNT(*) as count FROM care_journeys WHERE status NOT IN ('COMPLETED','CLOSED')"
    ).get() as { count: number };

    const referrals = db.prepare(`
      SELECT r.*, p.full_name as patient_name, f.name as target_facility_name
      FROM referrals r
      JOIN patients p ON r.patient_id = p.id
      JOIN facilities f ON r.target_facility_id = f.id
      ORDER BY r.created_at DESC
      LIMIT 15
    `).all() as any[];

    const facilities = db.prepare(`
      SELECT f.*, 
             COUNT(DISTINCT cj.patient_id) as patient_count,
             COUNT(DISTINCT r.id) as referral_count,
             COUNT(DISTINCT cr.id) as care_requirement_count
      FROM facilities f
      LEFT JOIN care_journeys cj ON cj.current_facility_id = f.id
      LEFT JOIN referrals r ON r.target_facility_id = f.id
      LEFT JOIN care_requirements cr ON cr.care_journey_id = cj.id
      WHERE f.is_active = 1
      GROUP BY f.id
      ORDER BY f.name
    `).all() as any[];

    const emergencyBreaks = db.prepare(`
      SELECT cb.*, p.full_name as patient_name, cj.status as journey_status
      FROM care_breaks cb
      JOIN patients p ON cb.patient_id = p.id
      LEFT JOIN care_journeys cj ON cb.care_journey_id = cj.id
      ORDER BY cb.detected_at DESC
      LIMIT 8
    `).all() as any[];

    const queueSummary = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM patients) as totalPatients,
        (SELECT COUNT(*) FROM referrals WHERE status NOT IN ('COMPLETED', 'FAILED')) as activeReferrals,
        (SELECT COUNT(*) FROM care_breaks WHERE status = 'DETECTED') as openBreaks,
        (SELECT COUNT(*) FROM teleconsultations WHERE status IN ('SCHEDULED', 'ACTIVE')) as activeTeleconsultations
    `).get() as any;

    const monthlyPerformance = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as total_referrals
      FROM referrals
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
      LIMIT 6
    `).all() as any[];

    const district = {
      totalFacilities: facilityCount.count,
      totalPatients: patientCount.count,
      activeCareJourneys: activeCareJourneys.count,
      activeReferrals: Number(queueSummary.activeReferrals || 0),
      openBreaks: Number(queueSummary.openBreaks || 0),
      activeTeleconsultations: Number(queueSummary.activeTeleconsultations || 0),
    };

    res.json({
      success: true,
      data: {
        district,
        facilities,
        referrals,
        emergencyBreaks,
        monthlyPerformance: monthlyPerformance.reverse(),
      },
    });
  } catch (error: any) {
    console.error('[AdminController] Failed to get district dashboard:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: error.message },
    });
  }
}
