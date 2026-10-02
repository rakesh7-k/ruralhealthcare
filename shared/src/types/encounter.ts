// ============================================================
// SETHU — Encounter, Consultation, and Teleconsultation Types
// ============================================================

import { EncounterType, TeleconsultationStatus, SyncStatus } from './enums.js';

export interface Encounter {
  id: string;
  patientId: string;
  careJourneyId: string;
  facilityId: string | null;       // null if home visit / field encounter
  clinicianId: string;             // Worker or doctor who initiated
  encounterType: EncounterType;
  chiefComplaint: string;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  isOfflineCreated: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Consultation {
  id: string;
  encounterId: string;
  doctorId: string;
  patientId: string;
  clinicalNotes: string;
  assessment: string;
  treatmentPlan: string | null;
  outcome: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Teleconsultation {
  id: string;
  consultationId: string;
  patientId: string;
  specialistId: string;
  requestingDoctorId: string;
  requestingFacilityId: string;
  specialistFacilityId: string | null;
  status: TeleconsultationStatus;
  specialtyRequired: string;       // e.g., "cardiology"
  reasonForConsult: string;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  specialistNotes: string | null;
  specialistRecommendation: string | null;
  requiresPhysicalExam: boolean;
  requiresDiagnostics: string[];   // e.g., ["ECG", "blood_test"]
  nextAction: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Summary for the doctor's teleconsultation queue. */
export interface TeleconsultationQueueItem {
  id: string;
  patientName: string;
  patientAge: number | null;
  patientGender: string;
  specialtyRequired: string;
  reasonForConsult: string;
  requestingDoctorName: string;
  requestingFacilityName: string;
  status: TeleconsultationStatus;
  scheduledAt: string | null;
  triageLevel: string | null;
}
