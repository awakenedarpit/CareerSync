/**
 * CarrerSync Axios API Client
 * Configured with environment-driven base URL and safe timeout defaults.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and tenant context if available
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const tenantId = localStorage.getItem('tenant_id') || sessionStorage.getItem('tenant_id');
      if (tenantId && !config.headers['X-Tenant-ID']) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch {
      // Ignore storage access errors in non-standard environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.error || error.message || 'Network communication error',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
