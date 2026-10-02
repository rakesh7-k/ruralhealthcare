// ============================================================
// SETHU — Care Requirement Types
// ============================================================
// The Care Requirement is the central domain object that drives
// facility matching, route assurance, appointments, diagnostics,
// medicine checks, referrals, and follow-ups.
// ============================================================

import { Urgency } from './enums.js';

/** A single diagnostic need within a care requirement. */
export interface DiagnosticNeed {
  type: string;        // e.g., "ECG", "blood_test", "X-ray"
  priority: 'REQUIRED' | 'RECOMMENDED';
  notes: string | null;
}

/** A single medicine need within a care requirement. */
export interface MedicineNeed {
  medicineId: string | null; // null if not yet mapped to catalog
  name: string;              // Generic/brand name
  dosage: string | null;
  priority: 'REQUIRED' | 'RECOMMENDED';
}

/**
 * Structured care requirement — generated after clinical assessment.
 * This object is the input to Care Route Assurance.
 */
export interface CareRequirement {
  id: string;
  encounterId: string;
  patientId: string;
  careJourneyId: string;
  specialistType: string | null;
  diagnosticsNeeded: DiagnosticNeed[];
  medicinesNeeded: MedicineNeed[];
  requiresPhysicalExam: boolean;
  followUpDays: number | null;
  urgency: Urgency;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

/** Request body for creating a care requirement. */
export interface CreateCareRequirementRequest {
  encounterId: string;
  patientId: string;
  careJourneyId: string;
  specialistType: string | null;
  diagnosticsNeeded: DiagnosticNeed[];
  medicinesNeeded: MedicineNeed[];
  requiresPhysicalExam: boolean;
  followUpDays: number | null;
  urgency: Urgency;
  notes: string | null;
}
