export type FileStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FileType = 'KML' | 'SHAPEFILE' | 'UNKNOWN';
export type MeasurementStatus = 'SUPPORTED' | 'NOT_REQUIRED' | 'NOT_SUPPORTED' | 'INVALID';

export interface FileUploadResponse {
  id: string;
  filename: string;
  feature_count: number;
  crs: string | null;
  status: FileStatus;
}

export interface FileInfoResponse {
  id: string;
  filename: string;
  file_type: FileType;
  feature_count: number;
  crs: string | null;
  measurement_crs: string | null;
  status: FileStatus;
  created_at: string;
  updated_at: string;
  error_message: string | null;
}

export interface FileListItem {
  id: string;
  filename: string;
  file_type: FileType;
  feature_count: number;
  crs: string | null;
  status: FileStatus;
  created_at: string;
}

export interface FileListResponse {
  items: FileListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FeatureProperties {
  [key: string]: any;
}

export interface FeatureMeasurementResponse {
  feature_id: number;
  geometry_type: string;
  properties: FeatureProperties | null;
  measurement_type: string | null;
  value: number | null;
  unit: string | null;
  status: MeasurementStatus;
  message: string | null;
}

export interface MeasurementsSummary {
  file_id: string;
  feature_count: number;
  polygon_count: number;
  linestring_count: number;
  point_count: number;
  total_area_m2: number | null;
  total_length_m: number | null;
  measurement_crs: string | null;
}

export interface MeasurementsResponse {
  file_id: string;
  crs: string | null;
  measurement_crs: string | null;
  features: FeatureMeasurementResponse[];
  summary: MeasurementsSummary;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details: Record<string, any> | null;
}

export interface HealthResponse {
  status: string;
  version: string;
}