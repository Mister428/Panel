import { toast } from './ui.js';

const API_BASE = 'http://localhost:4000/api';

let token = localStorage.getItem('cn_token');
let currentUser = localStorage.getItem('cn_user')
  ? JSON.parse(localStorage.getItem('cn_user'))
  : null;

export function getCurrentUser() {
  return currentUser;
}

export function setAuth(t, user) {
  token = t;
  currentUser = user;
  localStorage.setItem('cn_token', t);
  localStorage.setItem('cn_user', JSON.stringify(user));
}

export function clearAuth() {
  token = null;
  currentUser = null;
  localStorage.removeItem('cn_token');
  localStorage.removeItem('cn_user');
}

async function request(path, options = {}) {
  const headers = options.headers || {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && options.method && options.method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Erreur API');
  }

  return data;
}

export async function apiRegister(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiLogin(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

export async function apiGetBots() {
  return request('/bots');
}

export async function apiCreateBot(payload) {
  return request('/bots', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function apiStartBot(id) {
  return request(`/bots/${id}/start`, { method: 'POST' });
}

export async function apiStopBot(id) {
  return request(`/bots/${id}/stop`, { method: 'POST' });
}

export async function apiDeleteBot(id) {
  return request(`/bots/${id}`, { method: 'DELETE' });
}

export async function apiGetUsers() {
  return request('/admin/users');
}

export async function apiApproveUser(id) {
  return request(`/admin/users/${id}/approve`, { method: 'POST' });
}

export async function apiRejectUser(id) {
  return request(`/admin/users/${id}/reject`, { method: 'POST' });
}

export async function apiDeleteUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' });
}