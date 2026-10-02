// ============================================================
// SETHU — Database Configuration (SQLite)
// ============================================================
// Uses better-sqlite3 for synchronous, fast SQLite access.
// Schema is designed to be PostgreSQL-compatible for production migration.
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { env } from './env.js';

let db: Database.Database | null = null;

/**
 * Get or create the database connection.
 * Creates the data directory if it doesn't exist.
 */
export function getDatabase(): Database.Database {
  if (db) return db;

  // Ensure the data directory exists
  const dbDir = path.dirname(env.DATABASE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(env.DATABASE_PATH);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enable foreign key enforcement
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Close the database connection gracefully.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Initialize the database schema from schema.sql.
 */
export function initializeSchema(): void {
  const database = getDatabase();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schemaPath = path.resolve(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  database.exec(schema);
  console.log('[DB] Schema initialized successfully.');
}

/**
 * Seed the database with demo data from seed.sql.
 */
export function seedDatabase(): void {
  const database = getDatabase();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const seedPath = path.resolve(__dirname, '../db/seed.sql');
  const seed = fs.readFileSync(seedPath, 'utf-8');
  database.exec(seed);
  console.log('[DB] Demo data seeded successfully.');
}
