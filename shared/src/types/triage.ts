// ============================================================
// SETHU — Triage Types
// ============================================================
// Triage is NOT diagnosis. It is decision support / triage
// assistance to route the patient appropriately.
// ============================================================

import { TriageLevel } from './enums.js';

/** Structured vital signs. */
export interface VitalSigns {
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  temperature: number | null;       // Celsius
  respiratoryRate: number | null;
  oxygenSaturation: number | null;  // SpO2 %
  bloodGlucose: number | null;
  weight: number | null;            // kg
  height: number | null;            // cm
}

/** A symptom recorded during triage. */
export interface SymptomEntry {
  symptom: string;
  duration: string;                  // e.g., "3 days", "2 weeks"
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  notes: string | null;
}

/** Warning signs that may escalate triage to EMERGENCY. */
export interface WarningSign {
  sign: string;
  present: boolean;
}

export interface TriageAssessment {
  id: string;
  encounterId: string;
  patientId: string;
  symptoms: SymptomEntry[];
  vitals: VitalSigns;
  warningSignsChecked: WarningSign[];
  medicalHistoryFlags: string[];     // e.g., ["diabetes", "hypertension"]
  triageLevel: TriageLevel;
  triageNotes: string | null;
  assessedBy: string;
  assessedAt: string;
  /** Triage is explicitly NOT a diagnosis. This flag must always be shown in UI. */
  isDecisionSupportOnly: true;
}

/** Common warning signs for the triage checklist. */
export const STANDARD_WARNING_SIGNS: string[] = [
  'Chest pain',
  'Difficulty breathing',
  'Loss of consciousness',
  'Severe bleeding',
  'High fever (>104°F / 40°C)',
  'Severe abdominal pain',
  'Signs of stroke (face drooping, arm weakness, speech difficulty)',
  'Seizures',
  'Severe allergic reaction',
  'Severe dehydration',
  'Pregnancy complications',
  'Trauma / serious injury',
];
