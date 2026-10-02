import { useAuthStore } from '../stores/authStore';
import { safeFetchJson } from './apiClient';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Teleconsultations
export async function fetchTeleconsultations() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    '/api/teleconsultations',
    { headers: getAuthHeaders() }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch teleconsultations');
  return data.data;
}

export async function fetchTeleconsultationById(id: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `/api/teleconsultations/${id}`,
    { headers: getAuthHeaders() }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch teleconsultation session');
  return data.data;
}

export async function createTeleconsultationApi(payload: {
  patientId: string;
  specialtyRequired?: string;
  reasonForConsult?: string;
  specialistId?: string;
  requestingFacilityId?: string;
}) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    '/api/teleconsultations',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to create teleconsultation');
  return data.data;
}

export async function startTeleconsultationApi(id: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `/api/teleconsultations/${id}/start`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to start teleconsultation');
  return data.data;
}

export async function saveTeleconsultationSnapshotApi(id: string, imageData: string, label?: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `/api/teleconsultations/${id}/snapshot`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ imageData, label }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to save snapshot');
  return data.data;
}

export async function completeTeleconsultationApi(id: string, payload: any) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `/api/teleconsultations/${id}/complete`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to complete teleconsultation');
  return data.data;
}

// Care Requirements
export async function fetchCareRequirementById(id: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `/api/care-requirements/${id}`,
    { headers: getAuthHeaders() }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch care requirement');
  return data.data;
}

// Care Route Assurance
export async function evaluateCareRouteApi(careRequirementId: string) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    '/api/care-route/evaluate',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ careRequirementId }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Care route evaluation failed');
  return data.data;
}

export async function confirmCareRouteApi(payload: {
  careRequirementId: string;
  facilityId: string;
  reason?: string;
  expectedArrivalDays?: number;
}) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    '/api/care-route/confirm',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to confirm care route');
  return data.data;
}
