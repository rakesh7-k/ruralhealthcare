// ============================================================
// SETHU — User, Role, and Permission Types
// ============================================================

import { Role, Language } from './enums.js';

export interface User {
  id: string;
  phone: string;
  email: string | null;
  passwordHash: string;
  fullName: string;
  preferredLanguage: Language;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** User without sensitive fields — safe for API responses. */
export interface UserPublic {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  preferredLanguage: Language;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
}

export interface UserRole {
  userId: string;
  roleId: string;
  roleName: Role;
  facilityId: string | null; // Scoped to facility for WORKER, DOCTOR, FACILITY_STAFF
  assignedAt: string;
}

export interface RoleDefinition {
  id: string;
  name: Role;
  description: string;
}

export interface Permission {
  id: string;
  resource: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  scope: 'OWN' | 'ASSIGNED' | 'FACILITY' | 'DISTRICT' | 'ALL';
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

/** JWT payload after successful authentication. */
export interface AuthPayload {
  userId: string;
  roles: Array<{
    role: Role;
    facilityId: string | null;
  }>;
  exp: number;
  iat: number;
}

/** Login request body. */
export interface LoginRequest {
  username: string; // phone or email
  password: string;
}

/** Login response. */
export interface LoginResponse {
  token: string;
  user: UserPublic;
}
