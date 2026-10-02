// ============================================================
// SETHU — Diagnostic Types
// ============================================================

import { DiagnosticOrderStatus } from './enums.js';

export interface DiagnosticOrder {
  id: string;
  careRequirementId: string | null;
  patientId: string;
  careJourneyId: string;
  diagnosticType: string;          // e.g., "X-ray", "ECG", "blood_test"
  diagnosticName: string;          // Human-readable full name
  facilityId: string;              // Where the diagnostic is to be performed
  status: DiagnosticOrderStatus;
  orderedBy: string;               // Doctor userId
  orderedAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticResult {
  id: string;
  diagnosticOrderId: string;
  resultSummary: string;
  resultData: Record<string, unknown>; // Structured result data
  resultFileUrl: string | null;        // Link to uploaded result file
  isNormal: boolean | null;            // null if not assessed
  reportedBy: string;
  reportedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

/** Diagnostic order with result — for the patient timeline. */
export interface DiagnosticWithResult extends DiagnosticOrder {
  result: DiagnosticResult | null;
}
