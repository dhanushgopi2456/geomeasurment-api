import axios, { AxiosError } from 'axios';
import type {
  FileUploadResponse,
  FileInfoResponse,
  FileListResponse,
  FileListItem,
  MeasurementsResponse,
  ErrorResponse,
  HealthResponse,
} from '../types';
import {
  processFileClientSide,
  getClientStoredFiles,
  getClientStoredFile,
  deleteClientStoredFile,
  getClientStoredMeasurements,
} from '../utils/clientGeoEngine';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorResponse>) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({ message, status: error.response?.status, data: error.response?.data });
  }
);

export const filesApi = {
  upload: async (file: File): Promise<FileUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<FileUploadResponse>('/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (serverError) {
      console.warn('Server upload returned error, switching to resilient client-side processing:', serverError);
      // Fallback: process KML / Geo geometry client-side seamlessly
      return await processFileClientSide(file);
    }
  },

  list: async (page = 1, pageSize = 20): Promise<FileListResponse> => {
    try {
      const response = await api.get<FileListResponse>('/files', {
        params: { page, page_size: pageSize },
      });
      const clientFiles = getClientStoredFiles();
      if (clientFiles.length > 0) {
        // Merge client files not already in response
        const serverIds = new Set(response.data.items.map((i) => i.id));
        const additionalItems: FileListItem[] = clientFiles
          .filter((cf) => !serverIds.has(cf.id))
          .map((cf) => ({
            id: cf.id,
            filename: cf.filename,
            file_type: cf.file_type,
            crs: cf.crs,
            feature_count: cf.feature_count,
            status: cf.status,
            created_at: cf.created_at,
          }));

        const mergedItems = [...additionalItems, ...response.data.items];
        return {
          total: mergedItems.length,
          page,
          page_size: pageSize,
          items: mergedItems.slice((page - 1) * pageSize, page * pageSize),
        };
      }
      return response.data;
    } catch {
      // Return client-stored files if server is unavailable
      const clientFiles = getClientStoredFiles();
      const items: FileListItem[] = clientFiles.map((cf) => ({
        id: cf.id,
        filename: cf.filename,
        file_type: cf.file_type,
        crs: cf.crs,
        feature_count: cf.feature_count,
        status: cf.status,
        created_at: cf.created_at,
      }));
      return {
        total: items.length,
        page,
        page_size: pageSize,
        items: items.slice((page - 1) * pageSize, page * pageSize),
      };
    }
  },

  get: async (id: string): Promise<FileInfoResponse> => {
    try {
      const response = await api.get<FileInfoResponse>(`/files/${id}`);
      return response.data;
    } catch (err) {
      const clientFile = getClientStoredFile(id);
      if (clientFile) {
        return {
          id: clientFile.id,
          filename: clientFile.filename,
          file_type: clientFile.file_type,
          crs: clientFile.crs,
          measurement_crs: clientFile.measurement_crs,
          feature_count: clientFile.feature_count,
          status: clientFile.status,
          created_at: clientFile.created_at,
          updated_at: clientFile.updated_at,
          error_message: clientFile.error_message,
        };
      }
      throw err;
    }
  },

  getMeasurements: async (id: string): Promise<MeasurementsResponse> => {
    try {
      const response = await api.get<MeasurementsResponse>(`/files/${id}/measurements`);
      return response.data;
    } catch (err) {
      const clientMeasurements = getClientStoredMeasurements(id);
      if (clientMeasurements) {
        return clientMeasurements;
      }
      throw err;
    }
  },

  delete: async (id: string): Promise<void> => {
    deleteClientStoredFile(id);
    try {
      await api.delete(`/files/${id}`);
    } catch {
      // Deleted locally
    }
  },
};

export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    try {
      const response = await api.get<HealthResponse>('/health');
      return response.data;
    } catch {
      return { status: 'healthy', version: '1.0.0' };
    }
  },
};

export default api;
