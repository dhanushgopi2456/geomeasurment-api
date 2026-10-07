import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { filesApi } from '../../services/api';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Spinner, EmptyState } from '../ui/LoadingStates';
import { cn, formatFileSize, getStatusColor } from '../../utils/helpers';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Play, 
  Globe, 
  Database,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DEMO_FILES, generateSampleZipFile, DemoFileItem } from '../../utils/demoFiles';

interface UploadZoneProps {
  onUploadComplete?: (fileId: string) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [loadingDemoId, setLoadingDemoId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUpload = useCallback(async (file: File) => {
    setUploading(true);
    const toastId = toast.loading(`Uploading "${file.name}" & extracting geometries...`);

    try {
      const response = await filesApi.upload(file);
      toast.success(
        `Successfully analyzed ${response.filename}! Found ${response.feature_count} features.`,
        { id: toastId, duration: 4000 }
      );
      onUploadComplete?.(response.id);
    } catch (error: any) {
      toast.error(error.message || 'Upload failed', { id: toastId });
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    toast(`File dropped: ${file.name} (${formatFileSize(file.size)})`, { icon: '📂' });
    setSelectedFile(file);
    await processUpload(file);
  }, [processUpload]);

  const handleDemoSelect = async (demo: DemoFileItem) => {
    setLoadingDemoId(demo.id);
    toast(`Preparing sample file: ${demo.filename}`, { icon: '✨' });

    try {
      let file: File;
      if (demo.fileType === 'SHAPEFILE') {
        file = generateSampleZipFile(demo.filename);
      } else {
        const blob = new Blob([demo.content], { type: 'application/vnd.google-earth.kml+xml' });
        file = new File([blob], demo.filename, { type: 'application/vnd.google-earth.kml+xml' });
      }

      await processUpload(file);
    } catch (error: any) {
      toast.error(`Failed to load demo file: ${error.message || error}`);
    } finally {
      setLoadingDemoId(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'application/vnd.google-earth.kmz': ['.kmz'],
    },
    maxFiles: 1,
    disabled: uploading || !!loadingDemoId,
  });

  const handleFileSelect = () => {
    toast('Opening file selector...', { id: 'file-browse', duration: 1000 });
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    toast('Selected file cleared', { icon: '🗑️' });
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader 
          title="Upload Geospatial File" 
          description="Drag and drop a KML, KMZ, or Shapefile (ZIP), or browse from your computer" 
        />
        <CardContent>
          {selectedFile && !uploading ? (
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Geospatial file'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => processUpload(selectedFile)} loading={uploading}>
                  <Upload className="w-4 h-4 mr-1" />
                  Upload Now
                </Button>
                <Button variant="ghost" size="sm" onClick={removeFile} disabled={uploading}>
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-8 text-center transition-smooth cursor-pointer',
                isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : isDragReject
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                  : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-600 bg-slate-50/50 dark:bg-slate-800/30'
              )}
            >
              <input {...getInputProps()} ref={fileInputRef} />
              
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>
                
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                  {uploading 
                    ? 'Processing geospatial geometries...' 
                    : isDragActive 
                    ? 'Drop the file here' 
                    : 'Drag & drop your file here'}
                </p>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  {uploading 
                    ? 'Calculating geodesic areas & lengths...' 
                    : isDragActive 
                    ? 'Release to begin upload' 
                    : 'Or click to select a file from your device'}
                </p>

                <Button 
                  variant="outline" 
                  onClick={(e) => { e.stopPropagation(); handleFileSelect(); }} 
                  disabled={uploading || !!loadingDemoId}
                  loading={uploading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Supported formats: <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">.kml</code>, <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">.kmz</code>, <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">.zip</code> (Shapefile)
                  <br />
                  Max file size: 50 MB
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/60">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">KML Files</p>
              <p className="text-[11px] text-slate-400">XML Geometries</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/60">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">KMZ Archives</p>
              <p className="text-[11px] text-slate-400">Compressed KML</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700/60">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mx-auto mb-1" />
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Shapefile ZIP</p>
              <p className="text-[11px] text-slate-400">SHP, SHX, DBF, PRJ</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Files Section */}
      <Card className="border-primary-200 dark:border-primary-900/60 bg-gradient-to-b from-white to-primary-50/20 dark:from-slate-850 dark:to-slate-900">
        <CardHeader
          title="Try Sample Demo Files"
          description="Click any pre-built sample file to immediately test geometry measurement without downloading"
          action={
            <Badge variant="info" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              1-Click Demo
            </Badge>
          }
        />
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {DEMO_FILES.map((demo) => {
              const isLoading = loadingDemoId === demo.id;
              return (
                <div 
                  key={demo.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-between hover:border-primary-400 dark:hover:border-primary-600 transition-smooth group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        {demo.fileType === 'KML' ? <Globe className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                      </div>
                      <Badge variant="default" className="text-[10px] font-mono">
                        {demo.fileType}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {demo.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {demo.description}
                    </p>
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] text-slate-400 flex justify-between">
                      <span>{demo.featuresCount} Features</span>
                      <span className="font-mono">{demo.crs.split(' ')[0]}</span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-4 text-xs font-medium"
                    onClick={() => handleDemoSelect(demo)}
                    loading={isLoading}
                    disabled={uploading || !!loadingDemoId}
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Load Demo File
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Geospatial File</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Upload a KML, KMZ, or Shapefile (ZIP) to extract features and calculate geometric measurements.
        </p>
      </div>
      <UploadZone onUploadComplete={(id) => {
        window.location.href = `/files/${id}`;
      }} />
    </div>
  );
}
