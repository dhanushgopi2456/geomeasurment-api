import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { filesApi, healthApi } from '../../services/api';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Spinner, SkeletonCard } from '../ui/LoadingStates';
import { formatNumber } from '../../utils/helpers';
import { 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calculator,
  TrendingUp,
  Upload,
  ArrowUpRight,
  Globe
} from 'lucide-react';
import { cn } from '../../utils/helpers';

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalFeatures: 0,
    totalArea: 0,
    totalLength: 0,
  });
  const [recentFiles, setRecentFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<{ status: string; version: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [filesResponse, healthResponse] = await Promise.all([
          filesApi.list(1, 5),
          healthApi.check(),
        ]);
        
        setHealth(healthResponse);
        setRecentFiles(filesResponse.items);
        
        // Calculate stats from all files (would need pagination in real app)
        const allFilesResponse = await filesApi.list(1, 100);
        const allFiles = allFilesResponse.items;
        
        let completedFiles = 0;
        let failedFiles = 0;
        let totalFeatures = 0;
        
        allFiles.forEach(file => {
          if (file.status === 'COMPLETED') completedFiles++;
          else if (file.status === 'FAILED') failedFiles++;
          totalFeatures += file.feature_count;
        });
        
        setStats({
          totalFiles: allFiles.length,
          completedFiles,
          failedFiles,
          totalFeatures,
          totalArea: 0,
          totalLength: 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Files',
      value: formatNumber(stats.totalFiles),
      icon: FileText,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      trend: '+12%',
      trendColor: 'text-green-600',
    },
    {
      title: 'Completed',
      value: formatNumber(stats.completedFiles),
      icon: CheckCircle,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      trend: '+8%',
      trendColor: 'text-green-600',
    },
    {
      title: 'Failed',
      value: formatNumber(stats.failedFiles),
      icon: AlertCircle,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      trend: '-2%',
      trendColor: 'text-green-600',
    },
    {
      title: 'Total Features',
      value: formatNumber(stats.totalFeatures),
      icon: Calculator,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      trend: '+1,234',
      trendColor: 'text-green-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <Spinner size="md" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <Card><SkeletonCard /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Overview of your geospatial measurements</p>
        </div>
        <Button onClick={() => {
          toast('Navigating to Upload', { icon: '📤', duration: 1000 });
          navigate('/upload');
        }}>
          <Upload className="w-4 h-4 mr-1.5" />
          Upload File
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
                  <p className={cn('text-sm font-medium mt-2', stat.trendColor)}>
                    <TrendingUp className="w-3 h-3 inline" /> {stat.trend} vs last month
                  </p>
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader 
            title="Recent Files" 
            description="Latest uploaded geospatial files"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/files')}>
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            }
          />
          <CardContent className="pt-0">
            {recentFiles.length === 0 ? (
              <div className="py-8 text-center">
                <Database className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No files uploaded yet</p>
                <Button className="mt-3" onClick={() => navigate('/upload')}>
                  <Upload className="w-4 h-4" />
                  Upload First File
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth cursor-pointer" onClick={() => navigate(`/files/${file.id}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {file.file_type === 'KML' ? <Globe className="w-5 h-5 text-slate-600" /> : <Database className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white truncate max-w-[200px]">{file.filename}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatNumber(file.feature_count)} features • {file.crs || 'Unknown CRS'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        file.status === 'COMPLETED' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        file.status === 'PROCESSING' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        file.status === 'FAILED' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                        file.status === 'UPLOADED' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      )}>
                        {file.status}
                      </span>
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader 
            title="System Status" 
            description="API health and version information"
          />
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">API Status</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{health?.status || 'Checking...'}</p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">API Version</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{health?.version || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Database</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">SQLite (Local)</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Storage</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Local filesystem</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title="Quick Actions" 
          description="Common tasks and shortcuts"
        />
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast('Opening file upload dialog', { icon: '📤', duration: 1000 });
                navigate('/upload');
              }}
            >
              <Upload className="w-8 h-8" />
              <span className="font-medium">Upload File</span>
              <span className="text-xs text-slate-500">KML or Shapefile ZIP</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast('Opening uploaded files catalog', { icon: '📁', duration: 1000 });
                navigate('/files');
              }}
            >
              <Database className="w-8 h-8" />
              <span className="font-medium">Browse Files</span>
              <span className="text-xs text-slate-500">View all uploaded files</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                toast('Opening API Explorer documentation', { icon: '⚡', duration: 1000 });
                navigate('/api-explorer');
              }}
            >
              <Calculator className="w-8 h-8" />
              <span className="font-medium">API Explorer</span>
              <span className="text-xs text-slate-500">View API documentation</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}