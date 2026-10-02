// ============================================================
// SETHU — Referral Types
// ============================================================
// Referral creation is NOT referral completion.
// The full lifecycle: CREATED → SENT → RECEIVED → ACCEPTED →
// APPOINTMENT_SET → PATIENT_ARRIVED → CARE_PROVIDED → COMPLETED
// ============================================================

import { ReferralStatus, Urgency } from './enums.js';

export interface Referral {
  id: string;
  careRequirementId: string;
  patientId: string;
  careJourneyId: string;
  sourceFacilityId: string;
  targetFacilityId: string;
  referringDoctorId: string;
  status: ReferralStatus;
  urgency: Urgency;
  reason: string;
  clinicalNotes: string | null;
  expectedArrivalBy: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** A single event in the referral lifecycle. */
export interface ReferralEvent {
  id: string;
  referralId: string;
  eventType: string; // Maps to the status transition
  previousStatus: ReferralStatus | null;
  newStatus: ReferralStatus;
  actorId: string;
  notes: string | null;
  createdAt: string;
}

/** Referral with its full event history — for the referral detail view. */
export interface ReferralWithHistory extends Referral {
  events: ReferralEvent[];
  sourceFacilityName: string;
  targetFacilityName: string;
  patientName: string;
  referringDoctorName: string;
}
