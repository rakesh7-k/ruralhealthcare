import { getDatabase } from '../config/database.js';
import { Role } from '@sethu/shared';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Simple helper to ensure a record exists
function upsert<T extends Record<string, unknown>>(db: any, table: string, key: keyof T, record: T) {
  const placeholders = Object.keys(record)
    .map(() => '?')
    .join(', ');
  const columns = Object.keys(record).join(', ');
  const values = Object.values(record);
  const exists = db
    .prepare(`SELECT 1 FROM ${table} WHERE ${String(key)} = ?`)
    .get((record as Record<string, unknown>)[String(key)]);
  if (!exists) {
    db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`).run(...values);
  }
}

async function seedDemoData() {
  const db = getDatabase();

  // Ensure roles exist
  const roleNames = Object.values(Role);
  for (const roleName of roleNames) {
    const roleId = `role-${roleName.toLowerCase()}`;
    upsert<any>(db, 'roles', 'id', {
      id: roleId,
      name: roleName,
      description: `${roleName} role`,
    });
  }

  // Demo users config (must match DEMO_USER_ROLES in authController)
  const demoUsers: Record<Role, { id: string; fullName: string; phone: string }> = {
    [Role.PATIENT]: { id: 'usr-patient-01', fullName: 'Rajesh Kumar', phone: '9000000001' },
    [Role.WORKER]: { id: 'usr-worker-01', fullName: 'Asha Devi', phone: '9000000002' },
    [Role.DOCTOR]: { id: 'usr-doctor-01', fullName: 'Dr. Anand Sharma', phone: '9000000003' },
    [Role.FACILITY_STAFF]: { id: 'usr-fstaff-01', fullName: 'Ravi Kumar', phone: '9000000004' },
    [Role.ADMIN]: { id: 'usr-admin-01', fullName: 'Collector S. Murugan', phone: '9000000005' },
  };

  const passwordHash = await bcrypt.hash('sethu123', 10);

  for (const roleKey of Object.keys(demoUsers) as Role[]) {
    const user = demoUsers[roleKey];
    // Insert user if not present
    upsert<any>(db, 'users', 'id', {
      id: user.id,
      phone: user.phone,
      email: `${user.id}@demo.sethu`,
      password_hash: passwordHash,
      full_name: user.fullName,
      preferred_language: 'en',
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Link user to role (facility_id null for demo)
    const roleId = `role-${roleKey.toLowerCase()}`;
    const exists = db
      .prepare('SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?')
      .get(user.id, roleId);
    if (!exists) {
      db.prepare(
        'INSERT INTO user_roles (id, user_id, role_id, facility_id) VALUES (?, ?, ?, NULL)'
      ).run(uuidv4(), user.id, roleId);
    }
  }

  console.log('Demo data seeded');
}

// Run when script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDemoData().catch((err) => {
    console.error('Failed to seed demo data:', err);
    process.exit(1);
  });
}

export default seedDemoData;
