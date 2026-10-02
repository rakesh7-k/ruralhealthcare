export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error('Cannot connect to backend server. Please verify the backend is running on http://localhost:3000');
  }

  const text = await res.text();
  let json: any = null;
  if (text && text.trim()) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errorMessage =
      json?.error?.message ||
      json?.message ||
      (res.status === 502 || res.status === 504 || !json
        ? `Backend server unavailable (${res.status}). Ensure the backend server is running on port 3000.`
        : `Request failed with status ${res.status}`);
    throw new Error(errorMessage);
  }

  if (!json) {
    throw new Error('Backend returned an empty response.');
  }

  return json as T;
}
