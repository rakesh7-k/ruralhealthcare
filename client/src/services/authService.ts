import { LoginRequest, UserPublic, Role } from '@sethu/shared';
import { safeFetchJson } from './apiClient';

const API_BASE = '/api/auth';

export async function loginApi(credentials: LoginRequest): Promise<{ token: string; user: UserPublic }> {
  const json = await safeFetchJson<{ success: boolean; data: { token: string; user: UserPublic }; error?: { message: string } }>(
    `${API_BASE}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: credentials.username, password: credentials.password }),
    }
  );

  if (!json.success) {
    throw new Error(json.error?.message || 'Login failed');
  }

  return json.data;
}

export async function demoLoginApi(role: Role): Promise<{ token: string; user: UserPublic }> {
  const json = await safeFetchJson<{ success: boolean; data: { token: string; user: UserPublic }; error?: { message: string } }>(
    `${API_BASE}/demo-login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    }
  );

  if (!json.success) {
    throw new Error(json.error?.message || 'Demo login failed');
  }

  return json.data;
}

export async function getMeApi(token: string): Promise<{ user: UserPublic }> {
  const json = await safeFetchJson<{ success: boolean; data: { user: UserPublic }; error?: { message: string } }>(
    `${API_BASE}/me`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!json.success) {
    throw new Error(json.error?.message || 'Session expired');
  }

  return json.data;
}

export async function logoutApi(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Ignore network errors on logout
  }
}
