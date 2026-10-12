import axios from 'axios';

const configuredBase = (((import.meta as any).env?.VITE_API_URL) || '').replace(/\/+$/, '');
const api = axios.create({ baseURL: configuredBase ? `${configuredBase}/api` : '/api' });
const recordCollections = new Set(['/projects', '/contracts', '/audits', '/audit-history', '/compliance-templates']);

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // These endpoints currently return arrays. Accept the API's paginated form too,
    // but surface an invalid response as a load error instead of crashing render.
    if (response.config.method === 'get' && recordCollections.has((response.config.url || '').split('?')[0])) {
      const rows = Array.isArray(response.data) ? response.data : response.data?.data;
      if (!Array.isArray(rows)) return Promise.reject(new Error('The server returned an invalid record list.'));
      response.data = rows;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
