// ============================================================
// SETHU — Care Journey State Machine
// ============================================================
// Defines valid state transitions for a patient's care journey.
// The care journey is the central concept — from NEED to COMPLETION.
// ============================================================

import { CareJourneyStatus } from '../types/enums.js';

type StateTransition = {
  from: CareJourneyStatus;
  to: CareJourneyStatus;
  trigger: string;          // What causes this transition
  requiredRole: string[];   // Roles authorized to trigger
};

/**
 * All valid transitions in the care journey state machine.
 * Any transition not listed here is invalid and must be rejected.
 */
export const CARE_JOURNEY_TRANSITIONS: StateTransition[] = [
  // --- Happy path ---
  {
    from: CareJourneyStatus.ACTIVE,
    to: CareJourneyStatus.AWAITING_TRIAGE,
    trigger: 'Triage initiated',
    requiredRole: ['WORKER', 'DOCTOR'],
  },
  {
    from: CareJourneyStatus.AWAITING_TRIAGE,
    to: CareJourneyStatus.TRIAGED,
    trigger: 'Triage assessment completed',
    requiredRole: ['WORKER', 'DOCTOR'],
  },
  {
    from: CareJourneyStatus.TRIAGED,
    to: CareJourneyStatus.CONSULTATION,
    trigger: 'Doctor begins consultation',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.CONSULTATION,
    to: CareJourneyStatus.TELECONSULTATION_PENDING,
    trigger: 'Specialist teleconsultation requested',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.TELECONSULTATION_PENDING,
    to: CareJourneyStatus.TELECONSULTATION_COMPLETE,
    trigger: 'Teleconsultation completed',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.CONSULTATION,
    to: CareJourneyStatus.CARE_REQUIREMENT_CREATED,
    trigger: 'Care requirement identified by doctor',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.TELECONSULTATION_COMPLETE,
    to: CareJourneyStatus.CARE_REQUIREMENT_CREATED,
    trigger: 'Care requirement identified after teleconsultation',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.CARE_REQUIREMENT_CREATED,
    to: CareJourneyStatus.ROUTE_EVALUATED,
    trigger: 'Care Route Assurance evaluation completed',
    requiredRole: ['DOCTOR', 'WORKER'],
  },
  {
    from: CareJourneyStatus.ROUTE_EVALUATED,
    to: CareJourneyStatus.REFERRED,
    trigger: 'Referral created to target facility',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.REFERRED,
    to: CareJourneyStatus.APPOINTMENT_BOOKED,
    trigger: 'Appointment confirmed at target facility',
    requiredRole: ['DOCTOR', 'WORKER', 'FACILITY_STAFF'],
  },
  {
    from: CareJourneyStatus.APPOINTMENT_BOOKED,
    to: CareJourneyStatus.PATIENT_ARRIVED,
    trigger: 'Patient checked in at facility',
    requiredRole: ['FACILITY_STAFF'],
  },
  {
    from: CareJourneyStatus.PATIENT_ARRIVED,
    to: CareJourneyStatus.AWAITING_DIAGNOSTIC,
    trigger: 'Diagnostic ordered',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.AWAITING_DIAGNOSTIC,
    to: CareJourneyStatus.DIAGNOSTIC_COMPLETE,
    trigger: 'Diagnostic result available',
    requiredRole: ['DOCTOR', 'FACILITY_STAFF'],
  },
  {
    from: CareJourneyStatus.PATIENT_ARRIVED,
    to: CareJourneyStatus.TREATMENT_IN_PROGRESS,
    trigger: 'Treatment started (no diagnostic needed)',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.DIAGNOSTIC_COMPLETE,
    to: CareJourneyStatus.TREATMENT_IN_PROGRESS,
    trigger: 'Treatment started after diagnostic review',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.TREATMENT_IN_PROGRESS,
    to: CareJourneyStatus.AWAITING_FOLLOWUP,
    trigger: 'Follow-up scheduled',
    requiredRole: ['DOCTOR', 'WORKER'],
  },
  {
    from: CareJourneyStatus.AWAITING_FOLLOWUP,
    to: CareJourneyStatus.COMPLETED,
    trigger: 'Follow-up completed, care journey complete',
    requiredRole: ['DOCTOR', 'WORKER'],
  },

  // --- Direct completion paths (simpler cases) ---
  {
    from: CareJourneyStatus.CONSULTATION,
    to: CareJourneyStatus.TREATMENT_IN_PROGRESS,
    trigger: 'Treatment started at current facility (no referral needed)',
    requiredRole: ['DOCTOR'],
  },
  {
    from: CareJourneyStatus.TREATMENT_IN_PROGRESS,
    to: CareJourneyStatus.COMPLETED,
    trigger: 'Treatment completed, no follow-up needed',
    requiredRole: ['DOCTOR'],
  },

  // --- Care Break paths ---
  {
    from: CareJourneyStatus.REFERRED,
    to: CareJourneyStatus.CARE_BREAK,
    trigger: 'No referral progress within expected window',
    requiredRole: ['WORKER', 'DOCTOR'],
  },
  {
    from: CareJourneyStatus.APPOINTMENT_BOOKED,
    to: CareJourneyStatus.CARE_BREAK,
    trigger: 'Patient no-show',
    requiredRole: ['FACILITY_STAFF', 'WORKER'],
  },
  {
    from: CareJourneyStatus.AWAITING_DIAGNOSTIC,
    to: CareJourneyStatus.CARE_BREAK,
    trigger: 'Diagnostic not completed within window',
    requiredRole: ['WORKER', 'DOCTOR'],
  },
  {
    from: CareJourneyStatus.AWAITING_FOLLOWUP,
    to: CareJourneyStatus.CARE_BREAK,
    trigger: 'Follow-up missed',
    requiredRole: ['WORKER'],
  },

  // --- Recovery paths ---
  {
    from: CareJourneyStatus.CARE_BREAK,
    to: CareJourneyStatus.RECOVERY_IN_PROGRESS,
    trigger: 'Intervention started',
    requiredRole: ['WORKER'],
  },
  {
    from: CareJourneyStatus.RECOVERY_IN_PROGRESS,
    to: CareJourneyStatus.REFERRED,
    trigger: 'Re-referred after barrier resolution',
    requiredRole: ['DOCTOR', 'WORKER'],
  },
  {
    from: CareJourneyStatus.RECOVERY_IN_PROGRESS,
    to: CareJourneyStatus.APPOINTMENT_BOOKED,
    trigger: 'Appointment rescheduled',
    requiredRole: ['WORKER', 'FACILITY_STAFF'],
  },
  {
    from: CareJourneyStatus.RECOVERY_IN_PROGRESS,
    to: CareJourneyStatus.AWAITING_FOLLOWUP,
    trigger: 'Follow-up rescheduled',
    requiredRole: ['WORKER'],
  },
  {
    from: CareJourneyStatus.RECOVERY_IN_PROGRESS,
    to: CareJourneyStatus.AWAITING_DIAGNOSTIC,
    trigger: 'Diagnostic rescheduled',
    requiredRole: ['WORKER', 'DOCTOR'],
  },
];

/**
 * Check whether a state transition is valid.
 */
export function isValidTransition(
  from: CareJourneyStatus,
  to: CareJourneyStatus,
  role: string
): boolean {
  return CARE_JOURNEY_TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.requiredRole.includes(role)
  );
}

/**
 * Get all possible next states from a given state.
 */
export function getNextStates(
  currentStatus: CareJourneyStatus,
  role: string
): CareJourneyStatus[] {
  return CARE_JOURNEY_TRANSITIONS
    .filter((t) => t.from === currentStatus && t.requiredRole.includes(role))
    .map((t) => t.to);
}

/**
 * Time windows after which a care break should be detected (in hours).
 * These are defaults; they can be overridden per facility or district.
 */
export const CARE_BREAK_DETECTION_WINDOWS: Record<string, number> = {
  REFERRAL_ARRIVAL: 72,       // 3 days to arrive after referral
  APPOINTMENT_ARRIVAL: 4,     // 4 hours after appointment time
  DIAGNOSTIC_COMPLETION: 48,  // 2 days to complete diagnostic
  FOLLOWUP_COMPLETION: 48,    // 2 days after follow-up due date
  TELECONSULTATION_JOIN: 1,   // 1 hour after scheduled teleconsultation
};
