/**
 * CarrerSync File & Document Client Service
 * Phase 08 — Secure File Upload, Metadata & Download Management
 */

import apiClient from './api';

export const fileService = {
  /**
   * Uploads a file with metadata and category to the secure backend.
   * Supports upload progress tracking.
   */
  async uploadFile(file, documentType = 'resume', onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response;
  },

  /**
   * Lists all documents accessible to the current authenticated user.
   */
  async listDocuments() {
    return apiClient.get('/files');
  },

  /**
   * Fetches metadata for a specific document.
   */
  async getFileMetadata(fileId) {
    return apiClient.get(`/files/${fileId}`);
  },

  /**
   * Downloads a private document as a secure authenticated blob stream.
   * Automatically creates an in-browser download anchor.
   */
  async downloadFile(fileId, fallbackFilename = 'document.pdf') {
    // Direct browser fetch with responseType blob to trigger download
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id') || sessionStorage.getItem('tenant_id');
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:5000/api/v1';

    const response = await fetch(`${baseURL}/files/${fileId}/download`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-ID': tenantId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = fallbackFilename;

    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Deletes a permitted document by ID.
   */
  async deleteFile(fileId) {
    return apiClient.delete(`/files/${fileId}`);
  },
};

export default fileService;
