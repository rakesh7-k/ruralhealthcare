// ============================================================
// SETHU — Role Definitions and Permission Map
// ============================================================

import { Role } from '../types/enums.js';

export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
export type PermissionScope = 'OWN' | 'ASSIGNED' | 'FACILITY' | 'DISTRICT';

export interface RolePermissionEntry {
  resource: string;
  actions: PermissionAction[];
  scope: PermissionScope;
}

/**
 * Complete permission map for each role.
 * Enforced by the RBAC middleware on every API request.
 * Principle: least privilege.
 */
export const ROLE_PERMISSIONS: Record<Role, RolePermissionEntry[]> = {
  [Role.PATIENT]: [
    { resource: 'profile',          actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'patient',          actions: ['READ'],                            scope: 'OWN' },
    { resource: 'encounter',        actions: ['READ'],                            scope: 'OWN' },
    { resource: 'triage',           actions: ['READ'],                            scope: 'OWN' },
    { resource: 'consultation',     actions: ['READ'],                            scope: 'OWN' },
    { resource: 'care_requirement', actions: ['READ'],                            scope: 'OWN' },
    { resource: 'care_route',       actions: ['READ'],                            scope: 'OWN' },
    { resource: 'referral',         actions: ['READ'],                            scope: 'OWN' },
    { resource: 'appointment',      actions: ['READ'],                            scope: 'OWN' },
    { resource: 'diagnostic',       actions: ['READ'],                            scope: 'OWN' },
    { resource: 'prescription',     actions: ['READ'],                            scope: 'OWN' },
    { resource: 'followup',         actions: ['READ'],                            scope: 'OWN' },
    { resource: 'care_break',       actions: ['READ'],                            scope: 'OWN' },
    { resource: 'care_journey',     actions: ['READ'],                            scope: 'OWN' },
    { resource: 'notification',     actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
  ],

  [Role.WORKER]: [
    { resource: 'profile',          actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'patient',          actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'encounter',        actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'triage',           actions: ['CREATE', 'READ'],                  scope: 'ASSIGNED' },
    { resource: 'consultation',     actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'care_requirement', actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'care_route',       actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'referral',         actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'appointment',      actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'diagnostic',       actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'prescription',     actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'medicine_txn',     actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'followup',         actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'care_break',       actions: ['READ', 'UPDATE'],                  scope: 'ASSIGNED' },
    { resource: 'barrier',          actions: ['CREATE', 'READ'],                  scope: 'ASSIGNED' },
    { resource: 'intervention',     actions: ['CREATE', 'READ'],                  scope: 'ASSIGNED' },
    { resource: 'care_journey',     actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'facility_resource', actions: ['READ'],                           scope: 'FACILITY' },
    { resource: 'notification',     actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'sync',             actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'OWN' },
  ],

  [Role.DOCTOR]: [
    { resource: 'profile',          actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'patient',          actions: ['READ', 'UPDATE'],                  scope: 'ASSIGNED' },
    { resource: 'encounter',        actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'triage',           actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'consultation',     actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'teleconsultation', actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'care_requirement', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'care_route',       actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'referral',         actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'appointment',      actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'diagnostic',       actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'prescription',     actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'ASSIGNED' },
    { resource: 'medicine_txn',     actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'followup',         actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'ASSIGNED' },
    { resource: 'care_break',       actions: ['READ'],                            scope: 'ASSIGNED' },
    { resource: 'care_journey',     actions: ['READ', 'UPDATE'],                  scope: 'ASSIGNED' },
    { resource: 'facility_resource', actions: ['READ'],                           scope: 'FACILITY' },
    { resource: 'notification',     actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
  ],

  [Role.FACILITY_STAFF]: [
    { resource: 'profile',          actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'patient',          actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'encounter',        actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'triage',           actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'consultation',     actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'referral',         actions: ['READ', 'UPDATE'],                  scope: 'FACILITY' },
    { resource: 'appointment',      actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'FACILITY' },
    { resource: 'diagnostic',       actions: ['READ', 'UPDATE'],                  scope: 'FACILITY' },
    { resource: 'prescription',     actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'medicine_txn',     actions: ['CREATE', 'READ', 'UPDATE'],        scope: 'FACILITY' },
    { resource: 'followup',         actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'care_break',       actions: ['READ'],                            scope: 'FACILITY' },
    { resource: 'facility',         actions: ['READ', 'UPDATE'],                  scope: 'FACILITY' },
    { resource: 'facility_resource', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'FACILITY' },
    { resource: 'facility_medicine', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'FACILITY' },
    { resource: 'facility_service', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'], scope: 'FACILITY' },
    { resource: 'notification',     actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
  ],

  [Role.ADMIN]: [
    { resource: 'profile',          actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
    { resource: 'care_route',       actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'referral',         actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'appointment',      actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'care_break',       actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'followup',         actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'facility',         actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'facility_resource', actions: ['READ'],                           scope: 'DISTRICT' },
    { resource: 'facility_medicine', actions: ['READ'],                           scope: 'DISTRICT' },
    { resource: 'dashboard',        actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'analytics',        actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'audit_log',        actions: ['READ'],                            scope: 'DISTRICT' },
    { resource: 'notification',     actions: ['READ', 'UPDATE'],                  scope: 'OWN' },
  ],
};
