import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { filesApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, Pagination } from '../ui/Table';
import { Spinner, SkeletonTable, EmptyState } from '../ui/LoadingStates';
import { formatDate, formatNumber, getStatusColor } from '../../utils/helpers';
import { ChevronLeft, FileText, Database, Globe, Trash2, MoreHorizontal, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import { FileListItem, FileStatus, FileType } from '../../types';

export function FilesList() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      try {
        const response = await filesApi.list(page, pageSize);
        setFiles(response.items);
        setTotal(response.total);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [page, pageSize]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file and all its measurements?')) return;
    
    setDeletingId(id);
    try {
      await filesApi.delete(id);
      toast.success('File deleted successfully');
      setFiles(prev => prev.filter(f => f.id !== id));
      setTotal(prev => prev - 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  const statusColors: Record<FileStatus, string> = {
    COMPLETED: 'success',
    PROCESSING: 'warning',
    FAILED: 'danger',
    UPLOADED: 'info',
  };

  const typeIcons: Record<FileType, React.ReactNode> = {
    KML: <Globe className="w-4 h-4" />,
    SHAPEFILE: <Database className="w-4 h-4" />,
    UNKNOWN: <FileText className="w-4 h-4" />,
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = search === '' || 
      file.filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(file.status);
    const matchesType = typeFilter.length === 0 || typeFilter.includes(file.file_type);
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading && files.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Files</h1>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Files</h1>
        <Button onClick={() => navigate('/upload')}>
          <FileText className="w-4 h-4" />
          Upload New
        </Button>
      </div>

      <Card>
        <CardHeader
          title={`All Files (${total})`}
          action={
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-64 pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          }
        />
        <CardContent className="pt-0">
          <Table
            columns={[
              { key: 'filename', header: 'File', render: (row: FileListItem) => (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {typeIcons[row.file_type]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white truncate max-w-[250px]">{row.filename}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{row.file_type.toLowerCase()}</p>
                  </div>
                </div>
              )},
              { key: 'crs', header: 'CRS', render: (row: FileListItem) => (
                row.crs ? (
                  <span className="font-mono text-sm">{row.crs}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )
              )},
              { key: 'feature_count', header: 'Features', render: (row: FileListItem) => (
                <span className="font-mono">{formatNumber(row.feature_count)}</span>
              )},
              { key: 'status', header: 'Status', render: (row: FileListItem) => (
                <Badge className={cn(getStatusColor(row.status))}>{row.status}</Badge>
              )},
              { key: 'created_at', header: 'Created', render: (row: FileListItem) => (
                <span className="text-slate-600 dark:text-slate-400">{formatDate(row.created_at)}</span>
              )},
              { key: 'actions', header: '', className: 'w-40', render: (row: FileListItem) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/files/${row.id}/measurements`)} disabled={row.status !== 'COMPLETED'}>
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/files/${row.id}`)}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} loading={deletingId === row.id}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              )},
            ]}
            data={filteredFiles}
            keyExtractor={(row) => row.id}
            emptyMessage={files.length === 0 ? 'No files uploaded yet' : 'No files match the current filters'}
          />

          {total > pageSize && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / pageSize)}
              onPageChange={(p) => {
                setPage(p);
                toast(`Page ${p} of ${Math.ceil(total / pageSize)}`, { id: 'files-page', icon: '📄', duration: 1000 });
              }}
            />
          )}
        </CardContent>
      </Card>

      {files.length === 0 && !loading && (
        <Card className="mt-6">
          <CardContent className="py-12">
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No Files Uploaded"
              description="Upload your first KML or Shapefile to get started with geospatial measurements."
              action={<Button onClick={() => navigate('/upload')}><FileText className="w-4 h-4" /> Upload File</Button>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}