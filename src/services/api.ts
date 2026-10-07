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

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<FileUploadResponse>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  list: async (page = 1, pageSize = 20): Promise<FileListResponse> => {
    const response = await api.get<FileListResponse>('/files', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  get: async (id: string): Promise<FileInfoResponse> => {
    const response = await api.get<FileInfoResponse>(`/files/${id}`);
    return response.data;
  },

  getMeasurements: async (id: string): Promise<MeasurementsResponse> => {
    const response = await api.get<MeasurementsResponse>(`/files/${id}/measurements`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/files/${id}`);
  },
};

export const healthApi = {
  check: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
};

export default api;