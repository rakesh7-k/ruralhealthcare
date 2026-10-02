// ============================================================
// SETHU — Patient, Caregiver, and Care Journey Types
// ============================================================

import { Gender, CareJourneyStatus, CareEventType } from './enums.js';

export interface Patient {
  id: string;
  userId: string | null; // null if registered by worker without user account
  fullName: string;
  dateOfBirth: string | null;
  gender: Gender;
  bloodGroup: string | null;
  village: string;
  district: string;
  state: string;
  pincode: string | null;
  phone: string | null;
  abhaId: string | null; // Ayushman Bharat Health Account (optional)
  photoUrl: string | null;
  registrationSource: 'SELF' | 'WORKER' | 'FACILITY';
  registeredBy: string; // userId of registering user
  registeredAt: string;
  updatedAt: string;
}

export interface PatientCaregiver {
  id: string;
  patientId: string;
  caregiverName: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  createdAt: string;
}

/** A patient's longitudinal care journey — from need to completion. */
export interface CareJourney {
  id: string;
  patientId: string;
  status: CareJourneyStatus;
  primaryComplaint: string;
  startedAt: string;
  completedAt: string | null;
  currentFacilityId: string | null;
  assignedWorkerId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A single event on the care journey timeline. */
export interface CareEvent {
  id: string;
  careJourneyId: string;
  patientId: string;
  eventType: CareEventType;
  eventData: Record<string, unknown>; // type-specific payload
  facilityId: string | null;
  actorId: string;
  createdAt: string;
}

/** Patient summary — aggregated view for dashboards. */
export interface PatientSummary {
  id: string;
  fullName: string;
  gender: Gender;
  age: number | null;
  village: string;
  district: string;
  activeJourneyStatus: CareJourneyStatus | null;
  lastEncounterDate: string | null;
  pendingFollowups: number;
  activeCareBreaks: number;
}
