import {
  DataTrustScore,
  TrustLevel,
  UpdateSource,
  VerificationState,
  TRUST_SCORE_WEIGHTS,
  FRESHNESS_SCORES,
  SOURCE_RELIABILITY,
  VERIFICATION_MULTIPLIERS,
  CROSS_CHECK_MULTIPLIERS,
  TRUST_LEVEL_THRESHOLDS,
} from '@sethu/shared';

export interface DataTrustParams {
  lastUpdatedAt: string; // ISO date string or SQLite datetime
  source: UpdateSource | string;
  verificationState: VerificationState | string;
  reportCount?: number;
  isConsistent?: boolean;
}

/**
 * Calculates a transparent, deterministic Data Trust Score (0–100)
 * based on freshness, source reliability, verification status, and cross-checks.
 */
export function calculateDataTrustScore(params: DataTrustParams): DataTrustScore {
  const now = new Date();
  const lastUpdated = new Date(params.lastUpdatedAt);
  const diffMs = Math.max(0, now.getTime() - lastUpdated.getTime());
  const ageHours = diffMs / (1000 * 60 * 60);

  // 1. Freshness Score (40%)
  let freshnessScore = 15; // default for 7+ days
  let ageCategory = '7+ days';

  for (const entry of FRESHNESS_SCORES) {
    if (ageHours <= entry.maxHours) {
      freshnessScore = entry.score;
      ageCategory = entry.label;
      break;
    }
  }

  // 2. Source Reliability Score (25%)
  const sourceKey = String(params.source);
  const sourceInfo = SOURCE_RELIABILITY[sourceKey] || { multiplier: 0.7, label: 'Unknown source' };
  const sourceScore = sourceInfo.multiplier * 100;

  // 3. Verification Status Score (20%)
  const verKey = String(params.verificationState);
  const verInfo = VERIFICATION_MULTIPLIERS[verKey] || { multiplier: 0.3, label: 'Unverified' };
  const verificationScore = verInfo.multiplier * 100;

  // 4. Cross-check / Consistency Score (15%)
  const reportCount = params.reportCount ?? 1;
  const isConsistent = params.isConsistent ?? true;

  let consistencyKey = 'SINGLE_SOURCE';
  if (reportCount > 1) {
    consistencyKey = isConsistent ? 'CONSISTENT' : 'CONFLICTING';
  }

  const crossCheckInfo = CROSS_CHECK_MULTIPLIERS[consistencyKey] || CROSS_CHECK_MULTIPLIERS.SINGLE_SOURCE;
  const crossCheckScore = crossCheckInfo.multiplier * 100;

  // Aggregate weighted score
  const overall = Math.round(
    freshnessScore * TRUST_SCORE_WEIGHTS.FRESHNESS +
    sourceScore * TRUST_SCORE_WEIGHTS.SOURCE_RELIABILITY +
    verificationScore * TRUST_SCORE_WEIGHTS.VERIFICATION_STATUS +
    crossCheckScore * TRUST_SCORE_WEIGHTS.CROSS_CHECK
  );

  // Level classification
  let level: TrustLevel = TrustLevel.LOW;
  if (overall >= TRUST_LEVEL_THRESHOLDS.HIGH) {
    level = TrustLevel.HIGH;
  } else if (overall >= TRUST_LEVEL_THRESHOLDS.MEDIUM) {
    level = TrustLevel.MEDIUM;
  }

  return {
    overall,
    level,
    breakdown: {
      freshness: {
        score: freshnessScore,
        weight: TRUST_SCORE_WEIGHTS.FRESHNESS,
        lastUpdated: params.lastUpdatedAt,
        ageHours: Math.round(ageHours * 10) / 10,
        ageCategory,
      },
      sourceReliability: {
        score: sourceScore,
        weight: TRUST_SCORE_WEIGHTS.SOURCE_RELIABILITY,
        source: params.source as UpdateSource,
        multiplier: sourceInfo.multiplier,
      },
      verificationStatus: {
        score: verificationScore,
        weight: TRUST_SCORE_WEIGHTS.VERIFICATION_STATUS,
        state: params.verificationState as VerificationState,
        multiplier: verInfo.multiplier,
      },
      crossCheck: {
        score: crossCheckScore,
        weight: TRUST_SCORE_WEIGHTS.CROSS_CHECK,
        reportCount,
        consistency: consistencyKey as 'CONSISTENT' | 'SINGLE_SOURCE' | 'CONFLICTING',
        multiplier: crossCheckInfo.multiplier,
      },
    },
  };
}
