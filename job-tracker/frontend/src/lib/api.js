const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY_STORAGE = 'jobTracker.apiKey';

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* almacenamiento no disponible: la clave se pedirá de nuevo */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && { 'x-api-key': apiKey }),
      ...options.headers,
    },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.details?.join(', ') || body.error || `Error ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return body;
}

export const api = {
  list: () => request('/applications'),
  create: (data) => request('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
};
