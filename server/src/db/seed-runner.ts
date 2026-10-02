import { seedDatabase } from '../config/database.js';

try {
  console.log('[DB] Seeding database...');
  seedDatabase();
  console.log('[DB] Done.');
} catch (error) {
  console.error('[DB] Seeding failed:', error);
  process.exit(1);
}
