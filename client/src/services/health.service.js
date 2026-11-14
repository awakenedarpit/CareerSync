/**
 * Health Check API Service
 * Queries the backend GET /api/health endpoint.
 */

import apiClient from './api';

export const checkSystemHealth = async () => {
  try {
    const data = await apiClient.get('/health');
    return {
      online: true,
      data,
    };
  } catch (error) {
    return {
      online: false,
      error: error.message,
    };
  }
};
