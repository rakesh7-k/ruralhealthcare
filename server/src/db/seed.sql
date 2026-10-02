-- ============================================================
-- SETHU — Demo Seed Data
-- ============================================================
-- Realistic but fictional data for the golden demo scenario.
-- Covers 5 facilities, 10+ patients, several doctors, workers,
-- referral cases, follow-up cases, and 2 care-break cases.
-- ============================================================

-- ============================================================
-- ROLES
-- ============================================================
INSERT OR IGNORE INTO roles (id, name, description) VALUES
  ('role-patient',        'PATIENT',        'Patient or caregiver accessing their own care journey'),
  ('role-worker',         'WORKER',         'Frontline health worker (ASHA/ANM/CHO) performing community health duties'),
  ('role-doctor',         'DOCTOR',         'Doctor or clinician providing clinical care'),
  ('role-facility-staff', 'FACILITY_STAFF', 'Facility operations staff managing resources and logistics'),
  ('role-admin',          'ADMIN',          'District administrator viewing aggregated metrics');

-- ============================================================
-- FACILITIES (5 facilities across Kaveri district)
-- ============================================================
INSERT OR IGNORE INTO facilities (id, name, type, district, state, address, latitude, longitude, phone, operating_hours, bed_count) VALUES
  ('fac-shc-01', 'Nilgiri Sub Health Centre',     'SHC', 'Kaveri', 'Tamil Nadu', 'Nilgiri Village, Kaveri Block',      11.4100, 76.7200, '04262-200001', '09:00-16:00', 2),
  ('fac-phc-01', 'Thenkarai Primary Health Centre','PHC', 'Kaveri', 'Tamil Nadu', 'Main Road, Thenkarai',               11.3800, 76.6900, '04262-200002', '08:00-20:00', 10),
  ('fac-phc-02', 'Vazhapadi Primary Health Centre','PHC', 'Kaveri', 'Tamil Nadu', 'Bus Stand Road, Vazhapadi',          11.3500, 76.7400, '04262-200003', '08:00-20:00', 8),
  ('fac-chc-01', 'Mettur Community Health Centre', 'CHC', 'Kaveri', 'Tamil Nadu', 'Hospital Road, Mettur',              11.7800, 77.8000, '04298-200004', '24 hours',    50),
  ('fac-dh-01',  'Kaveri District Hospital',       'DH',  'Kaveri', 'Tamil Nadu', 'Government Hospital Road, Salem',    11.6500, 78.1600, '0427-2200005', '24 hours',    200);

-- ============================================================
-- USERS (password: sethu123, bcrypt hash)
-- ============================================================
-- bcrypt hash of 'sethu123' with 10 rounds
-- $2a$10$X7UrE5xLk0Q8K8M8M8M8MeXJn2k3WJ8wI1b5r9TqA6xK2Y1Z3Q2S6

INSERT OR IGNORE INTO users (id, phone, email, password_hash, full_name, preferred_language) VALUES
  -- Frontline Workers
  ('usr-worker-01', '9876500001', 'asha.devi@sethu.demo',     '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Asha Devi',            'ta'),
  ('usr-worker-02', '9876500002', 'meena.kumari@sethu.demo',  '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Meena Kumari',         'ta'),
  -- Doctors
  ('usr-doctor-01', '9876500003', 'dr.sharma@sethu.demo',     '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Dr. Anand Sharma',     'en'),
  ('usr-doctor-02', '9876500004', 'dr.priya@sethu.demo',      '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Dr. Priya Nair',       'ta'),
  ('usr-doctor-03', '9876500005', 'dr.reddy@sethu.demo',      '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Dr. Venkat Reddy',     'en'),  -- Cardiologist (specialist)
  ('usr-doctor-04', '9876500006', 'dr.lakshmi@sethu.demo',    '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Dr. Lakshmi Bai',      'ta'),  -- Radiologist
  -- Facility Staff
  ('usr-fstaff-01', '9876500007', 'facility.admin@sethu.demo','$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Ravi Kumar',           'ta'),
  ('usr-fstaff-02', '9876500008', 'facility.mettur@sethu.demo','$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Sundar Rajan',         'ta'),
  -- District Admin
  ('usr-admin-01',  '9876500009', 'district.admin@sethu.demo','$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Collector S. Murugan', 'en'),
  -- Patients (with user accounts)
  ('usr-patient-01','9876500010', 'rajesh.kumar@sethu.demo',  '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Rajesh Kumar',         'ta'),
  ('usr-patient-02','9876500011', null,                        '$2a$10$QkrhcWR4JwSxFYj0VX6XneO5Nq.iq8BBs9s/j1f6AWkhqwU2N3J32', 'Lakshmi Ammal',        'ta');

-- ============================================================
-- USER ROLES
-- ============================================================
INSERT OR IGNORE INTO user_roles (id, user_id, role_id, facility_id) VALUES
  ('ur-01', 'usr-worker-01',  'role-worker',         'fac-phc-01'),
  ('ur-02', 'usr-worker-02',  'role-worker',         'fac-phc-02'),
  ('ur-03', 'usr-doctor-01',  'role-doctor',         'fac-phc-01'),
  ('ur-04', 'usr-doctor-02',  'role-doctor',         'fac-phc-02'),
  ('ur-05', 'usr-doctor-03',  'role-doctor',         'fac-dh-01'),   -- Specialist at district hospital
  ('ur-06', 'usr-doctor-04',  'role-doctor',         'fac-chc-01'),
  ('ur-07', 'usr-fstaff-01',  'role-facility-staff', 'fac-phc-01'),
  ('ur-08', 'usr-fstaff-02',  'role-facility-staff', 'fac-chc-01'),
  ('ur-09', 'usr-admin-01',   'role-admin',          null),
  ('ur-10', 'usr-patient-01', 'role-patient',        null),
  ('ur-11', 'usr-patient-02', 'role-patient',        null);

-- ============================================================
-- PATIENTS (10+ patients across villages)
-- ============================================================
INSERT OR IGNORE INTO patients (id, user_id, full_name, date_of_birth, gender, blood_group, village, district, state, phone, registration_source, registered_by) VALUES
  ('pat-01', 'usr-patient-01', 'Rajesh Kumar',        '1978-05-15', 'MALE',   'B+',  'Nilgiri',     'Kaveri', 'Tamil Nadu', '9876500010', 'WORKER',   'usr-worker-01'),
  ('pat-02', 'usr-patient-02', 'Lakshmi Ammal',       '1955-11-20', 'FEMALE', 'O+',  'Nilgiri',     'Kaveri', 'Tamil Nadu', '9876500011', 'WORKER',   'usr-worker-01'),
  ('pat-03', null,             'Murugan S.',           '1990-03-08', 'MALE',   'A+',  'Thenkarai',   'Kaveri', 'Tamil Nadu', '9876500012', 'WORKER',   'usr-worker-01'),
  ('pat-04', null,             'Selvi R.',             '1985-07-22', 'FEMALE', 'AB+', 'Thenkarai',   'Kaveri', 'Tamil Nadu', '9876500013', 'WORKER',   'usr-worker-01'),
  ('pat-05', null,             'Kannan M.',            '1962-01-10', 'MALE',   'O-',  'Vazhapadi',   'Kaveri', 'Tamil Nadu', '9876500014', 'WORKER',   'usr-worker-02'),
  ('pat-06', null,             'Parvathi D.',          '1998-09-03', 'FEMALE', null,  'Vazhapadi',   'Kaveri', 'Tamil Nadu', '9876500015', 'WORKER',   'usr-worker-02'),
  ('pat-07', null,             'Gopal Krishnan',       '1972-12-25', 'MALE',   'B-',  'Nilgiri',     'Kaveri', 'Tamil Nadu', '9876500016', 'FACILITY', 'usr-fstaff-01'),
  ('pat-08', null,             'Anitha S.',            '2001-04-14', 'FEMALE', 'A-',  'Mettur',      'Kaveri', 'Tamil Nadu', '9876500017', 'FACILITY', 'usr-fstaff-02'),
  ('pat-09', null,             'Baby Velayutham',      '1948-08-30', 'MALE',   'O+',  'Nilgiri',     'Kaveri', 'Tamil Nadu', null,          'WORKER',   'usr-worker-01'),
  ('pat-10', null,             'Kamala Devi',          '1969-02-17', 'FEMALE', 'B+',  'Thenkarai',   'Kaveri', 'Tamil Nadu', '9876500019', 'WORKER',   'usr-worker-01'),
  ('pat-11', null,             'Suresh Babu',          '1988-06-05', 'MALE',   'A+',  'Vazhapadi',   'Kaveri', 'Tamil Nadu', '9876500020', 'WORKER',   'usr-worker-02'),
  ('pat-12', null,             'Meenakshi A.',         '1975-10-12', 'FEMALE', 'AB-', 'Mettur',      'Kaveri', 'Tamil Nadu', '9876500021', 'WORKER',   'usr-worker-02');

-- ============================================================
-- PATIENT CAREGIVERS
-- ============================================================
INSERT OR IGNORE INTO patient_caregivers (id, patient_id, caregiver_name, relationship, phone, is_primary) VALUES
  ('cg-01', 'pat-02', 'Rajesh Kumar',    'Son',      '9876500010', 1),
  ('cg-02', 'pat-09', 'Selvi Velayutham','Daughter',  '9876500022', 1),
  ('cg-03', 'pat-01', 'Priya Kumar',     'Wife',     '9876500023', 1);

-- ============================================================
-- FACILITY RESOURCES — with varying freshness and verification states
-- Core data for the "never pretend unknown data is known" principle
-- ============================================================

-- Mettur CHC (Facility B in golden demo — 14 km, stale data)
INSERT OR IGNORE INTO facility_resources (id, facility_id, resource_type, resource_name, status, last_updated_at, updated_by_user_id, update_source, verification_state, verification_timestamp) VALUES
  ('res-chc-01', 'fac-chc-01', 'specialist',  'General Surgeon',   'AVAILABLE',            datetime('now', '-2 hours'),  'usr-fstaff-02', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-2 hours')),
  ('res-chc-02', 'fac-chc-01', 'specialist',  'Cardiologist',      'AVAILABLE',            datetime('now', '-3 days'),   'usr-fstaff-02', 'FACILITY_STAFF',     'PARTIALLY_VERIFIED',  datetime('now', '-3 days')),
  ('res-chc-03', 'fac-chc-01', 'diagnostic',  'X-Ray',             'UNKNOWN',              datetime('now', '-12 days'),  'usr-fstaff-02', 'FRONTLINE_WORKER',   'STALE',               datetime('now', '-12 days')),
  ('res-chc-04', 'fac-chc-01', 'diagnostic',  'ECG',               'AVAILABLE',            datetime('now', '-1 day'),    'usr-fstaff-02', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-1 day')),
  ('res-chc-05', 'fac-chc-01', 'diagnostic',  'Blood Test',        'AVAILABLE',            datetime('now', '-5 hours'),  'usr-fstaff-02', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-5 hours')),
  ('res-chc-06', 'fac-chc-01', 'diagnostic',  'Ultrasound',        'UNAVAILABLE',          datetime('now', '-2 days'),   'usr-fstaff-02', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-2 days')),
  ('res-chc-07', 'fac-chc-01', 'equipment',   'Ventilator',        'AVAILABLE',            datetime('now', '-4 days'),   'usr-fstaff-02', 'FACILITY_STAFF',     'PARTIALLY_VERIFIED',  null);

-- Kaveri District Hospital (Facility A in golden demo — 32 km, fresh data)
INSERT OR IGNORE INTO facility_resources (id, facility_id, resource_type, resource_name, status, last_updated_at, updated_by_user_id, update_source, verification_state, verification_timestamp) VALUES
  ('res-dh-01',  'fac-dh-01', 'specialist',  'Cardiologist',      'AVAILABLE',            datetime('now', '-2 hours'),  'usr-doctor-03', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-2 hours')),
  ('res-dh-02',  'fac-dh-01', 'specialist',  'General Surgeon',   'AVAILABLE',            datetime('now', '-4 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-4 hours')),
  ('res-dh-03',  'fac-dh-01', 'specialist',  'Orthopedic',        'AVAILABLE',            datetime('now', '-6 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-6 hours')),
  ('res-dh-04',  'fac-dh-01', 'specialist',  'Gynecologist',      'AVAILABLE',            datetime('now', '-1 day'),    'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-1 day')),
  ('res-dh-05',  'fac-dh-01', 'diagnostic',  'X-Ray',             'AVAILABLE',            datetime('now', '-1 hour'),   'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-1 hour')),
  ('res-dh-06',  'fac-dh-01', 'diagnostic',  'ECG',               'AVAILABLE',            datetime('now', '-3 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-3 hours')),
  ('res-dh-07',  'fac-dh-01', 'diagnostic',  'Blood Test',        'AVAILABLE',            datetime('now', '-2 hours'),  'usr-fstaff-01', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-2 hours')),
  ('res-dh-08',  'fac-dh-01', 'diagnostic',  'Ultrasound',        'AVAILABLE',            datetime('now', '-5 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-5 hours')),
  ('res-dh-09',  'fac-dh-01', 'diagnostic',  'CT Scan',           'AVAILABLE',            datetime('now', '-8 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-8 hours')),
  ('res-dh-10',  'fac-dh-01', 'equipment',   'Ventilator',        'AVAILABLE',            datetime('now', '-3 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-3 hours')),
  ('res-dh-11',  'fac-dh-01', 'equipment',   'ICU Bed',           'AVAILABLE',            datetime('now', '-1 hour'),   'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-1 hour'));

-- Thenkarai PHC
INSERT OR IGNORE INTO facility_resources (id, facility_id, resource_type, resource_name, status, last_updated_at, updated_by_user_id, update_source, verification_state, verification_timestamp) VALUES
  ('res-phc1-01', 'fac-phc-01', 'diagnostic', 'Blood Test',       'AVAILABLE',            datetime('now', '-4 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-4 hours')),
  ('res-phc1-02', 'fac-phc-01', 'diagnostic', 'Blood Pressure',   'AVAILABLE',            datetime('now', '-1 hour'),   'usr-doctor-01', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-1 hour')),
  ('res-phc1-03', 'fac-phc-01', 'diagnostic', 'Urine Test',       'AVAILABLE',            datetime('now', '-3 hours'),  'usr-fstaff-01', 'FACILITY_STAFF',     'VERIFIED',            datetime('now', '-3 hours')),
  ('res-phc1-04', 'fac-phc-01', 'equipment',  'Nebulizer',        'AVAILABLE',            datetime('now', '-2 days'),   'usr-fstaff-01', 'FACILITY_STAFF',     'PARTIALLY_VERIFIED',  null);

-- Vazhapadi PHC
INSERT OR IGNORE INTO facility_resources (id, facility_id, resource_type, resource_name, status, last_updated_at, updated_by_user_id, update_source, verification_state, verification_timestamp) VALUES
  ('res-phc2-01', 'fac-phc-02', 'diagnostic', 'Blood Test',       'AVAILABLE',            datetime('now', '-6 hours'),  'usr-doctor-02', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-6 hours')),
  ('res-phc2-02', 'fac-phc-02', 'diagnostic', 'Blood Pressure',   'AVAILABLE',            datetime('now', '-2 hours'),  'usr-doctor-02', 'CLINICAL_STAFF',     'VERIFIED',            datetime('now', '-2 hours')),
  ('res-phc2-03', 'fac-phc-02', 'diagnostic', 'Urine Test',       'PENDING_VERIFICATION', datetime('now', '-8 days'),   'usr-worker-02', 'FRONTLINE_WORKER',   'UNVERIFIED',          null);

-- ============================================================
-- MEDICINES
-- ============================================================
INSERT OR IGNORE INTO medicines (id, name, generic_name, category, unit) VALUES
  ('med-01', 'Amlodipine 5mg',     'Amlodipine',         'cardiovascular',  'tablet'),
  ('med-02', 'Metformin 500mg',    'Metformin',           'antidiabetic',    'tablet'),
  ('med-03', 'Atorvastatin 10mg',  'Atorvastatin',        'cardiovascular',  'tablet'),
  ('med-04', 'Amoxicillin 500mg',  'Amoxicillin',         'antibiotic',      'capsule'),
  ('med-05', 'Paracetamol 500mg',  'Paracetamol',         'analgesic',       'tablet'),
  ('med-06', 'Omeprazole 20mg',    'Omeprazole',          'gastrointestinal','capsule'),
  ('med-07', 'Aspirin 75mg',       'Aspirin',             'cardiovascular',  'tablet'),
  ('med-08', 'Salbutamol Inhaler', 'Salbutamol',          'respiratory',     'inhaler'),
  ('med-09', 'ORS Packets',        'ORS',                 'rehydration',     'packet'),
  ('med-10', 'Iron + Folic Acid',  'Ferrous Sulphate',    'supplement',      'tablet');

-- Facility medicine availability
INSERT OR IGNORE INTO facility_medicines (id, facility_id, medicine_id, status, last_updated_at, update_source, verification_state) VALUES
  -- District Hospital — well stocked
  ('fm-01', 'fac-dh-01', 'med-01', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-02', 'fac-dh-01', 'med-02', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-03', 'fac-dh-01', 'med-03', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-04', 'fac-dh-01', 'med-04', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-05', 'fac-dh-01', 'med-05', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-06', 'fac-dh-01', 'med-06', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-07', 'fac-dh-01', 'med-07', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-08', 'fac-dh-01', 'med-08', 'LIMITED',     datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-09', 'fac-dh-01', 'med-09', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-10', 'fac-dh-01', 'med-10', 'AVAILABLE',   datetime('now', '-3 hours'),  'FACILITY_STAFF', 'VERIFIED'),
  -- CHC — some gaps
  ('fm-11', 'fac-chc-01', 'med-01', 'AVAILABLE',   datetime('now', '-1 day'),   'FACILITY_STAFF', 'VERIFIED'),
  ('fm-12', 'fac-chc-01', 'med-02', 'AVAILABLE',   datetime('now', '-1 day'),   'FACILITY_STAFF', 'VERIFIED'),
  ('fm-13', 'fac-chc-01', 'med-03', 'UNAVAILABLE', datetime('now', '-5 days'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-14', 'fac-chc-01', 'med-04', 'AVAILABLE',   datetime('now', '-1 day'),   'FACILITY_STAFF', 'VERIFIED'),
  ('fm-15', 'fac-chc-01', 'med-05', 'AVAILABLE',   datetime('now', '-6 hours'), 'FACILITY_STAFF', 'VERIFIED'),
  ('fm-16', 'fac-chc-01', 'med-07', 'AVAILABLE',   datetime('now', '-2 days'),  'FACILITY_STAFF', 'PARTIALLY_VERIFIED'),
  -- PHC Thenkarai — basic stock
  ('fm-17', 'fac-phc-01', 'med-04', 'AVAILABLE',   datetime('now', '-2 days'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-18', 'fac-phc-01', 'med-05', 'AVAILABLE',   datetime('now', '-1 day'),   'FACILITY_STAFF', 'VERIFIED'),
  ('fm-19', 'fac-phc-01', 'med-09', 'AVAILABLE',   datetime('now', '-3 days'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-20', 'fac-phc-01', 'med-10', 'LIMITED',     datetime('now', '-4 days'),  'FACILITY_STAFF', 'PARTIALLY_VERIFIED'),
  -- PHC Vazhapadi — some unknown
  ('fm-21', 'fac-phc-02', 'med-04', 'AVAILABLE',   datetime('now', '-1 day'),   'FACILITY_STAFF', 'VERIFIED'),
  ('fm-22', 'fac-phc-02', 'med-05', 'AVAILABLE',   datetime('now', '-2 days'),  'FACILITY_STAFF', 'VERIFIED'),
  ('fm-23', 'fac-phc-02', 'med-09', 'UNKNOWN',     datetime('now', '-10 days'), 'FRONTLINE_WORKER','STALE');

-- ============================================================
-- FACILITY SERVICES
-- ============================================================
INSERT OR IGNORE INTO facility_services (id, facility_id, service_type, service_name, is_available, last_verified_at, verified_by) VALUES
  -- District Hospital — full services
  ('fs-01', 'fac-dh-01', 'cardiology',       'Cardiology',          1, datetime('now', '-2 hours'), 'usr-fstaff-01'),
  ('fs-02', 'fac-dh-01', 'general_surgery',   'General Surgery',     1, datetime('now', '-4 hours'), 'usr-fstaff-01'),
  ('fs-03', 'fac-dh-01', 'orthopedics',       'Orthopedics',         1, datetime('now', '-6 hours'), 'usr-fstaff-01'),
  ('fs-04', 'fac-dh-01', 'gynecology',        'Gynecology',          1, datetime('now', '-1 day'),   'usr-fstaff-01'),
  ('fs-05', 'fac-dh-01', 'radiology',         'Radiology',           1, datetime('now', '-3 hours'), 'usr-fstaff-01'),
  ('fs-06', 'fac-dh-01', 'pathology',         'Pathology',           1, datetime('now', '-2 hours'), 'usr-fstaff-01'),
  ('fs-07', 'fac-dh-01', 'emergency',         'Emergency Services',  1, datetime('now', '-1 hour'),  'usr-fstaff-01'),
  -- CHC
  ('fs-08', 'fac-chc-01', 'general_medicine', 'General Medicine',    1, datetime('now', '-1 day'),   'usr-fstaff-02'),
  ('fs-09', 'fac-chc-01', 'general_surgery',  'General Surgery',     1, datetime('now', '-2 days'),  'usr-fstaff-02'),
  ('fs-10', 'fac-chc-01', 'radiology',        'Radiology',           0, datetime('now', '-12 days'), 'usr-fstaff-02'),  -- Unavailable
  ('fs-11', 'fac-chc-01', 'pathology',        'Pathology',           1, datetime('now', '-5 hours'), 'usr-fstaff-02'),
  -- PHCs — basic
  ('fs-12', 'fac-phc-01', 'general_medicine', 'General Medicine',    1, datetime('now', '-4 hours'), 'usr-fstaff-01'),
  ('fs-13', 'fac-phc-01', 'maternal_health',  'Maternal Health',     1, datetime('now', '-1 day'),   'usr-fstaff-01'),
  ('fs-14', 'fac-phc-02', 'general_medicine', 'General Medicine',    1, datetime('now', '-6 hours'), 'usr-doctor-02'),
  ('fs-15', 'fac-phc-02', 'maternal_health',  'Maternal Health',     1, datetime('now', '-2 days'),  'usr-doctor-02');

-- ============================================================
-- GOLDEN DEMO SCENARIO DATA
-- Care Journey for Rajesh Kumar (pat-01)
-- Chest pain → Triage → Doctor → Teleconsult → Care Requirement →
-- Route Assurance → Referral → Treatment → Follow-up missed → Care Break
-- ============================================================

-- Care Journey
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-01', 'pat-01', 'AWAITING_FOLLOWUP', 'Chest pain and shortness of breath', datetime('now', '-5 days'), 'fac-dh-01', 'usr-worker-01');

-- Encounter at PHC
INSERT OR IGNORE INTO encounters (id, patient_id, care_journey_id, facility_id, clinician_id, encounter_type, chief_complaint, started_at, ended_at) VALUES
  ('enc-01', 'pat-01', 'cj-01', 'fac-phc-01', 'usr-worker-01', 'WALK_IN', 'Chest pain and shortness of breath for 3 days', datetime('now', '-5 days'), datetime('now', '-5 days', '+1 hour'));

-- Triage
INSERT OR IGNORE INTO triage_assessments (id, encounter_id, patient_id, symptoms, vitals, warning_signs_checked, medical_history_flags, triage_level, triage_notes, assessed_by) VALUES
  ('tri-01', 'enc-01', 'pat-01',
   '[{"symptom":"Chest pain","duration":"3 days","severity":"MODERATE","notes":"Worse with exertion"},{"symptom":"Shortness of breath","duration":"3 days","severity":"MODERATE","notes":"Especially when climbing stairs"},{"symptom":"Fatigue","duration":"1 week","severity":"MILD","notes":null}]',
   '{"bloodPressureSystolic":150,"bloodPressureDiastolic":95,"heartRate":92,"temperature":37.1,"respiratoryRate":22,"oxygenSaturation":95,"bloodGlucose":null,"weight":72,"height":168}',
   '[{"sign":"Chest pain","present":true},{"sign":"Difficulty breathing","present":true},{"sign":"Loss of consciousness","present":false},{"sign":"Severe bleeding","present":false}]',
   '["hypertension","family_history_cardiac"]',
   'URGENT',
   'Patient presents with chest pain and dyspnea. History of hypertension. Requires urgent cardiology evaluation.',
   'usr-worker-01');

-- Consultation by PHC doctor
INSERT OR IGNORE INTO consultations (id, encounter_id, doctor_id, patient_id, clinical_notes, assessment, treatment_plan) VALUES
  ('con-01', 'enc-01', 'usr-doctor-01', 'pat-01',
   'Patient presents with retrosternal chest pain, worsened by exertion, relieved partially by rest. History of hypertension for 5 years, irregularly medicated. Family history of cardiac disease. BP 150/95, HR 92, SpO2 95%. Needs specialist cardiac evaluation, ECG, and chest X-ray.',
   'Suspected cardiac condition — requires cardiology teleconsultation and further investigation.',
   'Immediate: Aspirin 75mg. Teleconsultation with cardiologist. ECG and X-ray at higher facility.');

-- Teleconsultation with cardiologist
INSERT OR IGNORE INTO teleconsultations (id, consultation_id, patient_id, specialist_id, requesting_doctor_id, requesting_facility_id, specialist_facility_id, status, specialty_required, reason_for_consult, scheduled_at, started_at, ended_at, specialist_notes, specialist_recommendation, requires_physical_exam, requires_diagnostics) VALUES
  ('tc-01', 'con-01', 'pat-01', 'usr-doctor-03', 'usr-doctor-01', 'fac-phc-01', 'fac-dh-01',
   'COMPLETED', 'cardiology', 'Chest pain with hypertension, suspected cardiac involvement',
   datetime('now', '-4 days'), datetime('now', '-4 days', '+30 minutes'), datetime('now', '-4 days', '+55 minutes'),
   'Patient has significant risk factors. ECG and chest X-ray essential before definitive diagnosis. Physical examination of cardiac sounds needed. Recommend Amlodipine 5mg for BP control along with Aspirin.',
   'Needs physical cardiac examination, ECG, and chest X-ray at a facility with cardiology and radiology services. Continue Amlodipine and Aspirin. Follow-up in 7 days after investigations.',
   1,
   '["ECG","X-ray"]');

-- Add 5 pending teleconsult requests visible in the doctor queue
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-tele-01', 'pat-03', 'TELECONSULTATION_PENDING', 'Recurring headaches and dizziness', datetime('now', '-2 days'), 'fac-phc-01', 'usr-worker-01'),
  ('cj-tele-02', 'pat-05', 'TELECONSULTATION_PENDING', 'Shortness of breath and wheezing', datetime('now', '-1 day'), 'fac-phc-02', 'usr-worker-02'),
  ('cj-tele-03', 'pat-06', 'TELECONSULTATION_PENDING', 'Abdominal pain and vomiting', datetime('now', '-3 days'), 'fac-phc-02', 'usr-worker-02'),
  ('cj-tele-04', 'pat-08', 'TELECONSULTATION_PENDING', 'Fever and lethargy', datetime('now', '-1 day'), 'fac-chc-01', 'usr-worker-02'),
  ('cj-tele-05', 'pat-11', 'TELECONSULTATION_PENDING', 'Back pain after lifting work', datetime('now', '-2 days'), 'fac-phc-02', 'usr-worker-02');

INSERT OR IGNORE INTO encounters (id, patient_id, care_journey_id, facility_id, clinician_id, encounter_type, chief_complaint, started_at, ended_at) VALUES
  ('enc-tele-01', 'pat-03', 'cj-tele-01', 'fac-phc-01', 'usr-doctor-01', 'CLINIC_VISIT', 'Recurring headaches and dizziness', datetime('now', '-2 days'), datetime('now', '-2 days', '+45 minutes')),
  ('enc-tele-02', 'pat-05', 'cj-tele-02', 'fac-phc-02', 'usr-doctor-02', 'CLINIC_VISIT', 'Shortness of breath and wheezing', datetime('now', '-1 day'), datetime('now', '-1 day', '+40 minutes')),
  ('enc-tele-03', 'pat-06', 'cj-tele-03', 'fac-phc-02', 'usr-doctor-02', 'CLINIC_VISIT', 'Abdominal pain and vomiting', datetime('now', '-3 days'), datetime('now', '-3 days', '+35 minutes')),
  ('enc-tele-04', 'pat-08', 'cj-tele-04', 'fac-chc-01', 'usr-doctor-04', 'CLINIC_VISIT', 'Fever and lethargy', datetime('now', '-1 day'), datetime('now', '-1 day', '+30 minutes')),
  ('enc-tele-05', 'pat-11', 'cj-tele-05', 'fac-phc-02', 'usr-doctor-02', 'CLINIC_VISIT', 'Back pain after lifting work', datetime('now', '-2 days'), datetime('now', '-2 days', '+50 minutes'));

INSERT OR IGNORE INTO consultations (id, encounter_id, doctor_id, patient_id, clinical_notes, assessment, treatment_plan) VALUES
  ('con-tele-01', 'enc-tele-01', 'usr-doctor-01', 'pat-03', 'Recurring headache with dizziness and reduced appetite for 3 days; symptoms worsening.', 'Suspected neurological follow-up and specialist review needed.', 'Request specialist assessment and monitor vitals.'),
  ('con-tele-02', 'enc-tele-02', 'usr-doctor-02', 'pat-05', 'Shortness of breath with wheezing and fatigue during work; needs specialist evaluation.', 'Suspected respiratory issue requiring pulmonology review.', 'Evaluate oxygen status and request teleconsult.'),
  ('con-tele-03', 'enc-tele-03', 'usr-doctor-02', 'pat-06', 'Persistent abdominal pain and vomiting; fever noted for 24 hours.', 'Needs surgical review with possible abdominal assessment.', 'Urgent teleconsult with general surgery specialist.'),
  ('con-tele-04', 'enc-tele-04', 'usr-doctor-04', 'pat-08', 'Recurrent fever and lethargy with mild dehydration; family reports inability to eat normally.', 'Potential infectious condition requiring specialist confirmation.', 'Request pediatric/medical teleconsultation.'),
  ('con-tele-05', 'enc-tele-05', 'usr-doctor-02', 'pat-11', 'Severe back pain and limited movement after lifting work; pain worsening over 2 days.', 'Musculoskeletal concern requiring orthopedic review.', 'Arrange teleconsult and mobility assessment.');

INSERT OR IGNORE INTO teleconsultations (id, consultation_id, patient_id, specialist_id, requesting_doctor_id, requesting_facility_id, specialist_facility_id, status, specialty_required, reason_for_consult, scheduled_at, started_at, ended_at, specialist_notes, specialist_recommendation, requires_physical_exam, requires_diagnostics) VALUES
  ('tc-tele-01', 'con-tele-01', 'pat-03', 'usr-doctor-03', 'usr-doctor-01', 'fac-phc-01', 'fac-dh-01', 'REQUESTED', 'neurology', 'Recurring headaches and dizziness requiring urgent specialist review', datetime('now', '+1 day'), null, null, null, null, 0, '["Neurology review"]'),
  ('tc-tele-02', 'con-tele-02', 'pat-05', 'usr-doctor-03', 'usr-doctor-02', 'fac-phc-02', 'fac-dh-01', 'REQUESTED', 'pulmonology', 'Shortness of breath and wheezing need respiratory specialist input', datetime('now', '+1 day'), null, null, null, null, 0, '["Pulmonary assessment"]'),
  ('tc-tele-03', 'con-tele-03', 'pat-06', 'usr-doctor-03', 'usr-doctor-02', 'fac-phc-02', 'fac-dh-01', 'REQUESTED', 'general_surgery', 'Persistent abdominal pain and vomiting with unclear diagnosis', datetime('now', '+2 days'), null, null, null, null, 1, '["Abdominal ultrasound"]'),
  ('tc-tele-04', 'con-tele-04', 'pat-08', 'usr-doctor-03', 'usr-doctor-04', 'fac-chc-01', 'fac-dh-01', 'REQUESTED', 'internal_medicine', 'Fever and lethargy with possible systemic disease', datetime('now', '+1 day'), null, null, null, null, 0, '["Laboratory review"]'),
  ('tc-tele-05', 'con-tele-05', 'pat-11', 'usr-doctor-03', 'usr-doctor-02', 'fac-phc-02', 'fac-dh-01', 'REQUESTED', 'orthopedics', 'Back pain after lifting; needs orthopedic review', datetime('now', '+2 days'), null, null, null, null, 1, '["Musculoskeletal evaluation"]');

-- Care Requirement
INSERT OR IGNORE INTO care_requirements (id, encounter_id, patient_id, care_journey_id, specialist_type, diagnostics_needed, medicines_needed, requires_physical_exam, follow_up_days, urgency, notes, created_by) VALUES
  ('cr-01', 'enc-01', 'pat-01', 'cj-01', 'cardiology',
   '[{"type":"ECG","priority":"REQUIRED","notes":"Baseline cardiac assessment"},{"type":"X-ray","priority":"REQUIRED","notes":"Chest X-ray PA view"}]',
   '[{"medicineId":"med-01","name":"Amlodipine 5mg","dosage":"5mg once daily","priority":"REQUIRED"},{"medicineId":"med-07","name":"Aspirin 75mg","dosage":"75mg once daily","priority":"REQUIRED"}]',
   1, 7, 'URGENT', 'Post-teleconsultation: cardiologist recommends in-person exam + ECG + X-ray', 'usr-doctor-01');

-- Care Route Evaluation (golden demo scenario)
INSERT OR IGNORE INTO care_route_evaluations (id, care_requirement_id, patient_id, patient_latitude, patient_longitude, patient_village, evaluated_at, selected_facility_id, selection_reason, evaluated_by) VALUES
  ('cre-01', 'cr-01', 'pat-01', 11.4100, 76.7200, 'Nilgiri', datetime('now', '-4 days'),
   'fac-dh-01',
   'Kaveri District Hospital is recommended despite being farther (32 km vs 14 km) because: (1) Cardiologist availability is confirmed with HIGH trust (verified 2 hours ago by clinical staff), (2) X-ray is confirmed AVAILABLE with HIGH trust (verified 1 hour ago), (3) All required medicines are in stock. Mettur CHC is closer but X-ray status is UNKNOWN (data is 12 days stale, reported by frontline worker, verification is STALE) — care completion cannot be assured.',
   'usr-doctor-01');

-- Facility Matches
INSERT OR IGNORE INTO facility_matches (id, evaluation_id, facility_id, overall_score, can_complete_care, specialist_available, specialist_trust_score, diagnostics_match, medicine_match, distance_km, estimated_wait_minutes, data_freshness_score, recommendation, concerns, selection_explanation) VALUES
  ('fm-match-01', 'cre-01', 'fac-dh-01', 87.5, 1, 1, 92.0,
   '{"ECG":{"available":true,"trustScore":88},"X-ray":{"available":true,"trustScore":95}}',
   '{"Amlodipine 5mg":{"available":true,"trustScore":90},"Aspirin 75mg":{"available":true,"trustScore":90}}',
   32.0, 35, 91.0, 'RECOMMENDED', '[]',
   'All required services available with high confidence. Cardiologist, ECG, X-ray, and medicines confirmed available with recent verification.'),
  ('fm-match-02', 'cre-01', 'fac-chc-01', 52.3, 0, 1, 58.0,
   '{"ECG":{"available":true,"trustScore":78},"X-ray":{"available":null,"trustScore":18}}',
   '{"Amlodipine 5mg":{"available":true,"trustScore":72},"Aspirin 75mg":{"available":true,"trustScore":60}}',
   14.0, null, 48.0, 'NOT_RECOMMENDED',
   '["X-ray status is UNKNOWN — data is 12 days stale","X-ray data source: frontline worker report (not facility staff)","Cardiologist data is 3 days old with partial verification","Atorvastatin unavailable at this facility"]',
   'Closer facility but X-ray availability cannot be confirmed. Data is 12 days stale and from a frontline worker report. Risk of incomplete care journey.');

-- Referral to District Hospital
INSERT OR IGNORE INTO referrals (id, care_requirement_id, patient_id, care_journey_id, source_facility_id, target_facility_id, referring_doctor_id, status, urgency, reason, clinical_notes, expected_arrival_by, created_by) VALUES
  ('ref-01', 'cr-01', 'pat-01', 'cj-01', 'fac-phc-01', 'fac-dh-01', 'usr-doctor-01',
   'COMPLETED', 'URGENT',
   'Cardiology evaluation: physical exam, ECG, and chest X-ray required',
   'Post-teleconsultation referral. Suspected cardiac condition. Patient on Amlodipine 5mg + Aspirin 75mg.',
   datetime('now', '-3 days'), 'usr-doctor-01');

-- Referral Events
INSERT OR IGNORE INTO referral_events (id, referral_id, event_type, previous_status, new_status, actor_id, notes) VALUES
  ('re-01', 'ref-01', 'CREATED',          null,              'CREATED',        'usr-doctor-01',  'Referral created post teleconsultation'),
  ('re-02', 'ref-01', 'SENT',             'CREATED',         'SENT',           'usr-doctor-01',  'Referral sent to Kaveri District Hospital'),
  ('re-03', 'ref-01', 'RECEIVED',         'SENT',            'RECEIVED',       'usr-fstaff-01',  'Referral received and acknowledged'),
  ('re-04', 'ref-01', 'ACCEPTED',         'RECEIVED',        'ACCEPTED',       'usr-fstaff-01',  'Cardiology appointment slot available'),
  ('re-05', 'ref-01', 'APPOINTMENT_SET',  'ACCEPTED',        'APPOINTMENT_SET','usr-fstaff-01',  'Appointment scheduled'),
  ('re-06', 'ref-01', 'PATIENT_ARRIVED',  'APPOINTMENT_SET', 'PATIENT_ARRIVED','usr-fstaff-01',  'Patient checked in'),
  ('re-07', 'ref-01', 'CARE_PROVIDED',    'PATIENT_ARRIVED', 'CARE_PROVIDED',  'usr-doctor-03',  'ECG and X-ray completed. Physical exam done.'),
  ('re-08', 'ref-01', 'COMPLETED',        'CARE_PROVIDED',   'COMPLETED',      'usr-doctor-03',  'All required care provided. Follow-up in 7 days.');

-- Appointment at District Hospital
INSERT OR IGNORE INTO appointments (id, patient_id, facility_id, doctor_id, care_journey_id, appointment_type, scheduled_at, status) VALUES
  ('apt-01', 'pat-01', 'fac-dh-01', 'usr-doctor-03', 'cj-01', 'SPECIALIST', datetime('now', '-3 days'), 'COMPLETED');

-- Follow-up (this one will be missed → care break)
INSERT OR IGNORE INTO followups (id, patient_id, care_journey_id, encounter_id, assigned_worker_id, follow_up_type, due_date, status) VALUES
  ('fu-01', 'pat-01', 'cj-01', 'enc-01', 'usr-worker-01', 'post_treatment', datetime('now', '+2 days'), 'PENDING');

-- Care Events Timeline
INSERT OR IGNORE INTO care_events (id, care_journey_id, patient_id, event_type, event_data, facility_id, actor_id, created_at) VALUES
  ('ce-01', 'cj-01', 'pat-01', 'ENCOUNTER_STARTED',            '{"encounterId":"enc-01"}',                          'fac-phc-01', 'usr-worker-01', datetime('now', '-5 days')),
  ('ce-02', 'cj-01', 'pat-01', 'TRIAGE_COMPLETED',             '{"triageId":"tri-01","level":"URGENT"}',            'fac-phc-01', 'usr-worker-01', datetime('now', '-5 days', '+30 minutes')),
  ('ce-03', 'cj-01', 'pat-01', 'CONSULTATION_COMPLETED',       '{"consultationId":"con-01"}',                       'fac-phc-01', 'usr-doctor-01', datetime('now', '-5 days', '+1 hour')),
  ('ce-04', 'cj-01', 'pat-01', 'TELECONSULTATION_COMPLETED',   '{"teleconsultationId":"tc-01","specialist":"Dr. Venkat Reddy"}', 'fac-phc-01', 'usr-doctor-03', datetime('now', '-4 days')),
  ('ce-05', 'cj-01', 'pat-01', 'CARE_REQUIREMENT_CREATED',     '{"careRequirementId":"cr-01"}',                     'fac-phc-01', 'usr-doctor-01', datetime('now', '-4 days')),
  ('ce-06', 'cj-01', 'pat-01', 'ROUTE_EVALUATED',              '{"evaluationId":"cre-01","selectedFacility":"Kaveri District Hospital"}', 'fac-phc-01', 'usr-doctor-01', datetime('now', '-4 days')),
  ('ce-07', 'cj-01', 'pat-01', 'REFERRAL_CREATED',             '{"referralId":"ref-01","targetFacility":"Kaveri District Hospital"}', 'fac-phc-01', 'usr-doctor-01', datetime('now', '-4 days')),
  ('ce-08', 'cj-01', 'pat-01', 'APPOINTMENT_CREATED',          '{"appointmentId":"apt-01"}',                        'fac-dh-01',  'usr-fstaff-01', datetime('now', '-3 days')),
  ('ce-09', 'cj-01', 'pat-01', 'FOLLOWUP_CREATED',             '{"followupId":"fu-01","dueDate":"' || datetime('now', '+2 days') || '"}', 'fac-dh-01', 'usr-doctor-03', datetime('now', '-3 days'));

-- ============================================================
-- ADDITIONAL CARE JOURNEYS — for realistic demo data
-- ============================================================

-- Patient 02: Lakshmi Ammal — diabetes management, completed journey
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, completed_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-02', 'pat-02', 'COMPLETED', 'Uncontrolled blood sugar', datetime('now', '-30 days'), datetime('now', '-10 days'), 'fac-phc-01', 'usr-worker-01');

-- Patient 05: Kannan — knee pain, currently referred, appointment booked
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-03', 'pat-05', 'APPOINTMENT_BOOKED', 'Severe knee pain for 2 weeks', datetime('now', '-7 days'), 'fac-chc-01', 'usr-worker-02');

INSERT OR IGNORE INTO appointments (id, patient_id, facility_id, doctor_id, care_journey_id, appointment_type, scheduled_at, status) VALUES
  ('apt-02', 'pat-05', 'fac-chc-01', 'usr-doctor-04', 'cj-03', 'GENERAL', datetime('now', '+1 day'), 'SCHEDULED');

-- Patient 03: Murugan — care break case (missed follow-up)
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-04', 'pat-03', 'CARE_BREAK', 'Persistent cough and fever', datetime('now', '-14 days'), 'fac-phc-01', 'usr-worker-01');

INSERT OR IGNORE INTO followups (id, patient_id, care_journey_id, encounter_id, assigned_worker_id, follow_up_type, due_date, status) VALUES
  ('fu-02', 'pat-03', 'cj-04', null, 'usr-worker-01', 'medication_check', datetime('now', '-3 days'), 'MISSED');

INSERT OR IGNORE INTO care_breaks (id, care_journey_id, patient_id, break_type, expected_action, expected_by, detected_at, status, assigned_worker_id, related_entity_type, related_entity_id) VALUES
  ('cb-01', 'cj-04', 'pat-03', 'FOLLOWUP_MISSED', 'Follow-up for medication check', datetime('now', '-3 days'), datetime('now', '-1 day'), 'ASSIGNED', 'usr-worker-01', 'followup', 'fu-02');

-- Patient 10: Kamala Devi — care break case (referral not completed)
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-05', 'pat-10', 'CARE_BREAK', 'Abdominal pain', datetime('now', '-10 days'), 'fac-phc-01', 'usr-worker-01');

INSERT OR IGNORE INTO referrals (id, care_requirement_id, patient_id, care_journey_id, source_facility_id, target_facility_id, referring_doctor_id, status, urgency, reason, expected_arrival_by, created_by) VALUES
  ('ref-02', 'cr-01', 'pat-10', 'cj-05', 'fac-phc-01', 'fac-chc-01', 'usr-doctor-01',
   'SENT', 'ROUTINE', 'Ultrasound required for abdominal evaluation',
   datetime('now', '-5 days'), 'usr-doctor-01');

INSERT OR IGNORE INTO care_breaks (id, care_journey_id, patient_id, break_type, expected_action, expected_by, detected_at, status, assigned_worker_id, related_entity_type, related_entity_id) VALUES
  ('cb-02', 'cj-05', 'pat-10', 'REFERRAL_NO_PROGRESS', 'Patient arrival at Mettur CHC for ultrasound', datetime('now', '-5 days'), datetime('now', '-2 days'), 'INVESTIGATING', 'usr-worker-01', 'referral', 'ref-02');

INSERT OR IGNORE INTO barrier_reports (id, care_break_id, barrier_type, description, reported_by) VALUES
  ('br-01', 'cb-02', 'TRANSPORTATION', 'Patient reports no affordable transport to Mettur CHC. Bus service is irregular.', 'usr-worker-01');

-- Patient 06: Parvathi — active journey, awaiting diagnostic
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-06', 'pat-06', 'AWAITING_DIAGNOSTIC', 'Irregular periods and weakness', datetime('now', '-3 days'), 'fac-phc-02', 'usr-worker-02');

-- Patient 07: Gopal — teleconsultation pending
INSERT OR IGNORE INTO care_journeys (id, patient_id, status, primary_complaint, started_at, current_facility_id, assigned_worker_id) VALUES
  ('cj-07', 'pat-07', 'TELECONSULTATION_PENDING', 'Recurring headaches and dizziness', datetime('now', '-2 days'), 'fac-phc-01', 'usr-worker-01');

-- Pending follow-ups for worker dashboard
INSERT OR IGNORE INTO followups (id, patient_id, care_journey_id, encounter_id, assigned_worker_id, follow_up_type, due_date, status) VALUES
  ('fu-03', 'pat-02', 'cj-02', null, 'usr-worker-01', 'vitals_check',      datetime('now', '+1 day'),  'PENDING'),
  ('fu-04', 'pat-04', 'cj-01', null, 'usr-worker-01', 'medication_check',  datetime('now'),            'PENDING'),
  ('fu-05', 'pat-05', 'cj-03', null, 'usr-worker-02', 'post_treatment',    datetime('now', '+3 days'), 'PENDING');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, related_entity_type, related_entity_id, is_read) VALUES
  ('not-01', 'usr-worker-01', 'CARE_BREAK_ALERT',     'Care Break: Murugan S.',         'Follow-up for medication check was missed. Please contact the patient.', 'care_break', 'cb-01', 0),
  ('not-02', 'usr-worker-01', 'CARE_BREAK_ALERT',     'Care Break: Kamala Devi',         'Patient has not arrived at Mettur CHC for scheduled ultrasound. Referral overdue.', 'care_break', 'cb-02', 0),
  ('not-03', 'usr-worker-01', 'FOLLOWUP_DUE',         'Follow-up Due: Lakshmi Ammal',   'Vitals check follow-up is due tomorrow.', 'followup', 'fu-03', 0),
  ('not-04', 'usr-worker-01', 'FOLLOWUP_DUE',         'Follow-up Due: Selvi R.',         'Medication check follow-up is due today.', 'followup', 'fu-04', 0),
  ('not-05', 'usr-doctor-03', 'TELECONSULTATION_READY','Teleconsultation: Gopal Krishnan','Teleconsultation request pending for recurring headaches and dizziness.', 'care_journey', 'cj-07', 0),
  ('not-06', 'usr-patient-01','APPOINTMENT_REMINDER',  'Follow-up Reminder',             'Your follow-up visit is coming up. Please contact your health worker if you need help.', 'followup', 'fu-01', 0);
