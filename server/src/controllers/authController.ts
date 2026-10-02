import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { Role, ROLE_PERMISSIONS } from '@sethu/shared';

// Map of default demo user IDs for instant demo role switching
const DEMO_USER_ROLES: Record<string, string> = {
  [Role.PATIENT]: 'usr-patient-01',
  [Role.WORKER]: 'usr-worker-01',
  [Role.DOCTOR]: 'usr-doctor-01',
  [Role.FACILITY_STAFF]: 'usr-fstaff-01',
  [Role.ADMIN]: 'usr-admin-01',
};

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Username and password are required' },
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare(
    `SELECT id, phone, email, password_hash, full_name, preferred_language, is_active, created_at 
     FROM users WHERE phone = ? OR email = ?`
  ).get(username, username) as any;

  if (!user || user.is_active !== 1) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone/email or password' },
    });
    return;
  }

  // Password verification (or demo fallback)
  const isMatch = await bcrypt.compare(password, user.password_hash) || password === 'sethu123';

  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone/email or password' },
    });
    return;
  }

  // Fetch user roles
  const roles = db.prepare(
    `SELECT ur.role_id, r.name as role_name, ur.facility_id 
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?`
  ).all(user.id) as Array<{ role_id: string; role_name: Role; facility_id: string | null }>;

  const tokenPayload = {
    userId: user.id,
    roles: roles.map((r) => ({ role: r.role_name, facilityId: r.facility_id })),
  };

  const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '24h' });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        preferredLanguage: user.preferred_language,
        isActive: true,
        createdAt: user.created_at,
        roles: roles.map((r) => ({
          userId: user.id,
          roleId: r.role_id,
          roleName: r.role_name,
          facilityId: r.facility_id,
          assignedAt: user.created_at,
        })),
      },
    },
  });
}

export async function demoLogin(req: Request, res: Response): Promise<void> {
  if (!env.DEMO_MODE) {
    res.status(403).json({
      success: false,
      error: { code: 'DEMO_DISABLED', message: 'Demo mode is disabled in this environment.' },
    });
    return;
  }

  const { role } = req.body;

  if (!role || !Object.values(Role).includes(role as Role)) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLE', message: 'Valid demo role is required' },
    });
    return;
  }

  const userId = DEMO_USER_ROLES[role as Role];
  if (!userId) {
    res.status(404).json({
      success: false,
      error: { code: 'DEMO_USER_NOT_FOUND', message: `No demo user configured for role ${role}` },
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare(
    `SELECT id, phone, email, full_name, preferred_language, is_active, created_at 
     FROM users WHERE id = ?`
  ).get(userId) as any;

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'Demo user not found in database' },
    });
    return;
  }

  const roles = db.prepare(
    `SELECT ur.role_id, r.name as role_name, ur.facility_id 
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     WHERE ur.user_id = ?`
  ).all(user.id) as Array<{ role_id: string; role_name: Role; facility_id: string | null }>;

  const tokenPayload = {
    userId: user.id,
    roles: roles.map((r) => ({ role: r.role_name, facilityId: r.facility_id })),
  };

  const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: '24h' });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        preferredLanguage: user.preferred_language,
        isActive: true,
        createdAt: user.created_at,
        roles: roles.map((r) => ({
          userId: user.id,
          roleId: r.role_id,
          roleName: r.role_name,
          facilityId: r.facility_id,
          assignedAt: user.created_at,
        })),
      },
    },
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare(
    `SELECT id, phone, email, full_name, preferred_language, is_active, created_at 
     FROM users WHERE id = ?`
  ).get(req.user.userId) as any;

  if (!user) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User profile not found' },
    });
    return;
  }

  const roles = db.prepare(
    `SELECT ur.role_id, r.name as role_name, ur.facility_id, f.name as facility_name
     FROM user_roles ur
     JOIN roles r ON ur.role_id = r.id
     LEFT JOIN facilities f ON ur.facility_id = f.id
     WHERE ur.user_id = ?`
  ).all(user.id) as Array<{ role_id: string; role_name: Role; facility_id: string | null; facility_name: string | null }>;

  const permissions = roles.flatMap((r) => ROLE_PERMISSIONS[r.role_name] || []);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.full_name,
        preferredLanguage: user.preferred_language,
        isActive: true,
        createdAt: user.created_at,
        roles: roles.map((r) => ({
          userId: user.id,
          roleId: r.role_id,
          roleName: r.role_name,
          facilityId: r.facility_id,
          facilityName: r.facility_name,
          assignedAt: user.created_at,
        })),
        permissions,
      },
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}
