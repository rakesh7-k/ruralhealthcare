import { useAuthStore } from '../stores/authStore';
import { safeFetchJson } from './apiClient';

const API_BASE = '/api/worker';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWorkerDashboard() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/dashboard`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch worker dashboard');
  return data.data;
}

export async function createEncounterApi(encounterData: any) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/encounters`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(encounterData),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to record encounter');
  return data.data;
}
