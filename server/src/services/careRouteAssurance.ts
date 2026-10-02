import { getDatabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { calculateDataTrustScore } from './dataTrustScorer.js';
import { RouteRecommendation, ResourceStatus, VerificationState, UpdateSource } from '@sethu/shared';

export interface EvaluateRouteParams {
  careRequirementId: string;
  evaluatedByUserId: string;
}

export interface FacilityMatchResult {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  distanceKm: number;
  estimatedWaitMinutes: number;
  overallScore: number;
  canCompleteCare: boolean;
  recommendation: RouteRecommendation | string;
  specialistMatch: {
    required: string | null;
    available: boolean | null; // null = unknown
    doctorName?: string;
    trustScore: any;
  };
  diagnosticsMatch: Array<{
    name: string;
    status: string; // AVAILABLE, UNAVAILABLE, UNKNOWN, STALE
    trustScore: any;
  }>;
  medicinesMatch: Array<{
    name: string;
    status: string;
    trustScore: any;
  }>;
  dataFreshnessScore: number;
  concerns: string[];
  selectionExplanation: string;
}

export interface CareRouteAssuranceResult {
  evaluationId: string;
  careRequirementId: string;
  patientId: string;
  patientName: string;
  patientVillage: string;
  evaluatedAt: string;
  recommendedFacilityId: string | null;
  recommendedFacilityName: string | null;
  summaryRationale: string;
  facilityMatches: FacilityMatchResult[];
}

// Distance benchmark table from Thenkarai (patient location)
const DISTANCE_BENCHMARKS: Record<string, { km: number; waitMinutes: number }> = {
  'fac-shc-01': { km: 3.5, waitMinutes: 15 },
  'fac-phc-01': { km: 1.2, waitMinutes: 20 },
  'fac-phc-02': { km: 12.0, waitMinutes: 30 },
  'fac-chc-01': { km: 14.5, waitMinutes: 45 },
  'fac-dh-01':  { km: 32.0, waitMinutes: 35 },
};

export function runCareRouteAssurance(params: EvaluateRouteParams): CareRouteAssuranceResult {
  const db = getDatabase();
  const { careRequirementId, evaluatedByUserId } = params;

  // 1. Fetch Care Requirement
  const careReq = db.prepare(`
    SELECT cr.*, p.full_name as patient_name, p.village as patient_village
    FROM care_requirements cr
    JOIN patients p ON cr.patient_id = p.id
    WHERE cr.id = ?
  `).get(careRequirementId) as any;

  if (!careReq) {
    throw new Error(`Care Requirement ${careRequirementId} not found`);
  }

  const diagnosticsNeeded: string[] = JSON.parse(careReq.diagnostics_needed || '[]');
  const medicinesNeeded: string[] = JSON.parse(careReq.medicines_needed || '[]');
  const specialistType: string | null = careReq.specialist_type;

  // 2. Fetch candidate facilities (District level facilities capable of secondary/tertiary care)
  const candidateFacilities = db.prepare(`
    SELECT * FROM facilities WHERE type IN ('DH', 'CHC', 'PHC') ORDER BY bed_count DESC
  `).all() as any[];

  const evaluationId = `cre-${uuidv4().substring(0, 8)}`;
  const facilityMatches: FacilityMatchResult[] = [];

  for (const facility of candidateFacilities) {
    const benchmark = DISTANCE_BENCHMARKS[facility.id] || { km: 25.0, waitMinutes: 40 };
    const distanceKm = benchmark.km;
    const waitMinutes = benchmark.waitMinutes;

    const concerns: string[] = [];
    let capabilitiesMet = 0;
    let capabilitiesTotal = 0;
    const trustScores: number[] = [];

    // --- A. Evaluate Specialist Capability ---
    let specialistAvailable: boolean | null = null;
    let specialistDoctorName: string | undefined;
    let specialistTrust: any = null;

    if (specialistType) {
      capabilitiesTotal++;
      // Flexible root matching for specialist (e.g. cardiology -> cardio, orthopedics -> orthoped)
      const rootSpec = specialistType.toLowerCase().replace(/ology$/, '').replace(/ics$/, '').replace(/ist$/, '').trim();
      const res = db.prepare(`
        SELECT * FROM facility_resources
        WHERE facility_id = ? AND resource_type = 'specialist' 
          AND (LOWER(resource_name) LIKE LOWER(?) OR LOWER(resource_name) LIKE LOWER(?))
        ORDER BY last_updated_at DESC LIMIT 1
      `).get(facility.id, `%${rootSpec}%`, `%${specialistType}%`) as any;

      if (res) {
        specialistDoctorName = res.resource_name;
        specialistTrust = calculateDataTrustScore({
          lastUpdatedAt: res.last_updated_at || new Date().toISOString(),
          source: res.update_source || UpdateSource.FACILITY_STAFF,
          verificationState: res.verification_state || VerificationState.VERIFIED,
          reportCount: 2,
          isConsistent: true,
        });

        trustScores.push(specialistTrust.overall);

        if (res.status === ResourceStatus.AVAILABLE) {
          specialistAvailable = true;
          capabilitiesMet++;
        } else {
          specialistAvailable = false;
          concerns.push(`Specialist (${specialistType}) is currently marked ${res.status} at ${facility.name}.`);
        }
      } else {
        specialistAvailable = false;
        concerns.push(`No ${specialistType} specialist available at ${facility.name}.`);
        trustScores.push(20);
      }
    }

    // --- B. Evaluate Diagnostics Capability ---
    const diagMatches: Array<{ name: string; status: string; trustScore: any }> = [];

    for (const diag of diagnosticsNeeded) {
      capabilitiesTotal++;
      // Clean diag name for flexible search (e.g. "Chest X-ray" -> "X-Ray")
      const cleanDiag = diag.replace(/chest\s+/i, '').trim();
      const rootDiag = cleanDiag.split(' ')[0].toLowerCase();
      const resource = db.prepare(`
        SELECT * FROM facility_resources
        WHERE facility_id = ? AND resource_type IN ('diagnostic', 'equipment') 
          AND (LOWER(resource_name) LIKE LOWER(?) OR LOWER(resource_name) LIKE LOWER(?) OR LOWER(resource_name) LIKE LOWER(?))
        ORDER BY last_updated_at DESC LIMIT 1
      `).get(facility.id, `%${diag}%`, `%${cleanDiag}%`, `%${rootDiag}%`) as any;

      let diagStatus = ResourceStatus.UNKNOWN;
      let diagTrust: any = null;

      if (resource) {
        diagStatus = resource.status;
        diagTrust = calculateDataTrustScore({
          lastUpdatedAt: resource.last_updated_at || '2026-08-20T10:00:00Z',
          source: resource.update_source || UpdateSource.FACILITY_STAFF,
          verificationState: resource.verification_state || VerificationState.UNVERIFIED,
          reportCount: resource.update_source === 'CITIZEN_REPORT' ? 1 : 2,
          isConsistent: resource.status !== ResourceStatus.UNKNOWN,
        });

        trustScores.push(diagTrust.overall);

        if (resource.status === ResourceStatus.AVAILABLE) {
          capabilitiesMet++;
        } else if (resource.status === ResourceStatus.UNKNOWN || resource.status === ResourceStatus.STALE) {
          concerns.push(`${diag} status is UNCERTAIN/STALE (${diagTrust.breakdown.freshness.ageCategory} old data). Care cannot be guaranteed.`);
        } else {
          concerns.push(`${diag} is currently ${resource.status} at this facility.`);
        }
      } else {
        diagStatus = ResourceStatus.UNAVAILABLE;
        diagTrust = calculateDataTrustScore({
          lastUpdatedAt: '2026-08-01T00:00:00Z',
          source: UpdateSource.SYSTEM_API,
          verificationState: VerificationState.UNVERIFIED,
          reportCount: 1,
        });
        trustScores.push(10);
        concerns.push(`${diag} service does not exist at ${facility.name}.`);
      }

      diagMatches.push({
        name: diag,
        status: diagStatus,
        trustScore: diagTrust,
      });
    }

    // --- C. Evaluate Medicines Capability ---
    const medMatches: Array<{ name: string; status: string; trustScore: any }> = [];

    for (const med of medicinesNeeded) {
      capabilitiesTotal++;
      const medicineRecord = db.prepare(`
        SELECT fm.*, m.name as medicine_name
        FROM facility_medicines fm
        JOIN medicines m ON fm.medicine_id = m.id
        WHERE fm.facility_id = ? AND LOWER(m.name) LIKE LOWER(?)
        LIMIT 1
      `).get(facility.id, `%${med.split(' ')[0]}%`) as any;

      let medStatus = ResourceStatus.UNKNOWN;
      let medTrust: any = null;

      if (medicineRecord) {
        medStatus = medicineRecord.status;
        medTrust = calculateDataTrustScore({
          lastUpdatedAt: medicineRecord.last_updated_at || new Date().toISOString(),
          source: medicineRecord.update_source || UpdateSource.FACILITY_STAFF,
          verificationState: medicineRecord.verification_state || VerificationState.VERIFIED,
          reportCount: 2,
          isConsistent: true,
        });

        trustScores.push(medTrust.overall);

        if (medicineRecord.status === ResourceStatus.AVAILABLE || medicineRecord.status === 'LIMITED') {
          capabilitiesMet++;
        } else {
          concerns.push(`Medicine ${med} stock is ${medicineRecord.status}.`);
        }
      } else {
        medStatus = ResourceStatus.UNAVAILABLE;
        medTrust = calculateDataTrustScore({
          lastUpdatedAt: '2026-08-01T00:00:00Z',
          source: UpdateSource.SYSTEM_API,
          verificationState: VerificationState.UNVERIFIED,
        });
        trustScores.push(15);
      }

      medMatches.push({
        name: med,
        status: medStatus,
        trustScore: medTrust,
      });
    }

    // --- D. Compute Transparent Care Route Assurance Score ---
    const avgTrustScore = trustScores.length > 0
      ? Math.round(trustScores.reduce((a, b) => a + b, 0) / trustScores.length)
      : 30;

    const capabilityRatio = capabilitiesTotal > 0 ? (capabilitiesMet / capabilitiesTotal) : 1;
    const canCompleteCare = capabilitiesMet === capabilitiesTotal && avgTrustScore >= 60;

    // Component weights
    // 30% Capability Match
    const capabilityScore = Math.round(capabilityRatio * 100 * 0.30);
    // 25% Data Trust Score
    const trustScoreComponent = Math.round(avgTrustScore * 0.25);
    // 20% Distance score (100 for 0km, 0 for 100km)
    const distanceScoreVal = Math.max(0, 100 - distanceKm * 2);
    const distanceComponent = Math.round(distanceScoreVal * 0.20);
    // 15% Wait time score (100 for 0min, 0 for 120min)
    const waitScoreVal = Math.max(0, 100 - (waitMinutes / 120) * 100);
    const waitComponent = Math.round(waitScoreVal * 0.15);
    // 10% Verification Recency
    const verificationComponent = Math.round((avgTrustScore >= 70 ? 100 : 40) * 0.10);

    const overallScore = Math.min(100, Math.max(0, capabilityScore + trustScoreComponent + distanceComponent + waitComponent + verificationComponent));

    // Determine Recommendation Level
    let recommendation: RouteRecommendation = RouteRecommendation.NOT_RECOMMENDED;
    let explanation = '';

    if (canCompleteCare && overallScore >= 70) {
      recommendation = RouteRecommendation.RECOMMENDED;
      explanation = `Recommended Route: All required capabilities (${specialistType || 'General'}, ${diagnosticsNeeded.join(', ')}, ${medicinesNeeded.join(', ')}) verified AVAILABLE with high data confidence (${avgTrustScore}% trust score). Distance of ${distanceKm} km is clinically justified to guarantee complete care.`;
    } else if (capabilitiesMet >= capabilitiesTotal - 1 && avgTrustScore >= 50) {
      recommendation = RouteRecommendation.POSSIBLE;
      explanation = `Partial capability match at ${facility.name} (${capabilitiesMet}/${capabilitiesTotal} requirements met). May require secondary referral for remaining services.`;
    } else if (concerns.some(c => c.includes('UNCERTAIN') || c.includes('STALE'))) {
      recommendation = RouteRecommendation.INSUFFICIENT_DATA;
      explanation = `High Uncertainty Risk: Although located ${distanceKm} km away, vital services (e.g. diagnostics) have stale or unverified records. Blind referral here risks care failure and care break.`;
    } else {
      recommendation = RouteRecommendation.NOT_RECOMMENDED;
      explanation = `Care cannot be completed at ${facility.name}. Missing essential clinical capabilities: ${concerns.join('; ')}.`;
    }

    facilityMatches.push({
      facilityId: facility.id,
      facilityName: facility.name,
      facilityType: facility.type,
      distanceKm,
      estimatedWaitMinutes: waitMinutes,
      overallScore,
      canCompleteCare,
      recommendation,
      specialistMatch: {
        required: specialistType,
        available: specialistAvailable,
        doctorName: specialistDoctorName,
        trustScore: specialistTrust,
      },
      diagnosticsMatch: diagMatches,
      medicinesMatch: medMatches,
      dataFreshnessScore: avgTrustScore,
      concerns,
      selectionExplanation: explanation,
    });
  }

  // Sort: RECOMMENDED first, then by overallScore descending
  facilityMatches.sort((a, b) => {
    if (a.recommendation === RouteRecommendation.RECOMMENDED && b.recommendation !== RouteRecommendation.RECOMMENDED) return -1;
    if (b.recommendation === RouteRecommendation.RECOMMENDED && a.recommendation !== RouteRecommendation.RECOMMENDED) return 1;
    return b.overallScore - a.overallScore;
  });

  const recommendedMatch = facilityMatches.find(m => m.recommendation === RouteRecommendation.RECOMMENDED);
  const bestMatch = recommendedMatch || facilityMatches.find(m => m.recommendation === RouteRecommendation.POSSIBLE) || facilityMatches[0];

  const summaryRationale = recommendedMatch
    ? `SETHU Care Route Assurance selected ${recommendedMatch.facilityName} (${recommendedMatch.distanceKm} km). Reasoning: It guarantees 100% of the patient's care requirement with freshly verified data (${recommendedMatch.dataFreshnessScore}% trust score), eliminating referral uncertainty.`
    : (bestMatch && bestMatch.canCompleteCare)
    ? `Care Route: ${bestMatch.facilityName} (${bestMatch.distanceKm} km) can complete care.`
    : `Referral Warning: No candidate facility in the district currently guarantees 100% verified care completion without resource uncertainty.`;

  // 3. Persist to DB
  db.transaction(() => {
    db.prepare(`
      INSERT INTO care_route_evaluations (
        id, care_requirement_id, patient_id, patient_latitude, patient_longitude,
        patient_village, evaluated_at, selected_facility_id, selection_reason, evaluated_by
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(
      evaluationId,
      careRequirementId,
      careReq.patient_id,
      careReq.latitude || null,
      careReq.longitude || null,
      careReq.patient_village || 'Thenkarai',
      bestMatch?.facilityId || null,
      summaryRationale,
      evaluatedByUserId
    );

    for (const match of facilityMatches) {
      db.prepare(`
        INSERT INTO facility_matches (
          id, evaluation_id, facility_id, overall_score, can_complete_care,
          specialist_available, specialist_trust_score, diagnostics_match, medicine_match,
          distance_km, estimated_wait_minutes, data_freshness_score, recommendation,
          concerns, selection_explanation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `fm-${uuidv4().substring(0, 8)}`,
        evaluationId,
        match.facilityId,
        match.overallScore,
        match.canCompleteCare ? 1 : 0,
        match.specialistMatch.available === null ? null : (match.specialistMatch.available ? 1 : 0),
        match.specialistMatch.trustScore?.overall || null,
        JSON.stringify(match.diagnosticsMatch),
        JSON.stringify(match.medicinesMatch),
        match.distanceKm,
        match.estimatedWaitMinutes,
        match.dataFreshnessScore,
        match.recommendation,
        JSON.stringify(match.concerns),
        match.selectionExplanation
      );
    }
  })();

  return {
    evaluationId,
    careRequirementId,
    patientId: careReq.patient_id,
    patientName: careReq.patient_name,
    patientVillage: careReq.patient_village,
    evaluatedAt: new Date().toISOString(),
    recommendedFacilityId: bestMatch?.facilityId || null,
    recommendedFacilityName: bestMatch?.facilityName || null,
    summaryRationale,
    facilityMatches,
  };
}
