import { initializeSchema, seedDatabase } from '../config/database.js';

try {
  console.log('[DB] Resetting database (schema + seed)...');
  initializeSchema();
  seedDatabase();
  console.log('[DB] Database reset complete.');
} catch (error) {
  console.error('[DB] Database reset failed:', error);
  process.exit(1);
}
