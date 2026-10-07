import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, Pagination } from '../ui/Table';
import { Select } from '../ui/Dropdown';
import { Spinner, SkeletonTable, EmptyState } from '../ui/LoadingStates';
import { formatNumber, getMeasurementStatusColor, getGeometryIcon } from '../../utils/helpers';
import { 
  ChevronLeft, 
  ChevronRight,
  Search, 
  Filter, 
  Download, 
  Calculator,
  FileText,
  MapPin,
  ArrowRight,
  Minus,
  Circle,
  Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import { MeasurementsResponse, FeatureMeasurementResponse, MeasurementStatus } from '../../types';

const GEOMETRY_TYPES = [
  { value: 'Polygon', label: 'Polygon' },
  { value: 'LineString', label: 'LineString' },
  { value: 'Point', label: 'Point' },
  { value: 'MultiPolygon', label: 'MultiPolygon' },
  { value: 'MultiLineString', label: 'MultiLineString' },
  { value: 'MultiPoint', label: 'MultiPoint' },
  { value: 'GeometryCollection', label: 'GeometryCollection' },
];

const MEASUREMENT_STATUSES = [
  { value: 'SUPPORTED', label: 'Supported' },
  { value: 'NOT_REQUIRED', label: 'Not Required' },
  { value: 'NOT_SUPPORTED', label: 'Not Supported' },
  { value: 'INVALID', label: 'Invalid' },
];

export function MeasurementsTable() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<MeasurementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [geometryFilter, setGeometryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    
    const fetchMeasurements = async () => {
      try {
        const response = await filesApi.getMeasurements(id);
        setData(response);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load measurements');
        navigate('/files');
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, [id, navigate]);

  const filteredFeatures = useMemo(() => {
    if (!data) return [];
    
    return data.features.filter(feature => {
      const matchesSearch = search === '' || 
        feature.geometry_type.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(feature.properties || {}).toLowerCase().includes(search.toLowerCase());
      
      const matchesGeometry = geometryFilter.length === 0 || geometryFilter.includes(feature.geometry_type);
      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(feature.status);
      
      return matchesSearch && matchesGeometry && matchesStatus;
    });
  }, [data, search, geometryFilter, statusFilter]);

  const paginatedFeatures = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredFeatures.slice(start, start + pageSize);
  }, [filteredFeatures, page, pageSize]);

  const totalPages = Math.ceil(filteredFeatures.length / pageSize);

  const handleExportCSV = () => {
    if (!data || filteredFeatures.length === 0) {
      toast.error('No measurements available to export');
      return;
    }

    const headers = ['Feature ID', 'Geometry Type', 'Measurement Type', 'Value', 'Unit', 'Status', 'Properties'];
    const rows = filteredFeatures.map(f => [
      f.feature_id,
      f.geometry_type,
      f.measurement_type || '',
      f.value !== null ? f.value : '',
      f.unit || '',
      f.status,
      JSON.stringify(f.properties || {}).replace(/"/g, '""')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `measurements_${id}_features.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredFeatures.length} measurements to CSV!`);
  };

  const handleGeometryFilterChange = (v: string) => {
    const list = v ? v.split(',').filter(Boolean) : [];
    setGeometryFilter(list);
    setPage(1);
    toast(list.length ? `Filtered by geometry: ${v}` : 'Cleared geometry filter', { id: 'geom-filter', icon: '🔍' });
  };

  const handleStatusFilterChange = (v: string) => {
    const list = v ? v.split(',').filter(Boolean) : [];
    setStatusFilter(list);
    setPage(1);
    toast(list.length ? `Filtered by status: ${v}` : 'Cleared status filter', { id: 'status-filter', icon: '🔍' });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/files/${id}`)}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Spinner size="lg" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto">
        <EmptyState
          icon={<Calculator className="w-12 h-12" />}
          title="No Measurements Available"
          description="The file is still processing or has no measurements."
          action={<Button onClick={() => navigate('/files')}>Back to Files</Button>}
        />
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/files/${id}`)}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Measurements</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {summary.feature_count} features • {data.crs ? `Source: ${data.crs}` : ''} {data.measurement_crs ? `→ Measurement: ${data.measurement_crs}` : ''}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Square className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Polygons</p>
                <p className="font-bold text-slate-900 dark:text-white text-xl">{formatNumber(summary.polygon_count)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">LineStrings</p>
                <p className="font-bold text-slate-900 dark:text-white text-xl">{formatNumber(summary.linestring_count)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Circle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Points</p>
                <p className="font-bold text-slate-900 dark:text-white text-xl">{formatNumber(summary.point_count)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {summary.total_area_m2 && (
          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Area</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xl">{formatNumber(summary.total_area_m2)} m²</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {summary.total_length_m && (
          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Length</p>
                  <p className="font-bold text-slate-900 dark:text-white text-xl">{formatNumber(summary.total_length_m)} m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader
          title="Feature Measurements"
          description={`${filteredFeatures.length} of ${data.features.length} features`}
          action={
            <div className="flex items-center gap-2">
              <Select
                options={GEOMETRY_TYPES}
                value={geometryFilter.join(',')}
                onChange={handleGeometryFilterChange}
                placeholder="Filter by geometry"
                className="w-40"
              />
              <Select
                options={MEASUREMENT_STATUSES}
                value={statusFilter.join(',')}
                onChange={handleStatusFilterChange}
                placeholder="Filter by status"
                className="w-40"
              />
            </div>
          }
        />
        <CardContent className="pt-0">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <Table
            columns={[
              { key: 'feature_id', header: 'Feature ID', className: 'font-mono' },
              { key: 'geometry_type', header: 'Geometry', render: (row: FeatureMeasurementResponse) => (
                <span className="flex items-center gap-2">
                  <span className="text-lg">{getGeometryIcon(row.geometry_type)}</span>
                  <span className="font-medium">{row.geometry_type}</span>
                </span>
              )},
              { key: 'properties', header: 'Properties', render: (row: FeatureMeasurementResponse) => (
                <div className="max-w-xs">
                  {row.properties && Object.keys(row.properties).length > 0 ? (
                    <details className="cursor-pointer">
                      <summary className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        {Object.keys(row.properties).length} properties
                        <ChevronRight className="w-3 h-3" />
                      </summary>
                      <pre className="mt-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded max-h-32 overflow-auto">
                        {JSON.stringify(row.properties, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">—</span>
                  )}
                </div>
              )},
              { key: 'measurement_type', header: 'Measurement', render: (row: FeatureMeasurementResponse) => (
                row.measurement_type ? (
                  <span className="capitalize">{row.measurement_type}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )
              )},
              { key: 'value', header: 'Value', render: (row: FeatureMeasurementResponse) => (
                row.value !== null && row.value !== undefined ? (
                  <span className="font-mono font-medium">{formatNumber(row.value)} {row.unit || ''}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )
              )},
              { key: 'status', header: 'Status', render: (row: FeatureMeasurementResponse) => (
                <Badge className={cn(getMeasurementStatusColor(row.status))}>
                  {row.status.replace('_', ' ')}
                </Badge>
              )},
            ]}
            data={paginatedFeatures}
            keyExtractor={(row) => row.feature_id.toString()}
            emptyMessage="No features match the current filters"
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}