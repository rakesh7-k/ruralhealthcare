// ============================================================
// SETHU — Data Trust Score Configuration
// ============================================================
// Transparent, deterministic, explainable scoring.
// Do NOT use arbitrary "AI confidence".
// Every weight and threshold is documented and can be
// explained to a hackathon judge.
// ============================================================

/**
 * Weights for each component of the Data Trust Score.
 * Sum must equal 1.0.
 */
export const TRUST_SCORE_WEIGHTS = {
  FRESHNESS: 0.40,
  SOURCE_RELIABILITY: 0.25,
  VERIFICATION_STATUS: 0.20,
  CROSS_CHECK: 0.15,
} as const;

/**
 * Freshness score based on data age.
 * More recent data = higher trust.
 */
export const FRESHNESS_SCORES: Array<{ maxHours: number; score: number; label: string }> = [
  { maxHours: 6,     score: 100, label: '0–6 hours' },
  { maxHours: 24,    score: 85,  label: '6–24 hours' },
  { maxHours: 72,    score: 65,  label: '1–3 days' },
  { maxHours: 168,   score: 40,  label: '3–7 days' },
  { maxHours: Infinity, score: 15, label: '7+ days' },
];

/**
 * Source reliability multipliers.
 * Higher multiplier = more trusted source.
 */
export const SOURCE_RELIABILITY: Record<string, { multiplier: number; label: string }> = {
  FACILITY_STAFF:      { multiplier: 1.0,  label: 'Facility verified staff' },
  CLINICAL_STAFF:      { multiplier: 1.0,  label: 'Authorized clinical staff' },
  FRONTLINE_WORKER:    { multiplier: 0.85, label: 'Frontline worker report' },
  PATIENT_REPORT:      { multiplier: 0.70, label: 'Patient/community report' },
  COMMUNITY_REPORT:    { multiplier: 0.70, label: 'Community report' },
  SYSTEM_API:          { multiplier: 1.0,  label: 'Integrated system/API' },
  SYSTEM_STALE_DETECTION: { multiplier: 0.50, label: 'System stale detection' },
};

/**
 * Verification state multipliers.
 */
export const VERIFICATION_MULTIPLIERS: Record<string, { multiplier: number; label: string }> = {
  VERIFIED:            { multiplier: 1.0,  label: 'Verified recently' },
  PARTIALLY_VERIFIED:  { multiplier: 0.6,  label: 'Partially verified' },
  UNVERIFIED:          { multiplier: 0.3,  label: 'Unverified' },
  STALE:               { multiplier: 0.15, label: 'Stale / outdated' },
};

/**
 * Cross-check consistency multipliers.
 */
export const CROSS_CHECK_MULTIPLIERS: Record<string, { multiplier: number; label: string }> = {
  CONSISTENT:          { multiplier: 1.0,  label: 'Multiple consistent reports' },
  SINGLE_SOURCE:       { multiplier: 0.7,  label: 'Single source' },
  CONFLICTING:         { multiplier: 0.4,  label: 'Conflicting reports' },
};

/**
 * Trust level thresholds derived from the overall score.
 */
export const TRUST_LEVEL_THRESHOLDS = {
  HIGH: 70,    // score >= 70
  MEDIUM: 40,  // score >= 40
  // LOW: score < 40
} as const;

/**
 * Care Route Assurance — Completion Score weights.
 * These determine how facility candidates are ranked.
 */
export const COMPLETION_SCORE_WEIGHTS = {
  CAPABILITY_MATCH: 0.30,
  DATA_FRESHNESS: 0.25,
  DISTANCE: 0.20,
  WAIT_TIME: 0.15,
  VERIFICATION_RECENCY: 0.10,
} as const;

/**
 * Maximum reasonable distances for Care Route scoring (km).
 * Beyond this, the distance score drops to 0.
 */
export const MAX_REASONABLE_DISTANCE_KM = 100;

/**
 * Maximum reasonable wait time for scoring (minutes).
 * Beyond this, the wait time score drops to 0.
 */
export const MAX_REASONABLE_WAIT_MINUTES = 180;
