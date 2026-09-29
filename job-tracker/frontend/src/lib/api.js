const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.details?.join(', ') || body.error || `Error ${res.status}`;
    throw new Error(msg);
  }
  return body;
}

export const api = {
  list: () => request('/applications'),
  create: (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
};
