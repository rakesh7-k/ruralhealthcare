// ============================================================
// SETHU — Medicine, Prescription, and Fulfillment Types
// ============================================================
// Medicine fulfillment explicitly distinguishes:
// FACILITY_DISPENSED vs EXTERNALLY_FULFILLED vs UNKNOWN
// Never falsely modify facility stock.
// ============================================================

import { MedicineFulfillmentType } from './enums.js';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;                // e.g., "cardiovascular", "antibiotic"
  unit: string;                    // e.g., "tablet", "ml", "capsule"
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  careJourneyId: string;
  prescribedBy: string;            // Doctor userId
  facilityId: string;
  notes: string | null;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string;
  medicineName: string;            // Denormalized
  dosage: string;                  // e.g., "500mg"
  frequency: string;               // e.g., "twice daily"
  durationDays: number;
  instructions: string | null;     // e.g., "take after meals"
  isFulfilled: boolean;
  fulfillmentType: MedicineFulfillmentType | null;
}

/**
 * Records how a medicine was obtained.
 * If medicine was purchased externally, facility inventory is NOT modified.
 */
export interface MedicineTransaction {
  id: string;
  prescriptionItemId: string;
  patientId: string;
  facilityId: string | null;       // null if externally fulfilled
  fulfillmentType: MedicineFulfillmentType;
  quantity: number | null;
  recordedBy: string;
  verifiedBy: string | null;
  notes: string | null;
  createdAt: string;
}

/** Prescription with all its items — for the consultation view. */
export interface PrescriptionWithItems extends Prescription {
  items: PrescriptionItem[];
  prescribedByName: string;
}
