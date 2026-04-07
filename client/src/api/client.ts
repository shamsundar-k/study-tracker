const BASE_URL = '/api';

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
