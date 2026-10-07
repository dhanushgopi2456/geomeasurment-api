import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { filesApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Spinner, EmptyState, Skeleton } from '../ui/LoadingStates';
import { formatDate, getStatusColor, formatNumber } from '../../utils/helpers';
import { 
  FileText, 
  Database, 
  Globe, 
  MapPin, 
  Calculator, 
  AlertCircle,
  ChevronLeft,
  ArrowRight,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import { FileInfoResponse, FileStatus, FileType } from '../../types';

export function FileDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<FileInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchFile = async () => {
      try {
        const data = await filesApi.get(id);
        setFile(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load file details');
        navigate('/files');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this file and all its measurements?')) return;
    
    setDeleting(true);
    try {
      await filesApi.delete(id);
      toast.success('File deleted successfully');
      navigate('/files');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/files')}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Spinner size="lg" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Card key={i}><Skeleton className="h-24" /></Card>)}
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="File Not Found"
          description="The requested file could not be found or has been deleted."
          action={<Button onClick={() => navigate('/files')}>Back to Files</Button>}
        />
      </div>
    );
  }

  const statusColors: Record<FileStatus, string> = {
    COMPLETED: 'success',
    PROCESSING: 'warning',
    FAILED: 'danger',
    UPLOADED: 'info',
  };

  const typeIcons: Record<FileType, React.ReactNode> = {
    KML: <Globe className="w-5 h-5" />,
    SHAPEFILE: <Database className="w-5 h-5" />,
    UNKNOWN: <FileText className="w-5 h-5" />,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/files')}>
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{file.filename}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {file.file_type} • {file.feature_count} features • {formatDate(file.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            toast('Loading geometric measurements table', { icon: '📐', duration: 1000 });
            navigate(`/files/${id}/measurements`);
          }}>
            <Calculator className="w-4 h-4 mr-1.5" />
            View Measurements
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            <Trash2 className="w-4 h-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                {typeIcons[file.file_type]}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">File Type</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{file.file_type.toLowerCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Features</p>
                <p className="font-semibold text-slate-900 dark:text-white">{formatNumber(file.feature_count)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Badge className={cn('px-2 py-1', getStatusColor(file.status))}>{file.status}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                <p className="font-semibold text-slate-900 dark:text-white capitalize">{file.status.toLowerCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {file.crs && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Source CRS</p>
                  <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm">{file.crs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {file.measurement_crs && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Measurement CRS</p>
                  <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm">{file.measurement_crs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">File ID</p>
                <p className="font-semibold text-slate-900 dark:text-white font-mono text-sm truncate max-w-[150px]">{file.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="File Information" />
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{formatDate(file.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Updated</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{formatDate(file.updated_at)}</dd>
            </div>
            {file.crs && (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Source CRS</dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white font-mono text-sm">{file.crs}</dd>
              </div>
            )}
            {file.measurement_crs && (
              <div>
                <dt className="text-sm text-slate-500 dark:text-slate-400">Measurement CRS</dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white font-mono text-sm">{file.measurement_crs}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Feature Count</dt>
              <dd className="mt-1 font-medium text-slate-900 dark:text-white">{formatNumber(file.feature_count)}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="mt-1">
                <Badge className={cn(getStatusColor(file.status))}>{file.status}</Badge>
              </dd>
            </div>
            {file.error_message && (
              <div className="md:col-span-2">
                <dt className="text-sm text-slate-500 dark:text-slate-400">Error</dt>
                <dd className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {file.error_message}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}