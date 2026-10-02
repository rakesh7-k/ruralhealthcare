// ============================================================
// SETHU — Facility, Resource, and Service Types
// ============================================================

import {
  FacilityType,
  ResourceStatus,
  UpdateSource,
  VerificationState,
  TrustLevel,
  MedicineAvailability,
} from './enums.js';

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  operatingHours: string | null; // e.g., "08:00-20:00"
  bedCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A service/capability offered by a facility (e.g., "cardiology", "X-ray"). */
export interface FacilityService {
  id: string;
  facilityId: string;
  serviceType: string; // e.g., "cardiology", "general_surgery", "radiology"
  serviceName: string; // Human-readable
  isAvailable: boolean;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
}

/**
 * A specific resource at a facility (e.g., "X-Ray Machine", "ECG Machine").
 * This is the core data entity for the "never pretend unknown data is known" principle.
 */
export interface FacilityResource {
  id: string;
  facilityId: string;
  resourceType: string;   // Category: "diagnostic", "equipment", "specialist"
  resourceName: string;   // e.g., "X-Ray", "ECG", "Cardiologist"
  status: ResourceStatus;
  lastUpdatedAt: string;
  updatedByUserId: string | null;
  updateSource: UpdateSource;
  verificationState: VerificationState;
  verificationTimestamp: string | null;
  notes: string | null;
  createdAt: string;
}

/** History of updates to a facility resource. */
export interface ResourceUpdate {
  id: string;
  resourceId: string;
  previousStatus: ResourceStatus;
  newStatus: ResourceStatus;
  updatedBy: string;
  updateSource: UpdateSource;
  notes: string | null;
  createdAt: string;
}

/** Medicine availability at a facility. */
export interface FacilityMedicine {
  id: string;
  facilityId: string;
  medicineId: string;
  medicineName: string; // Denormalized for display
  status: MedicineAvailability;
  lastUpdatedAt: string;
  updateSource: UpdateSource;
  verificationState: VerificationState;
  notes: string | null;
}

/**
 * Data Trust Score — the transparent, deterministic confidence mechanism.
 * Every resource/service status carries this score to communicate data reliability.
 */
export interface DataTrustScore {
  overall: number; // 0-100
  level: TrustLevel;
  breakdown: {
    freshness: {
      score: number;
      weight: number;
      lastUpdated: string;
      ageHours: number;
      ageCategory: string;
    };
    sourceReliability: {
      score: number;
      weight: number;
      source: UpdateSource;
      multiplier: number;
    };
    verificationStatus: {
      score: number;
      weight: number;
      state: VerificationState;
      multiplier: number;
    };
    crossCheck: {
      score: number;
      weight: number;
      reportCount: number;
      consistency: 'CONSISTENT' | 'SINGLE_SOURCE' | 'CONFLICTING';
      multiplier: number;
    };
  };
}

/** Facility resource enriched with its trust score — used in UI and Care Route Assurance. */
export interface FacilityResourceWithTrust extends FacilityResource {
  trustScore: DataTrustScore;
}
