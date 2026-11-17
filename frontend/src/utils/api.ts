export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const API_KEY = import.meta.env.VITE_API_KEY ?? '';

/** fetch() wrapper that always attaches the X-API-Key header required by the backend. */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (API_KEY && !headers.has('X-API-Key')) headers.set('X-API-Key', API_KEY);
  return fetch(input, { ...init, headers });
}
