// In development Vite proxies /api → localhost:3001 (see vite.config.ts).
// In production VITE_API_URL must be set to the backend Render URL so the
// built static bundle knows where to send requests.
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)
  ? `${import.meta.env.VITE_API_URL as string}/api`
  : '/api';

type FetchOptions = RequestInit & { json?: unknown };

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { json, ...init } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: json !== undefined ? JSON.stringify(json) : init.body,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error((data as { message?: string }).message ?? 'Request failed');
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', json: body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', json: body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
