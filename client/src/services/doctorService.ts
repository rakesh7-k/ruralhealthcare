import { useAuthStore } from '../stores/authStore';
import { safeFetchJson } from './apiClient';

const API_BASE = '/api/doctor';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchDoctorQueue() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/queue`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch doctor queue');
  return data.data;
}

export async function fetchClinicalSummary(patientId: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/patients/${patientId}/clinical-summary`,
    {
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch clinical summary');
  return data.data;
}

export async function saveConsultationApi(payload: any) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/consultations`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to save consultation');
  return data.data;
}
