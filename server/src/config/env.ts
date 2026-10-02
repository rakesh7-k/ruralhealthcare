// ============================================================
// SETHU — Environment Configuration
// ============================================================

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_PATH: process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/sethu.db'),
  JWT_SECRET: process.env.JWT_SECRET || 'sethu-dev-secret-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
  DEMO_MODE: process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production',
} as const;
