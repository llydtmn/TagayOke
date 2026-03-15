const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getToken   = ()  => localStorage.getItem('cf_token');
export const setToken   = (t) => localStorage.setItem('cf_token', t);
export const clearToken = ()  => localStorage.removeItem('cf_token');

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  const res  = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

export const authAPI = {
  login:  (email, password, portal) => request('/auth/login',  { method: 'POST', body: { email, password, portal }, auth: false }),
  signup: (data)                     => request('/auth/signup', { method: 'POST', body: data, auth: false }),
};

export const cropsAPI = {
  getAll:       (params = {}) => request('/crops?' + new URLSearchParams(params).toString()),
  getOne:       (id)          => request('/crops/' + id),
  create:       (data)        => request('/crops',               { method: 'POST',   body: data }),
  toggleStatus: (id)          => request('/crops/' + id + '/toggle', { method: 'PATCH' }),
  remove:       (id)          => request('/crops/' + id,         { method: 'DELETE' }),
};

export const usersAPI = {
  getAll:  ()         => request('/users'),
  getOne:  (id)       => request('/users/' + id),
  create:  (data)     => request('/users',        { method: 'POST',   body: data }),
  update:  (id, data) => request('/users/' + id,  { method: 'PATCH',  body: data }),
  remove:  (id)       => request('/users/' + id,  { method: 'DELETE' }),
};

export const auditAPI  = { getAll: () => request('/audit') };

export const lookupAPI = {
  barangays: () => request('/barangays',  { auth: false }),
  cropTypes: () => request('/crop-types', { auth: false }),
};
