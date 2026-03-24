/**
 * Admin API Client -- JobBoat V1
 * All admin requests include x-admin-token header.
 */

const BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

function buildUrl(path) {
  const p = '/' + (path || '').replace(/^\/*/, '');
  if (!BASE) return p;
  return BASE + p;
}

function getToken() {
  return localStorage.getItem('admin_access_token') || '';
}

async function adminRequest(path, opts = {}) {
  const token = getToken();
  // The backend expects the raw bypass token, not the base64 login token.
  // Legacy uses the base64 token directly; our backend ADMIN_BYPASS_TOKEN should match.
  // For V1 dev: we send the configured bypass token from env or fall back to decoded credentials.
  let bypassToken = '';
  try {
    bypassToken = atob(token).split(':')[0]; // yields '080808'
  } catch {
    bypassToken = token;
  }

  const res = await fetch(buildUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': bypassToken,
    },
    ...opts,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const adminApi = {
  // Dashboard
  dashboard: () => adminRequest('/api/admin/dashboard'),
  stats: () => adminRequest('/api/admin/stats'),
  security: () => adminRequest('/api/admin/security'),
  services: () => adminRequest('/api/admin/services'),
  skills: () => adminRequest('/api/admin/skills'),
  autoApply: () => adminRequest('/api/admin/auto-apply'),
  tokenomics: () => adminRequest('/api/admin/tokenomics'),
  highlights: () => adminRequest('/api/admin/highlights'),
  metrics: () => adminRequest('/api/admin/metrics'),

  // Users & Applications
  getUsers: (page = 1, limit = 50) => adminRequest(`/api/admin/users?page=${page}&limit=${limit}`),
  getApplications: (page = 1, limit = 50, status = '') =>
    adminRequest(`/api/admin/applications?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),
  updateUserTier: (userId, tier) =>
    adminRequest(`/api/admin/user/${userId}/tier`, { method: 'POST', body: JSON.stringify({ tier }) }),
  analytics: (timeRange = '7d') => adminRequest(`/api/admin/analytics?timeRange=${timeRange}`),

  // Logs & Health
  getLogs: (limit = 100) => adminRequest(`/api/admin/logs?limit=${limit}`),
  clearLogs: () => adminRequest('/api/admin/logs/clear', { method: 'POST' }),
  getHealth: () => adminRequest('/api/admin/health'),
  getQueueStats: () => adminRequest('/api/admin/queue/stats'),
  toggleMaintenance: (enabled) =>
    adminRequest('/api/admin/maintenance', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // API Keys
  getApiKeys: () => adminRequest('/api/admin/api-keys'),
  saveApiKeys: (keys) =>
    adminRequest('/api/admin/api-keys', { method: 'POST', body: JSON.stringify({ keys }) }),
  testApiKey: (key, value) =>
    adminRequest('/api/admin/test-api-key', { method: 'POST', body: JSON.stringify({ key, value }) }),
};
