import { initializeSchema } from '../config/database.js';

try {
  console.log('[DB] Initializing database schema...');
  initializeSchema();
  console.log('[DB] Done.');
} catch (error) {
  console.error('[DB] Schema initialization failed:', error);
  process.exit(1);
}
