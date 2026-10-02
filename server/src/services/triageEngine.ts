import { TriageLevel, VitalSigns, SymptomEntry, WarningSign } from '@sethu/shared';

export interface TriageEvaluationInput {
  vitals?: Partial<VitalSigns>;
  symptoms?: SymptomEntry[];
  warningSigns?: WarningSign[];
  medicalHistoryFlags?: string[];
}

export interface TriageEvaluationOutput {
  triageLevel: TriageLevel;
  redFlags: string[];
  reasons: string[];
  recommendedAction: string;
  isEmergencyEscalation: boolean;
  isDecisionSupportOnly: true;
}

/**
 * Deterministic, explainable Digital Triage Rule Engine.
 * Explicitly labeled as "Decision Support / Triage Assistance", NOT a medical diagnosis.
 */
export function evaluateTriage(input: TriageEvaluationInput): TriageEvaluationOutput {
  const redFlags: string[] = [];
  const reasons: string[] = [];
  const vitals = input.vitals || {};
  const symptoms = input.symptoms || [];
  const warningSigns = input.warningSigns || [];

  let isEmergency = false;
  let isUrgent = false;

  // 1. Evaluate Warning Signs (Red Flags)
  for (const sign of warningSigns) {
    if (sign.present) {
      const lower = sign.sign.toLowerCase();
      if (
        lower.includes('chest pain') ||
        lower.includes('breathing') ||
        lower.includes('consciousness') ||
        lower.includes('bleeding') ||
        lower.includes('stroke') ||
        lower.includes('seizure')
      ) {
        isEmergency = true;
        redFlags.push(`Critical Warning Sign: ${sign.sign}`);
      } else {
        isUrgent = true;
        reasons.push(`Reported Warning Sign: ${sign.sign}`);
      }
    }
  }

  // 2. Evaluate Vital Signs Thresholds
  if (vitals.oxygenSaturation !== null && vitals.oxygenSaturation !== undefined) {
    if (vitals.oxygenSaturation < 90) {
      isEmergency = true;
      redFlags.push(`Severe Hypoxemia: SpO2 ${vitals.oxygenSaturation}% (<90%)`);
    } else if (vitals.oxygenSaturation < 94) {
      isUrgent = true;
      reasons.push(`Low Oxygen Saturation: SpO2 ${vitals.oxygenSaturation}% (90-94%)`);
    }
  }

  if (vitals.bloodPressureSystolic !== null && vitals.bloodPressureSystolic !== undefined) {
    if (vitals.bloodPressureSystolic >= 180) {
      isEmergency = true;
      redFlags.push(`Hypertensive Crisis: Systolic BP ${vitals.bloodPressureSystolic} mmHg (≥180)`);
    } else if (vitals.bloodPressureSystolic < 85) {
      isEmergency = true;
      redFlags.push(`Hypotensive Shock Risk: Systolic BP ${vitals.bloodPressureSystolic} mmHg (<85)`);
    } else if (vitals.bloodPressureSystolic >= 140) {
      isUrgent = true;
      reasons.push(`Stage 2 Hypertension: Systolic BP ${vitals.bloodPressureSystolic} mmHg (≥140)`);
    }
  }

  if (vitals.heartRate !== null && vitals.heartRate !== undefined) {
    if (vitals.heartRate >= 130) {
      isEmergency = true;
      redFlags.push(`Severe Tachycardia: Heart rate ${vitals.heartRate} bpm (≥130)`);
    } else if (vitals.heartRate < 45) {
      isEmergency = true;
      redFlags.push(`Severe Bradycardia: Heart rate ${vitals.heartRate} bpm (<45)`);
    } else if (vitals.heartRate >= 100) {
      isUrgent = true;
      reasons.push(`Elevated Heart Rate: ${vitals.heartRate} bpm`);
    }
  }

  if (vitals.temperature !== null && vitals.temperature !== undefined) {
    if (vitals.temperature >= 39.5) {
      isUrgent = true;
      reasons.push(`High Pyrexia: Temperature ${vitals.temperature}°C (≥39.5°C)`);
    }
  }

  // 3. Evaluate Symptom Severity & Duration
  for (const s of symptoms) {
    if (s.severity === 'SEVERE') {
      isUrgent = true;
      reasons.push(`Severe Symptom: ${s.symptom} (${s.duration})`);
    }
    const lowerSymp = s.symptom.toLowerCase();
    if (lowerSymp.includes('chest pain') || lowerSymp.includes('shortness of breath')) {
      isUrgent = true;
      reasons.push(`Cardiac/Respiratory Symptom: ${s.symptom}`);
    }
  }

  // 4. Determine Level and Action
  let triageLevel = TriageLevel.ROUTINE;
  let recommendedAction = 'Routine medical examination and standard clinical evaluation.';

  if (isEmergency) {
    triageLevel = TriageLevel.EMERGENCY;
    recommendedAction =
      'Immediate Emergency Escalation: Alert receiving emergency facility, prepare patient stabilization, and coordinate 108 emergency transport.';
  } else if (isUrgent) {
    triageLevel = TriageLevel.URGENT;
    recommendedAction =
      'Priority Clinical Evaluation: Review by medical officer within 1-2 hours. Consider specialist teleconsultation or diagnostic workup.';
  }

  return {
    triageLevel,
    redFlags,
    reasons,
    recommendedAction,
    isEmergencyEscalation: isEmergency,
    isDecisionSupportOnly: true,
  };
}
