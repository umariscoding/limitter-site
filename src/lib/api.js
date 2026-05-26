import { auth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://limitter-api-production.up.railway.app';

async function getAuthToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function request(method, path, body, opts = {}) {
  const token = await getAuthToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  const json = await res.json();

  if (!res.ok || json.success === false) {
    const err = new Error(json.message || json.error || 'Request failed');
    err.status = res.status;
    err.errorCode = json.errorCode || null;
    err.data = json;
    throw err;
  }

  return json.data ?? json;
}

function get(path) {
  return request('GET', path);
}

function post(path, body) {
  return request('POST', path, body);
}

function put(path, body) {
  return request('PUT', path, body);
}

function patch(path, body) {
  return request('PATCH', path, body);
}

function del(path) {
  return request('DELETE', path);
}

export const authApi = {
  setupAccount: () => post('/api/auth/setup-account'),
  bootstrap: () => get('/api/auth/bootstrap'),
  login: (email, password) => post('/api/auth/login', { email, password }),
  logout: () => post('/api/auth/logout'),
  resendVerification: () => post('/api/auth/resend-verification'),
  forgotPassword: (email) => post('/api/auth/forgot-password', { email }),
};

export const accountApi = {
  getProfile: () => get('/api/account/profile'),
  updateProfile: (data) => patch('/api/account/profile', data),
  getPlanLimits: () => get('/api/account/plan-limits'),
};

export const deviceApi = {
  register: (data) => post('/api/devices/register', data),
  list: () => get('/api/devices'),
  heartbeat: (deviceId) => put(`/api/devices/${deviceId}/heartbeat`),
  updateFcmToken: (data) => post('/api/devices/fcm-token', data),
  replace: (data) => post('/api/devices/replace', data),
};

export const policyApi = {
  create: (data) => post('/api/policies', data),
  list: (timezone) => get(`/api/policies${timezone ? `?timezone=${encodeURIComponent(timezone)}` : ''}`),
  getById: (id) => get(`/api/policies/${id}`),
  update: (id, data) => put(`/api/policies/${id}`, data),
  archive: (id) => del(`/api/policies/${id}`),
  restore: (id) => post(`/api/policies/${id}/restore`),
  lockNow: (id, untilTimestampMs) => post(`/api/policies/${id}/lock-now`, untilTimestampMs ? { untilTimestampMs } : {}),
};

export const usageApi = {
  tick: (data) => post('/api/usage/tick', data),
  record: (data) => post('/api/usage/record', data),
  getRemaining: (policyId) => get(`/api/usage/remaining/${policyId}`),
  getDaily: (dateKey) => get(`/api/usage/daily/${dateKey}`),
  getWeekly: () => get('/api/usage/weekly'),
};

export const overrideApi = {
  use: (data) => post('/api/overrides/use', data),
  getBalance: () => get('/api/overrides/balance'),
  getHistory: (cursor) => get(`/api/overrides/history${cursor ? `?cursor=${cursor}` : ''}`),
};

export const billingApi = {
  stripeCreateCheckout: (data) => post('/api/billing/stripe/create-checkout', data),
  stripeVerifySession: (sessionId) => post('/api/billing/stripe/verify-session', { sessionId }),
  stripePortal: (returnUrl) => post('/api/billing/stripe/portal', { returnUrl }),
  refresh: () => post('/api/billing/refresh'),
  listPurchases: (limit, cursor) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (cursor) params.set('cursor', cursor);
    const qs = params.toString();
    return get(`/api/billing/purchases${qs ? `?${qs}` : ''}`);
  },
};
