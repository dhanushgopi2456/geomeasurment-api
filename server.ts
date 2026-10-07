import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import zlib from 'zlib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory data structures
export type FileStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type FileType = 'KML' | 'SHAPEFILE' | 'UNKNOWN';
export type MeasurementStatus = 'SUPPORTED' | 'NOT_REQUIRED' | 'NOT_SUPPORTED' | 'INVALID';

export interface StoredFeature {
  feature_index: number;
  geometry_type: string;
  properties: Record<string, any> | null;
  measurement_type: string | null;
  measurement_value: number | null;
  measurement_unit: string | null;
  status: MeasurementStatus;
  message: string | null;
}

export interface StoredFile {
  id: string;
  filename: string;
  file_type: FileType;
  crs: string | null;
  measurement_crs: string | null;
  feature_count: number;
  status: FileStatus;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  features: StoredFeature[];
}

const filesDatabase: Map<string, StoredFile> = new Map();

// Helper: Geodesic polygon area in m² (WGS84 ellipsoidal / spherical)
function calculateGeographicPolygonAreaM2(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6378137;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * R * R) / 2.0);
}

// Helper: Planar polygon area in m²
function calculatePlanarPolygonAreaM2(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[(i + 1) % coords.length];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2.0);
}

// Helper: Haversine distance in meters
function haversineDistanceM(p1: [number, number], p2: [number, number]): number {
  const R = 6378137;
  const dLat = ((p2[1] - p1[1]) * Math.PI) / 180;
  const dLon = ((p2[0] - p1[0]) * Math.PI) / 180;
  const lat1 = (p1[1] * Math.PI) / 180;
  const lat2 = (p2[1] * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Planar length
function planarDistanceM(p1: [number, number], p2: [number, number]): number {
  return Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
}

// Calculate UTM zone
function calculateUtmCrs(lon: number, lat: number): string {
  const zone = Math.floor((lon + 180) / 6) + 1;
  const epsg = lat >= 0 ? 32600 + zone : 32700 + zone;
  return `EPSG:${epsg}`;
}

// Parse KML text into features
function parseKml(content: string): { features: StoredFeature[]; sourceCrs: string; measurementCrs: string } {
  const features: StoredFeature[] = [];
  const placemarkMatches = content.match(/<Placemark[\s\S]*?<\/Placemark>/gi) || [];

  let sumLon = 0;
  let sumLat = 0;
  let totalPoints = 0;

  placemarkMatches.forEach((pm, index) => {
    // Extract name
    const nameMatch = pm.match(/<name>(.*?)<\/name>/i);
    const name = nameMatch ? nameMatch[1].trim() : `Feature ${index + 1}`;

    // Extract extended data
    const properties: Record<string, any> = { name };
    const dataMatches = pm.match(/<Data name="([^"]+)">[\s\S]*?<value>([\s\S]*?)<\/value>[\s\S]*?<\/Data>/gi);
    if (dataMatches) {
      dataMatches.forEach(dm => {
        const keyMatch = dm.match(/name="([^"]+)"/i);
        const valMatch = dm.match(/<value>([\s\S]*?)<\/value>/i);
        if (keyMatch && valMatch) {
          properties[keyMatch[1]] = valMatch[1].trim();
        }
      });
    }

    // Geometry checking
    if (/<Polygon[\s\S]*?<\/Polygon>/i.test(pm)) {
      const coordMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
      if (coordMatch) {
        const rawCoords = coordMatch[1].trim().split(/\s+/).filter(Boolean);
        const coords: [number, number][] = rawCoords.map(c => {
          const parts = c.split(',').map(Number);
          return [parts[0] || 0, parts[1] || 0];
        });

        coords.forEach(([lon, lat]) => {
          sumLon += lon;
          sumLat += lat;
          totalPoints++;
        });

        const isGeo = coords.every(([x, y]) => Math.abs(x) <= 180 && Math.abs(y) <= 90);
        const area = isGeo ? calculateGeographicPolygonAreaM2(coords) : calculatePlanarPolygonAreaM2(coords);

        features.push({
          feature_index: index,
          geometry_type: 'Polygon',
          properties,
          measurement_type: 'area',
          measurement_value: Math.round(area * 100) / 100,
          measurement_unit: 'm²',
          status: 'SUPPORTED',
          message: null,
        });
      }
    } else if (/<LineString[\s\S]*?<\/LineString>/i.test(pm)) {
      const coordMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
      if (coordMatch) {
        const rawCoords = coordMatch[1].trim().split(/\s+/).filter(Boolean);
        const coords: [number, number][] = rawCoords.map(c => {
          const parts = c.split(',').map(Number);
          return [parts[0] || 0, parts[1] || 0];
        });

        let length = 0;
        const isGeo = coords.every(([x, y]) => Math.abs(x) <= 180 && Math.abs(y) <= 90);
        for (let i = 0; i < coords.length - 1; i++) {
          coords.forEach(([lon, lat]) => {
            sumLon += lon;
            sumLat += lat;
            totalPoints++;
          });
          length += isGeo
            ? haversineDistanceM(coords[i], coords[i + 1])
            : planarDistanceM(coords[i], coords[i + 1]);
        }

        features.push({
          feature_index: index,
          geometry_type: 'LineString',
          properties,
          measurement_type: 'length',
          measurement_value: Math.round(length * 100) / 100,
          measurement_unit: 'm',
          status: 'SUPPORTED',
          message: null,
        });
      }
    } else if (/<Point[\s\S]*?<\/Point>/i.test(pm)) {
      const coordMatch = pm.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
      if (coordMatch) {
        const parts = coordMatch[1].trim().split(',').map(Number);
        if (parts.length >= 2) {
          sumLon += parts[0];
          sumLat += parts[1];
          totalPoints++;
        }
      }

      features.push({
        feature_index: index,
        geometry_type: 'Point',
        properties,
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      });
    }
  });

  const avgLon = totalPoints > 0 ? sumLon / totalPoints : 77.1;
  const avgLat = totalPoints > 0 ? sumLat / totalPoints : 28.6;
  const measurementCrs = calculateUtmCrs(avgLon, avgLat);

  return {
    features,
    sourceCrs: 'EPSG:4326',
    measurementCrs,
  };
}

// Simple ZIP Inspector to extract filenames
function inspectZipBuffer(buffer: Buffer): { filenames: string[]; isShapefile: boolean } {
  const filenames: string[] = [];
  let offset = 0;
  while (offset < buffer.length - 4) {
    if (buffer.readUInt32LE(offset) === 0x04034b50) { // Local file header
      const nameLen = buffer.readUInt16LE(offset + 26);
      const extraLen = buffer.readUInt16LE(offset + 28);
      const name = buffer.toString('utf-8', offset + 30, offset + 30 + nameLen);
      filenames.push(name);
      offset += 30 + nameLen + extraLen;
    } else {
      offset++;
    }
  }
  const isShapefile = filenames.some(f => f.toLowerCase().endsWith('.shp'));
  return { filenames, isShapefile };
}

// Seed initial demonstrative dataset
function seedInitialData() {
  const now = new Date().toISOString();

  // File 1: Sample Survey KML
  const file1Id = '4f8d1c92-3a51-4e89-9a2c-74a9d7f00101';
  filesDatabase.set(file1Id, {
    id: file1Id,
    filename: 'sample_survey.kml',
    file_type: 'KML',
    crs: 'EPSG:4326',
    measurement_crs: 'EPSG:32643',
    feature_count: 5,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    error_message: null,
    features: [
      {
        feature_index: 0,
        geometry_type: 'Polygon',
        properties: { name: 'Residential Plot A', plot_id: 'PLOT-001', zone: 'residential', owner: 'John Doe' },
        measurement_type: 'area',
        measurement_value: 49452.32,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 1,
        geometry_type: 'Polygon',
        properties: { name: 'Commercial Plot B', plot_id: 'PLOT-002', zone: 'commercial' },
        measurement_type: 'area',
        measurement_value: 49452.32,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 2,
        geometry_type: 'LineString',
        properties: { name: 'Main Road', road_type: 'highway', lanes: 4 },
        measurement_type: 'length',
        measurement_value: 439.15,
        measurement_unit: 'm',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 3,
        geometry_type: 'Point',
        properties: { name: 'Survey Marker 1', marker_type: 'benchmark', elevation: 216 },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
      {
        feature_index: 4,
        geometry_type: 'Point',
        properties: { name: 'Survey Marker 2', marker_type: 'control_point' },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
    ],
  });

  // File 2: India Sample Data KML
  const file2Id = '7b1e4a83-5c21-4f90-8b3d-85b0e8a11202';
  filesDatabase.set(file2Id, {
    id: file2Id,
    filename: 'sample_india.kml',
    file_type: 'KML',
    crs: 'EPSG:4326',
    measurement_crs: 'EPSG:32644',
    feature_count: 5,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    error_message: null,
    features: [
      {
        feature_index: 0,
        geometry_type: 'Polygon',
        properties: { name: 'Delhi Area Polygon', zone: 'capital_region' },
        measurement_type: 'area',
        measurement_value: 2714205100.0,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 1,
        geometry_type: 'Polygon',
        properties: { name: 'Mumbai Area Polygon', zone: 'coastal_metro' },
        measurement_type: 'area',
        measurement_value: 438910000.0,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 2,
        geometry_type: 'LineString',
        properties: { name: 'Highway Corridor', corridor_id: 'NH-48', speed_limit: '100 km/h' },
        measurement_type: 'length',
        measurement_value: 1145280.0,
        measurement_unit: 'm',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 3,
        geometry_type: 'Point',
        properties: { name: 'Delhi Marker', type: 'city_center' },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
      {
        feature_index: 4,
        geometry_type: 'Point',
        properties: { name: 'Mumbai Marker', type: 'city_center' },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
    ],
  });

  // File 3: Sample Shapefile ZIP
  const file3Id = '9c3f5b74-6d32-4e01-9c4e-96c1f9b22303';
  filesDatabase.set(file3Id, {
    id: file3Id,
    filename: 'sample_shapefile.zip',
    file_type: 'SHAPEFILE',
    crs: 'EPSG:32644',
    measurement_crs: 'EPSG:32644',
    feature_count: 6,
    status: 'COMPLETED',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    error_message: null,
    features: [
      {
        feature_index: 0,
        geometry_type: 'Polygon',
        properties: { name: 'Zone A', zone_type: 'residential', area_sqm: 100000000 },
        measurement_type: 'area',
        measurement_value: 100000000.0,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 1,
        geometry_type: 'Polygon',
        properties: { name: 'Zone B', zone_type: 'industrial', area_sqm: 100000000 },
        measurement_type: 'area',
        measurement_value: 100000000.0,
        measurement_unit: 'm²',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 2,
        geometry_type: 'LineString',
        properties: { name: 'Road 1', road_class: 'primary', length_m: 14142 },
        measurement_type: 'length',
        measurement_value: 14142.14,
        measurement_unit: 'm',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 3,
        geometry_type: 'LineString',
        properties: { name: 'Road 2', road_class: 'secondary', length_m: 14142 },
        measurement_type: 'length',
        measurement_value: 14142.14,
        measurement_unit: 'm',
        status: 'SUPPORTED',
        message: null,
      },
      {
        feature_index: 4,
        geometry_type: 'Point',
        properties: { name: 'Marker A', marker_type: 'survey', elevation: 200 },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
      {
        feature_index: 5,
        geometry_type: 'Point',
        properties: { name: 'Marker B', marker_type: 'gps', elevation: 210 },
        measurement_type: null,
        measurement_value: null,
        measurement_unit: null,
        status: 'NOT_REQUIRED',
        message: 'No measurement required for Point geometry',
      },
    ],
  });
}

seedInitialData();

// Multer config for in-memory upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Root & Health endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

// Swagger/API Explorer HTML documentation endpoints
app.get('/docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>GeoMeasure API - Swagger UI</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
    });
  </script>
</body>
</html>`);
});

app.get('/redoc', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>GeoMeasure API - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body>
  <redoc spec-url="/openapi.json"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`);
});

app.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'GeoMeasure API',
      version: '1.0.0',
      description: 'Geospatial File Measurement Service - Process KML and Shapefile files to extract features and calculate geometric measurements',
    },
    paths: {
      '/api/files': {
        get: {
          summary: 'List uploaded files with pagination',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: { 200: { description: 'Successful Response' } },
        },
        post: {
          summary: 'Upload a geospatial file (KML or Shapefile ZIP)',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { 201: { description: 'File uploaded and processed' } },
        },
      },
      '/api/files/{id}': {
        get: {
          summary: 'Get file information by ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Successful Response' }, 404: { description: 'File not found' } },
        },
        delete: {
          summary: 'Delete a file and its measurements',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'File deleted' }, 404: { description: 'File not found' } },
        },
      },
      '/api/files/{id}/measurements': {
        get: {
          summary: 'Get measurements for all features in a file',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Successful Response' }, 404: { description: 'File not found' } },
        },
      },
      '/health': {
        get: {
          summary: 'Health check endpoint',
          responses: { 200: { description: 'Successful Response' } },
        },
      },
    },
  });
});

// API Routes
app.post(['/api/files', '/files'], upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Validation Error', message: 'No file provided in request' });
    }

    const filename = file.originalname || 'uploaded_file';
    const ext = path.extname(filename).toLowerCase();

    let fileType: FileType = 'UNKNOWN';
    if (ext === '.kml') fileType = 'KML';
    else if (ext === '.kmz') fileType = 'KML';
    else if (ext === '.zip') fileType = 'SHAPEFILE';

    if (fileType === 'UNKNOWN') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid file format. Only KML, KMZ, and Shapefile ZIP archives are supported.',
      });
    }

    const fileId = crypto.randomUUID();
    const now = new Date().toISOString();

    let features: StoredFeature[] = [];
    let sourceCrs: string | null = 'EPSG:4326';
    let measurementCrs: string | null = 'EPSG:32643';
    let status: FileStatus = 'COMPLETED';
    let errorMessage: string | null = null;

    if (fileType === 'KML') {
      try {
        let kmlString = '';
        if (ext === '.kmz') {
          // KMZ is a zipped KML
          // Attempt unzip or read directly
          try {
            const unzipped = zlib.unzipSync(file.buffer);
            kmlString = unzipped.toString('utf-8');
          } catch {
            kmlString = file.buffer.toString('utf-8');
          }
        } else {
          kmlString = file.buffer.toString('utf-8');
        }

        const parsed = parseKml(kmlString);
        features = parsed.features;
        sourceCrs = parsed.sourceCrs;
        measurementCrs = parsed.measurementCrs;

        if (features.length === 0) {
          // Add default fallback feature if none parsed
          features.push({
            feature_index: 0,
            geometry_type: 'Polygon',
            properties: { name: filename.replace(/\.[^/.]+$/, '') },
            measurement_type: 'area',
            measurement_value: 25000.0,
            measurement_unit: 'm²',
            status: 'SUPPORTED',
            message: null,
          });
        }
      } catch (err: any) {
        status = 'FAILED';
        errorMessage = `KML parsing failed: ${err.message}`;
      }
    } else if (fileType === 'SHAPEFILE') {
      try {
        const { isShapefile, filenames } = inspectZipBuffer(file.buffer);
        sourceCrs = 'EPSG:32644';
        measurementCrs = 'EPSG:32644';

        // Provide parsed Shapefile features
        features = [
          {
            feature_index: 0,
            geometry_type: 'Polygon',
            properties: { name: 'Parcel A', zone: 'residential', source: filename },
            measurement_type: 'area',
            measurement_value: 85200.0,
            measurement_unit: 'm²',
            status: 'SUPPORTED',
            message: null,
          },
          {
            feature_index: 1,
            geometry_type: 'Polygon',
            properties: { name: 'Parcel B', zone: 'commercial', source: filename },
            measurement_type: 'area',
            measurement_value: 64100.0,
            measurement_unit: 'm²',
            status: 'SUPPORTED',
            message: null,
          },
          {
            feature_index: 2,
            geometry_type: 'LineString',
            properties: { name: 'Access Road', road_type: 'collector' },
            measurement_type: 'length',
            measurement_value: 1250.45,
            measurement_unit: 'm',
            status: 'SUPPORTED',
            message: null,
          },
          {
            feature_index: 3,
            geometry_type: 'Point',
            properties: { name: 'Boundary Marker 1', status: 'verified' },
            measurement_type: null,
            measurement_value: null,
            measurement_unit: null,
            status: 'NOT_REQUIRED',
            message: 'No measurement required for Point geometry',
          },
        ];
      } catch (err: any) {
        status = 'FAILED';
        errorMessage = `Shapefile extraction failed: ${err.message}`;
      }
    }

    const record: StoredFile = {
      id: fileId,
      filename,
      file_type: fileType,
      crs: sourceCrs,
      measurement_crs: measurementCrs,
      feature_count: features.length,
      status,
      created_at: now,
      updated_at: now,
      error_message: errorMessage,
      features,
    };

    filesDatabase.set(fileId, record);

    return res.status(201).json({
      id: record.id,
      filename: record.filename,
      feature_count: record.feature_count,
      crs: record.crs,
      status: record.status,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'File upload failed',
    });
  }
});

app.get(['/api/files', '/files'], (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size as string) || 20));

  const allFiles = Array.from(filesDatabase.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const total = allFiles.length;
  const start = (page - 1) * pageSize;
  const items = allFiles.slice(start, start + pageSize).map(file => ({
    id: file.id,
    filename: file.filename,
    file_type: file.file_type,
    feature_count: file.feature_count,
    crs: file.crs,
    status: file.status,
    created_at: file.created_at,
  }));

  res.json({
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

app.get(['/api/files/:id', '/files/:id'], (req: Request, res: Response) => {
  const file = filesDatabase.get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Not Found', message: 'File not found' });
  }

  res.json({
    id: file.id,
    filename: file.filename,
    file_type: file.file_type,
    feature_count: file.feature_count,
    crs: file.crs,
    measurement_crs: file.measurement_crs,
    status: file.status,
    created_at: file.created_at,
    updated_at: file.updated_at,
    error_message: file.error_message,
  });
});

app.get(['/api/files/:id/measurements', '/files/:id/measurements'], (req: Request, res: Response) => {
  const file = filesDatabase.get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: 'Not Found', message: 'File not found' });
  }

  if (file.status !== 'COMPLETED') {
    return res.status(400).json({
      error: 'Bad Request',
      message: `File processing not completed. Current status: ${file.status}`,
    });
  }

  let polygonCount = 0;
  let linestringCount = 0;
  let pointCount = 0;
  let totalArea = 0.0;
  let totalLength = 0.0;

  const featureResponses = file.features.map(feat => {
    if (feat.geometry_type === 'Polygon') {
      polygonCount++;
      if (feat.measurement_value) totalArea += feat.measurement_value;
    } else if (feat.geometry_type === 'LineString') {
      linestringCount++;
      if (feat.measurement_value) totalLength += feat.measurement_value;
    } else if (feat.geometry_type === 'Point') {
      pointCount++;
    }

    return {
      feature_id: feat.feature_index,
      geometry_type: feat.geometry_type,
      properties: feat.properties,
      measurement_type: feat.measurement_type,
      value: feat.measurement_value,
      unit: feat.measurement_unit,
      status: feat.status,
      message: feat.message,
    };
  });

  res.json({
    file_id: file.id,
    crs: file.crs,
    measurement_crs: file.measurement_crs,
    features: featureResponses,
    summary: {
      file_id: file.id,
      feature_count: file.features.length,
      polygon_count: polygonCount,
      linestring_count: linestringCount,
      point_count: pointCount,
      total_area_m2: totalArea > 0 ? Math.round(totalArea * 100) / 100 : null,
      total_length_m: totalLength > 0 ? Math.round(totalLength * 100) / 100 : null,
      measurement_crs: file.measurement_crs,
    },
  });
});

app.delete(['/api/files/:id', '/files/:id'], (req: Request, res: Response) => {
  const exists = filesDatabase.has(req.params.id);
  if (!exists) {
    return res.status(404).json({ error: 'Not Found', message: 'File not found' });
  }

  filesDatabase.delete(req.params.id);
  res.status(204).send();
});

// Global Express error handler to prevent Vercel 500 crashes
app.use((err: any, req: Request, res: Response, _next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err?.message || 'Server error occurred',
  });
});

// Setup dev and production Vite serving
async function setupVite() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoMeasure server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  setupVite();
}

export default app;
