// ============================================================
// SETHU — Care Route Assurance Types
// ============================================================
// The core innovation. These types represent the evaluation of
// facility candidates against a patient's care requirements,
// with transparent trust scoring and explainable recommendations.
// ============================================================

import { ResourceStatus, RouteRecommendation } from './enums.js';
import { DataTrustScore } from './facility.js';

/** Result of evaluating a single capability against a facility. */
export interface CapabilityMatch {
  required: string;                 // What the patient needs (e.g., "X-ray")
  available: boolean | null;        // null = unknown, honest representation
  status: ResourceStatus;
  trustScore: DataTrustScore;
  concern: string | null;           // Human-readable concern (e.g., "Data is 12 days stale")
}

/** Evaluation of one facility against the care requirement. */
export interface FacilityMatch {
  facilityId: string;
  facilityName: string;
  facilityType: string;
  overallScore: number;             // 0-100 composite score
  canCompleteCare: boolean;         // Can ALL requirements be met with reasonable confidence?
  capabilities: {
    specialist: CapabilityMatch | null;
    diagnostics: CapabilityMatch[];
    medicines: CapabilityMatch[];
  };
  distanceKm: number;
  estimatedWaitMinutes: number | null;
  dataFreshnessScore: number;       // Average trust across matched resources
  recommendation: RouteRecommendation;
  concerns: string[];               // All concerns aggregated
  selectionExplanation: string;     // Why this facility is/isn't recommended
}

/** Complete result of a Care Route Assurance evaluation. */
export interface CareRouteEvaluation {
  id: string;
  careRequirementId: string;
  patientId: string;
  patientLocation: {
    latitude: number;
    longitude: number;
    village: string;
  } | null;
  evaluatedAt: string;
  facilities: FacilityMatch[];      // All evaluated, sorted by recommendation
  selectedFacilityId: string | null;
  selectionReason: string;          // Human-readable explanation of final choice
  evaluatedBy: string;              // userId who triggered the evaluation
}

/** Score breakdown for the completion score formula. */
export interface CompletionScoreBreakdown {
  capabilityMatchScore: number;     // % of requirements matched with HIGH/MEDIUM trust
  capabilityWeight: number;         // 0.30
  dataFreshnessScore: number;       // Average trust across matched resources
  freshnessWeight: number;          // 0.25
  distanceScore: number;            // Inverse normalized distance
  distanceWeight: number;           // 0.20
  waitTimeScore: number;            // Shorter = better
  waitTimeWeight: number;           // 0.15
  verificationRecencyScore: number; // More recently verified = better
  verificationWeight: number;       // 0.10
  total: number;                    // Weighted sum
}
