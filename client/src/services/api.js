/**
 * CarrerSync Axios API Client
 * Configured with environment-driven base URL, token sanitization, and safe error defaults.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach sanitized JWT token and tenant context
apiClient.interceptors.request.use(
  (config) => {
    try {
      const rawToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (rawToken) {
        // Sanitize token: strip single or duplicate "Bearer " prefixes case-insensitively
        const sanitized = String(rawToken).replace(/^(bearer(\s+|$))+/i, '').trim();
        // Reject empty, "null", or "undefined" strings
        if (sanitized && sanitized.toLowerCase() !== 'null' && sanitized.toLowerCase() !== 'undefined') {
          config.headers.Authorization = `Bearer ${sanitized}`;
        }
      }

      const tenantId = localStorage.getItem('tenant_id') || sessionStorage.getItem('tenant_id');
      if (
        tenantId &&
        tenantId.toLowerCase() !== 'null' &&
        tenantId.toLowerCase() !== 'undefined' &&
        !config.headers['X-Tenant-ID']
      ) {
        config.headers['X-Tenant-ID'] = tenantId;
      }
    } catch {
      // Ignore storage access errors in non-standard environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting and safe 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status || 500;
    const responseData = error.response?.data;

    // Handle 401 Unauthorized responses gracefully without leaking token contents
    if (status === 401) {
      // Clean up corrupt or expired tokens from storage if rejected by backend
      try {
        if (responseData?.code === 'TOKEN_VERIFICATION_FAILED' || responseData?.code === 'EMPTY_BEARER_TOKEN') {
          localStorage.removeItem('token');
        }
      } catch {}
    }

    const customError = {
      message: responseData?.error || responseData?.message || error.message || 'Network communication error',
      status,
      code: responseData?.code || (status === 401 ? 'UNAUTHORIZED' : undefined),
      data: responseData || null,
    };
    return Promise.reject(customError);
  }
);

export default apiClient;
