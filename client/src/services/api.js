/**
 * CarrerSync Axios API Client
 * Configured with environment-driven base URL and safe timeout defaults.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
