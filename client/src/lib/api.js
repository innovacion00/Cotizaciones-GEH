const API_URL = import.meta.env.API_URL || 'http://localhost:3000';

function getToken() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function setToken(token) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

function clearToken() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('currentUser');
}

async function refreshToken() {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    clearToken();
    window.location.href = '/';
    throw new Error('Sesión expirada');
  }
  const body = await res.json();
  setToken(body.data.accessToken);
  return body.data.accessToken;
}

async function apiFetch(path, options = {}, retry = true) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    const newToken = await refreshToken();
    headers['Authorization'] = `Bearer ${newToken}`;
    const retry2 = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
    return handleResponse(retry2);
  }

  return handleResponse(res);
}

async function handleResponse(res) {
  const body = await res.json().catch(() => ({ success: false, error: 'Respuesta inválida' }));
  if (!res.ok) {
    const err = new Error(body.error || 'Error desconocido');
    err.status = res.status;
    err.code = body.code;
    throw err;
  }
  return body.data;
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
  setToken,
  getToken,
  clearToken,
};

export default api;
