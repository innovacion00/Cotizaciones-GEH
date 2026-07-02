import api from './api.js';

export function getCurrentUser() {
  if (typeof localStorage === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('currentUser', JSON.stringify(user));
}

export function isAuthenticated() {
  return !!api.getToken();
}

export async function login(email, password) {
  const data = await api.post('/api/v1/auth/login', { email, password });
  api.setToken(data.accessToken);
  setCurrentUser(data.user);
  return data;
}

export async function register(name, email, password) {
  return api.post('/api/v1/auth/register', { name, email, password });
}

export async function logout() {
  try {
    await api.post('/api/v1/auth/logout', {});
  } catch {
    // continua aunque falle
  }
  api.clearToken();
  if (typeof window !== 'undefined') window.location.href = '/';
}

export function getWorkspaceId() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('workspaceId');
}

export function setWorkspaceId(id) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('workspaceId', id);
}

export async function ensureWorkspaceId() {
  const existing = getWorkspaceId();
  if (existing) return existing;
  try {
    const data = await api.get('/api/v1/workspaces');
    if (data.workspaces?.length) {
      setWorkspaceId(data.workspaces[0]._id);
      return data.workspaces[0]._id;
    }
  } catch {
    // sin workspace disponible
  }
  return null;
}
