-- ============================================================
-- SETHU — Complete Database Schema
-- ============================================================
-- Designed for SQLite with PostgreSQL-compatible syntax.
-- All tables use TEXT for UUIDs and ISO timestamps.
-- Foreign keys are enforced (PRAGMA foreign_keys = ON).
-- ============================================================

-- ============================================================
-- IDENTITY & ACCESS
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,  -- PATIENT, WORKER, DOCTOR, FACILITY_STAFF, ADMIN
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY,
  phone               TEXT NOT NULL UNIQUE,
  email               TEXT UNIQUE,
  password_hash       TEXT NOT NULL,
  full_name           TEXT NOT NULL,
  preferred_language  TEXT NOT NULL DEFAULT 'en',
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_roles (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  role_id     TEXT NOT NULL REFERENCES roles(id),
  facility_id TEXT REFERENCES facilities(id),  -- Scoped to facility for WORKER, DOCTOR, FACILITY_STAFF
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, role_id, facility_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id        TEXT PRIMARY KEY,
  resource  TEXT NOT NULL,
  action    TEXT NOT NULL,  -- CREATE, READ, UPDATE, DELETE
  scope     TEXT NOT NULL,  -- OWN, ASSIGNED, FACILITY, DISTRICT
  UNIQUE(resource, action, scope)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       TEXT NOT NULL REFERENCES roles(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- FACILITY DOMAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS facilities (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,  -- SHC, PHC, CHC, SDH, DH
  district        TEXT NOT NULL,
  state           TEXT NOT NULL,
  address         TEXT NOT NULL,
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  phone           TEXT,
  operating_hours TEXT,
  bed_count       INTEGER,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS facility_services (
  id               TEXT PRIMARY KEY,
  facility_id      TEXT NOT NULL REFERENCES facilities(id),
  service_type     TEXT NOT NULL,  -- e.g., 'cardiology', 'radiology'
  service_name     TEXT NOT NULL,  -- Human-readable
  is_available     INTEGER NOT NULL DEFAULT 1,
  last_verified_at TEXT,
  verified_by      TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS facility_resources (
  id                      TEXT PRIMARY KEY,
  facility_id             TEXT NOT NULL REFERENCES facilities(id),
  resource_type           TEXT NOT NULL,  -- 'diagnostic', 'equipment', 'specialist'
  resource_name           TEXT NOT NULL,  -- e.g., 'X-Ray', 'ECG', 'Cardiologist'
  status                  TEXT NOT NULL DEFAULT 'UNKNOWN',  -- AVAILABLE, UNAVAILABLE, UNKNOWN, STALE, PENDING_VERIFICATION
  last_updated_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by_user_id      TEXT REFERENCES users(id),
  update_source           TEXT NOT NULL DEFAULT 'FACILITY_STAFF',
  verification_state      TEXT NOT NULL DEFAULT 'UNVERIFIED',
  verification_timestamp  TEXT,
  notes                   TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resource_updates (
  id              TEXT PRIMARY KEY,
  resource_id     TEXT NOT NULL REFERENCES facility_resources(id),
  previous_status TEXT NOT NULL,
  new_status      TEXT NOT NULL,
  updated_by      TEXT NOT NULL REFERENCES users(id),
  update_source   TEXT NOT NULL,
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- PATIENT DOMAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS patients (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT UNIQUE REFERENCES users(id),
  full_name            TEXT NOT NULL,
  date_of_birth        TEXT,
  gender               TEXT NOT NULL,  -- MALE, FEMALE, OTHER
  blood_group          TEXT,
  village              TEXT NOT NULL,
  district             TEXT NOT NULL,
  state                TEXT NOT NULL,
  pincode              TEXT,
  phone                TEXT,
  abha_id              TEXT UNIQUE,  -- Ayushman Bharat Health Account
  photo_url            TEXT,
  registration_source  TEXT NOT NULL DEFAULT 'WORKER',  -- SELF, WORKER, FACILITY
  registered_by        TEXT NOT NULL REFERENCES users(id),
  registered_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS patient_caregivers (
  id              TEXT PRIMARY KEY,
  patient_id      TEXT NOT NULL REFERENCES patients(id),
  caregiver_name  TEXT NOT NULL,
  relationship    TEXT NOT NULL,
  phone           TEXT NOT NULL,
  is_primary      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CARE JOURNEY
-- ============================================================

CREATE TABLE IF NOT EXISTS care_journeys (
  id                  TEXT PRIMARY KEY,
  patient_id          TEXT NOT NULL REFERENCES patients(id),
  status              TEXT NOT NULL DEFAULT 'ACTIVE',
  primary_complaint   TEXT NOT NULL,
  started_at          TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at        TEXT,
  current_facility_id TEXT REFERENCES facilities(id),
  assigned_worker_id  TEXT REFERENCES users(id),
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS care_events (
  id              TEXT PRIMARY KEY,
  care_journey_id TEXT NOT NULL REFERENCES care_journeys(id),
  patient_id      TEXT NOT NULL REFERENCES patients(id),
  event_type      TEXT NOT NULL,
  event_data      TEXT NOT NULL DEFAULT '{}',  -- JSON
  facility_id     TEXT REFERENCES facilities(id),
  actor_id        TEXT NOT NULL REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CLINICAL DOMAIN
-- ============================================================

CREATE TABLE IF NOT EXISTS encounters (
  id                 TEXT PRIMARY KEY,
  patient_id         TEXT NOT NULL REFERENCES patients(id),
  care_journey_id    TEXT NOT NULL REFERENCES care_journeys(id),
  facility_id        TEXT REFERENCES facilities(id),
  clinician_id       TEXT NOT NULL REFERENCES users(id),
  encounter_type     TEXT NOT NULL,
  chief_complaint    TEXT NOT NULL,
  notes              TEXT,
  started_at         TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at           TEXT,
  is_offline_created INTEGER NOT NULL DEFAULT 0,
  sync_status        TEXT NOT NULL DEFAULT 'SYNCED',
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS triage_assessments (
  id                    TEXT PRIMARY KEY,
  encounter_id          TEXT NOT NULL REFERENCES encounters(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  symptoms              TEXT NOT NULL DEFAULT '[]',  -- JSON array of SymptomEntry
  vitals                TEXT NOT NULL DEFAULT '{}',  -- JSON VitalSigns
  warning_signs_checked TEXT NOT NULL DEFAULT '[]',  -- JSON array of WarningSign
  medical_history_flags TEXT NOT NULL DEFAULT '[]',  -- JSON array of strings
  triage_level          TEXT NOT NULL,  -- ROUTINE, URGENT, EMERGENCY
  triage_notes          TEXT,
  assessed_by           TEXT NOT NULL REFERENCES users(id),
  assessed_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultations (
  id              TEXT PRIMARY KEY,
  encounter_id    TEXT NOT NULL REFERENCES encounters(id),
  doctor_id       TEXT NOT NULL REFERENCES users(id),
  patient_id      TEXT NOT NULL REFERENCES patients(id),
  clinical_notes  TEXT NOT NULL,
  assessment      TEXT NOT NULL,
  treatment_plan  TEXT,
  outcome         TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teleconsultations (
  id                      TEXT PRIMARY KEY,
  consultation_id         TEXT NOT NULL REFERENCES consultations(id),
  patient_id              TEXT NOT NULL REFERENCES patients(id),
  specialist_id           TEXT NOT NULL REFERENCES users(id),
  requesting_doctor_id    TEXT NOT NULL REFERENCES users(id),
  requesting_facility_id  TEXT NOT NULL REFERENCES facilities(id),
  specialist_facility_id  TEXT REFERENCES facilities(id),
  status                  TEXT NOT NULL DEFAULT 'REQUESTED',
  specialty_required      TEXT NOT NULL,
  reason_for_consult      TEXT NOT NULL,
  scheduled_at            TEXT,
  started_at              TEXT,
  ended_at                TEXT,
  specialist_notes        TEXT,
  specialist_recommendation TEXT,
  requires_physical_exam  INTEGER NOT NULL DEFAULT 0,
  requires_diagnostics    TEXT NOT NULL DEFAULT '[]',  -- JSON array
  next_action             TEXT,
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CARE REQUIREMENT & ROUTE ASSURANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS care_requirements (
  id                    TEXT PRIMARY KEY,
  encounter_id          TEXT NOT NULL REFERENCES encounters(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  care_journey_id       TEXT NOT NULL REFERENCES care_journeys(id),
  specialist_type       TEXT,
  diagnostics_needed    TEXT NOT NULL DEFAULT '[]',  -- JSON array
  medicines_needed      TEXT NOT NULL DEFAULT '[]',  -- JSON array
  requires_physical_exam INTEGER NOT NULL DEFAULT 0,
  follow_up_days        INTEGER,
  urgency               TEXT NOT NULL DEFAULT 'ROUTINE',
  notes                 TEXT,
  created_by            TEXT NOT NULL REFERENCES users(id),
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS care_route_evaluations (
  id                    TEXT PRIMARY KEY,
  care_requirement_id   TEXT NOT NULL REFERENCES care_requirements(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  patient_latitude      REAL,
  patient_longitude     REAL,
  patient_village       TEXT,
  evaluated_at          TEXT NOT NULL DEFAULT (datetime('now')),
  selected_facility_id  TEXT REFERENCES facilities(id),
  selection_reason      TEXT NOT NULL,
  evaluated_by          TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS facility_matches (
  id                      TEXT PRIMARY KEY,
  evaluation_id           TEXT NOT NULL REFERENCES care_route_evaluations(id),
  facility_id             TEXT NOT NULL REFERENCES facilities(id),
  overall_score           REAL NOT NULL,
  can_complete_care       INTEGER NOT NULL DEFAULT 0,
  specialist_available    INTEGER,  -- NULL = unknown
  specialist_trust_score  REAL,
  diagnostics_match       TEXT NOT NULL DEFAULT '{}',  -- JSON
  medicine_match          TEXT NOT NULL DEFAULT '{}',  -- JSON
  distance_km             REAL NOT NULL,
  estimated_wait_minutes  INTEGER,
  data_freshness_score    REAL NOT NULL,
  recommendation          TEXT NOT NULL,  -- RECOMMENDED, POSSIBLE, NOT_RECOMMENDED, INSUFFICIENT_DATA
  concerns                TEXT NOT NULL DEFAULT '[]',  -- JSON array
  selection_explanation   TEXT NOT NULL
);

-- ============================================================
-- REFERRAL & APPOINTMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id                    TEXT PRIMARY KEY,
  care_requirement_id   TEXT NOT NULL REFERENCES care_requirements(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  care_journey_id       TEXT NOT NULL REFERENCES care_journeys(id),
  source_facility_id    TEXT NOT NULL REFERENCES facilities(id),
  target_facility_id    TEXT NOT NULL REFERENCES facilities(id),
  referring_doctor_id   TEXT NOT NULL REFERENCES users(id),
  status                TEXT NOT NULL DEFAULT 'CREATED',
  urgency               TEXT NOT NULL DEFAULT 'ROUTINE',
  reason                TEXT NOT NULL,
  clinical_notes        TEXT,
  expected_arrival_by   TEXT,
  created_by            TEXT NOT NULL REFERENCES users(id),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_events (
  id              TEXT PRIMARY KEY,
  referral_id     TEXT NOT NULL REFERENCES referrals(id),
  event_type      TEXT NOT NULL,
  previous_status TEXT,
  new_status      TEXT NOT NULL,
  actor_id        TEXT NOT NULL REFERENCES users(id),
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL REFERENCES patients(id),
  facility_id       TEXT NOT NULL REFERENCES facilities(id),
  doctor_id         TEXT REFERENCES users(id),
  care_journey_id   TEXT REFERENCES care_journeys(id),
  appointment_type  TEXT NOT NULL,
  scheduled_at      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'SCHEDULED',
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- DIAGNOSTICS
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnostic_orders (
  id                    TEXT PRIMARY KEY,
  care_requirement_id   TEXT REFERENCES care_requirements(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  care_journey_id       TEXT NOT NULL REFERENCES care_journeys(id),
  diagnostic_type       TEXT NOT NULL,
  diagnostic_name       TEXT NOT NULL,
  facility_id           TEXT NOT NULL REFERENCES facilities(id),
  status                TEXT NOT NULL DEFAULT 'REQUESTED',
  ordered_by            TEXT NOT NULL REFERENCES users(id),
  ordered_at            TEXT NOT NULL DEFAULT (datetime('now')),
  scheduled_at          TEXT,
  completed_at          TEXT,
  notes                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diagnostic_results (
  id                  TEXT PRIMARY KEY,
  diagnostic_order_id TEXT NOT NULL UNIQUE REFERENCES diagnostic_orders(id),
  result_summary      TEXT NOT NULL,
  result_data         TEXT NOT NULL DEFAULT '{}',  -- JSON
  result_file_url     TEXT,
  is_normal           INTEGER,  -- NULL if not yet assessed
  reported_by         TEXT NOT NULL REFERENCES users(id),
  reported_at         TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_by         TEXT REFERENCES users(id),
  reviewed_at         TEXT,
  review_notes        TEXT
);

-- ============================================================
-- MEDICINES & PRESCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS medicines (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  generic_name  TEXT NOT NULL,
  category      TEXT NOT NULL,
  unit          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS facility_medicines (
  id                  TEXT PRIMARY KEY,
  facility_id         TEXT NOT NULL REFERENCES facilities(id),
  medicine_id         TEXT NOT NULL REFERENCES medicines(id),
  status              TEXT NOT NULL DEFAULT 'UNKNOWN',  -- AVAILABLE, LIMITED, UNAVAILABLE, UNKNOWN
  last_updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  update_source       TEXT NOT NULL DEFAULT 'FACILITY_STAFF',
  verification_state  TEXT NOT NULL DEFAULT 'UNVERIFIED',
  notes               TEXT,
  UNIQUE(facility_id, medicine_id)
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id              TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES consultations(id),
  patient_id      TEXT NOT NULL REFERENCES patients(id),
  care_journey_id TEXT NOT NULL REFERENCES care_journeys(id),
  prescribed_by   TEXT NOT NULL REFERENCES users(id),
  facility_id     TEXT NOT NULL REFERENCES facilities(id),
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id                TEXT PRIMARY KEY,
  prescription_id   TEXT NOT NULL REFERENCES prescriptions(id),
  medicine_id       TEXT NOT NULL REFERENCES medicines(id),
  medicine_name     TEXT NOT NULL,
  dosage            TEXT NOT NULL,
  frequency         TEXT NOT NULL,
  duration_days     INTEGER NOT NULL,
  instructions      TEXT,
  is_fulfilled      INTEGER NOT NULL DEFAULT 0,
  fulfillment_type  TEXT  -- FACILITY_DISPENSED, EXTERNALLY_FULFILLED, UNKNOWN
);

CREATE TABLE IF NOT EXISTS medicine_transactions (
  id                    TEXT PRIMARY KEY,
  prescription_item_id  TEXT NOT NULL REFERENCES prescription_items(id),
  patient_id            TEXT NOT NULL REFERENCES patients(id),
  facility_id           TEXT REFERENCES facilities(id),  -- NULL if externally fulfilled
  fulfillment_type      TEXT NOT NULL,  -- FACILITY_DISPENSED, EXTERNALLY_FULFILLED, UNKNOWN
  quantity              INTEGER,
  recorded_by           TEXT NOT NULL REFERENCES users(id),
  verified_by           TEXT REFERENCES users(id),
  notes                 TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- CARE CONTINUITY (Follow-ups, Care Breaks, Barriers, Interventions)
-- ============================================================

CREATE TABLE IF NOT EXISTS followups (
  id                TEXT PRIMARY KEY,
  patient_id        TEXT NOT NULL REFERENCES patients(id),
  care_journey_id   TEXT NOT NULL REFERENCES care_journeys(id),
  encounter_id      TEXT REFERENCES encounters(id),
  assigned_worker_id TEXT NOT NULL REFERENCES users(id),
  follow_up_type    TEXT NOT NULL,
  due_date          TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'PENDING',
  completed_at      TEXT,
  rescheduled_to    TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS followup_attempts (
  id            TEXT PRIMARY KEY,
  followup_id   TEXT NOT NULL REFERENCES followups(id),
  attempted_by  TEXT NOT NULL REFERENCES users(id),
  attempted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  outcome       TEXT NOT NULL,  -- COMPLETED, PATIENT_NOT_AVAILABLE, PATIENT_REFUSED, RESCHEDULED, OTHER
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS care_breaks (
  id                  TEXT PRIMARY KEY,
  care_journey_id     TEXT NOT NULL REFERENCES care_journeys(id),
  patient_id          TEXT NOT NULL REFERENCES patients(id),
  break_type          TEXT NOT NULL,
  expected_action     TEXT NOT NULL,
  expected_by         TEXT NOT NULL,  -- ISO date deadline
  detected_at         TEXT NOT NULL DEFAULT (datetime('now')),
  status              TEXT NOT NULL DEFAULT 'DETECTED',
  assigned_worker_id  TEXT REFERENCES users(id),
  related_entity_type TEXT,
  related_entity_id   TEXT,
  resolved_at         TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS barrier_reports (
  id            TEXT PRIMARY KEY,
  care_break_id TEXT NOT NULL REFERENCES care_breaks(id),
  barrier_type  TEXT NOT NULL,
  description   TEXT NOT NULL,
  reported_by   TEXT NOT NULL REFERENCES users(id),
  reported_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interventions (
  id                TEXT PRIMARY KEY,
  care_break_id     TEXT NOT NULL REFERENCES care_breaks(id),
  intervention_type TEXT NOT NULL,
  action_taken      TEXT NOT NULL,
  outcome           TEXT NOT NULL,
  performed_by      TEXT NOT NULL REFERENCES users(id),
  performed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- OPERATIONS (Notifications, Audit, Sync)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id                    TEXT PRIMARY KEY,
  user_id               TEXT NOT NULL REFERENCES users(id),
  type                  TEXT NOT NULL,
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  related_entity_type   TEXT,
  related_entity_id     TEXT,
  is_read               INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  previous_value  TEXT,  -- JSON
  new_value       TEXT,  -- JSON
  ip_address      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id),
  entity_type         TEXT NOT NULL,
  entity_id           TEXT NOT NULL,
  operation           TEXT NOT NULL,  -- CREATE, UPDATE
  payload             TEXT NOT NULL,  -- JSON
  status              TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, SYNCED, CONFLICT, FAILED
  created_at_local    TEXT NOT NULL,
  synced_at           TEXT,
  conflict_resolution TEXT
);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================

-- Patient lookups
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_village ON patients(village);
CREATE INDEX IF NOT EXISTS idx_patients_district ON patients(district);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON patients(abha_id);

-- Care journey status
CREATE INDEX IF NOT EXISTS idx_care_journeys_patient_id ON care_journeys(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_journeys_status ON care_journeys(status);
CREATE INDEX IF NOT EXISTS idx_care_journeys_worker ON care_journeys(assigned_worker_id);

-- Encounters
CREATE INDEX IF NOT EXISTS idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_journey ON encounters(care_journey_id);
CREATE INDEX IF NOT EXISTS idx_encounters_facility ON encounters(facility_id);

-- Facility resources (critical for Care Route Assurance)
CREATE INDEX IF NOT EXISTS idx_facility_resources_facility ON facility_resources(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_resources_status ON facility_resources(status);
CREATE INDEX IF NOT EXISTS idx_facility_resources_type ON facility_resources(resource_type, resource_name);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_patient ON referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_target ON referrals(target_facility_id);
CREATE INDEX IF NOT EXISTS idx_referrals_source ON referrals(source_facility_id);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_facility ON appointments(facility_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);

-- Follow-ups
CREATE INDEX IF NOT EXISTS idx_followups_patient ON followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_worker ON followups(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_due ON followups(due_date);

-- Care breaks
CREATE INDEX IF NOT EXISTS idx_care_breaks_patient ON care_breaks(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_breaks_status ON care_breaks(status);
CREATE INDEX IF NOT EXISTS idx_care_breaks_worker ON care_breaks(assigned_worker_id);

-- Teleconsultations
CREATE INDEX IF NOT EXISTS idx_teleconsultations_specialist ON teleconsultations(specialist_id);
CREATE INDEX IF NOT EXISTS idx_teleconsultations_status ON teleconsultations(status);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Sync queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

-- Facility medicines
CREATE INDEX IF NOT EXISTS idx_facility_medicines_facility ON facility_medicines(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_medicines_status ON facility_medicines(status);

-- Care events timeline
CREATE INDEX IF NOT EXISTS idx_care_events_journey ON care_events(care_journey_id);
CREATE INDEX IF NOT EXISTS idx_care_events_patient ON care_events(patient_id);
