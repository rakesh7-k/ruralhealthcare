import { useAuthStore } from '../stores/authStore';
import { safeFetchJson } from './apiClient';

const API_BASE = '/api/patients';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchPatients(params?: { q?: string; village?: string }) {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.village) query.set('village', params.village);

  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}?${query.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch patients');
  return data.data;
}

export async function fetchPatientById(id: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/${id}`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch patient');
  return data.data;
}

export async function fetchPatientJourney(id: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/${id}/journey`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch journey');
  return data.data;
}

export async function fetchMyJourney() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/my-journey`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch my care journey');
  return data.data;
}

export async function createPatientApi(patientData: any) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    API_BASE,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(patientData),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to register patient');
  return data.data;
}
