// ============================================================
// SETHU — Care Break, Barrier, Intervention, and Follow-up Types
// ============================================================
// Care Break = Expected action did not occur within the defined window.
// Every care break must have a recovery path.
// ============================================================

import {
  CareBreakStatus,
  CareBreakType,
  BarrierType,
  FollowupStatus,
} from './enums.js';

export interface CareBreak {
  id: string;
  careJourneyId: string;
  patientId: string;
  breakType: CareBreakType;
  expectedAction: string;          // What should have happened
  expectedBy: string;              // ISO date — deadline for the expected action
  detectedAt: string;
  status: CareBreakStatus;
  assignedWorkerId: string | null;
  relatedEntityType: string | null; // e.g., "referral", "followup", "diagnostic_order"
  relatedEntityId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BarrierReport {
  id: string;
  careBreakId: string;
  barrierType: BarrierType;
  description: string;
  reportedBy: string;
  reportedAt: string;
}

export interface Intervention {
  id: string;
  careBreakId: string;
  interventionType: string;        // e.g., "phone_call", "home_visit", "reschedule"
  actionTaken: string;
  outcome: string;
  performedBy: string;
  performedAt: string;
}

export interface Followup {
  id: string;
  patientId: string;
  careJourneyId: string;
  encounterId: string | null;
  assignedWorkerId: string;
  followUpType: string;            // e.g., "post_treatment", "medication_check", "vitals_check"
  dueDate: string;
  status: FollowupStatus;
  completedAt: string | null;
  rescheduledTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowupAttempt {
  id: string;
  followupId: string;
  attemptedBy: string;
  attemptedAt: string;
  outcome: 'COMPLETED' | 'PATIENT_NOT_AVAILABLE' | 'PATIENT_REFUSED' | 'RESCHEDULED' | 'OTHER';
  notes: string | null;
}

/** Care break enriched with barrier and intervention data — for worker dashboard. */
export interface CareBreakDetail extends CareBreak {
  patientName: string;
  patientVillage: string;
  barriers: BarrierReport[];
  interventions: Intervention[];
  assignedWorkerName: string | null;
}

/** Follow-up with patient info — for the worker's follow-up list. */
export interface FollowupWithPatient extends Followup {
  patientName: string;
  patientVillage: string;
  patientPhone: string | null;
  lastEncounterDate: string | null;
}
