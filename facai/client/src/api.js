const TOKEN_KEY = 'facai_token';

export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function req(method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  const tk = getToken();
  if (tk) headers['Authorization'] = 'Bearer ' + tk;
  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  register: (b) => req('POST', '/api/auth/register', b),
  login: (b) => req('POST', '/api/auth/login', b),
  me: () => req('GET', '/api/auth/me'),
  partners: () => req('GET', '/api/auth/partners'),
  setPartner: (id, b) => req('PUT', `/api/auth/partners/${id}`, b),
  fortune: (sign, date) => req('GET', `/api/auth/fortune?sign=${encodeURIComponent(sign)}&date=${date}`),
  today: (date) => req('GET', `/api/shipments/today?date=${date}`),
  saveToday: (b) => req('POST', '/api/shipments/today', b),
  tomorrow: (date) => req('GET', `/api/shipments/tomorrow?date=${date}`),
  saveTomorrow: (b) => req('POST', '/api/shipments/tomorrow', b),
  roll: () => req('POST', '/api/shipments/roll'),
  history: (date) => req('GET', `/api/shipments/history?date=${date}`),
  historyDates: () => req('GET', '/api/shipments/history-dates'),
  stats: (month) => req('GET', `/api/shipments/stats/monthly?month=${month || ''}`),
  customers: (month) => req('GET', `/api/shipments/customers/monthly?month=${month || ''}`),
  analysis: (range) => req('GET', `/api/shipments/analysis?range=${range}`),
  products: () => req('GET', '/api/products'),
  addProduct: (b) => req('POST', '/api/products', b),
  delProduct: (id) => req('DELETE', `/api/products/${id}`)
};

export const wsUrl = `ws://${location.host}/ws`;
