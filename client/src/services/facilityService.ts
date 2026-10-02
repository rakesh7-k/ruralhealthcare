import { useAuthStore } from '../stores/authStore';
import { safeFetchJson } from './apiClient';

const API_BASE = '/api/facility';

function getAuthHeaders() {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchFacilityDashboard() {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/dashboard`,
    { headers: getAuthHeaders() }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch facility dashboard');
  return data.data;
}

export async function updateReferralStatusApi(
  referralId: string,
  newStatus: string,
  notes?: string,
  failureReason?: string
) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/referrals/${referralId}/status`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newStatus, notes, failureReason }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to update referral status');
  return data.data;
}

export async function uploadDiagnosticResultApi(
  orderId: string,
  resultSummary: string,
  isNormal: boolean,
  resultData?: any
) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/diagnostics/${orderId}/result`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resultSummary, isNormal, resultData }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to upload diagnostic result');
  return data.data;
}

export async function dispenseMedicineApi(
  patientId: string,
  medicineId: string,
  quantity?: number,
  notes?: string
) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/medicines/dispense`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ patientId, medicineId, quantity, notes }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to dispense medicine');
  return data.data;
}

export async function updateResourceStatusApi(
  resourceId: string,
  status: string,
  notes?: string
) {
  const data = await safeFetchJson<{ success: boolean; data: any; error?: { message: string } }>(
    `${API_BASE}/resources/update`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resourceId, status, notes }),
    }
  );
  if (!data.success) throw new Error(data.error?.message || 'Failed to update resource status');
  return data.data;
}
