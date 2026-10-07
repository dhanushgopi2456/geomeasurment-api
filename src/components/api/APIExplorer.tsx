import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Code, 
  Globe,
  Copy,
  Check
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';

const endpoints = [
  {
    category: 'Files',
    items: [
      {
        method: 'POST',
        path: '/api/files/',
        description: 'Upload a geospatial file (KML or Shapefile ZIP)',
        request: 'multipart/form-data with file field',
        response: 'FileUploadResponse',
      },
      {
        method: 'GET',
        path: '/api/files/',
        description: 'List uploaded files with pagination',
        params: 'page, page_size',
        response: 'FileListResponse',
      },
      {
        method: 'GET',
        path: '/api/files/{id}',
        description: 'Get file information by ID',
        response: 'FileInfoResponse',
      },
      {
        method: 'GET',
        path: '/api/files/{id}/measurements',
        description: 'Get measurements for all features in a file',
        response: 'MeasurementsResponse',
      },
      {
        method: 'DELETE',
        path: '/api/files/{id}',
        description: 'Delete a file and its measurements',
        response: '204 No Content',
      },
    ],
  },
  {
    category: 'Health',
    items: [
      {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        response: 'HealthResponse',
      },
    ],
  },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function APIExplorer() {
  const [expanded, setExpanded] = useState<string[]>(endpoints.map(e => e.category));

  const toggleCategory = (category: string) => {
    const isClosing = expanded.includes(category);
    setExpanded(prev => isClosing 
      ? prev.filter(c => c !== category) 
      : [...prev, category]
    );
    toast(isClosing ? `Collapsed ${category} endpoints` : `Expanded ${category} endpoints`, {
      id: 'cat-toggle',
      duration: 1200,
      icon: isClosing ? '📁' : '📂',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied: ${text}`, { duration: 2500 });
    } catch {
      toast(`Copied ${text}`, { icon: '📋' });
    }
  };

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Explorer</h1>
          <p className="text-slate-500 dark:text-slate-400">Explore and test the GeoMeasure API endpoints</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth"
          >
            <Globe className="w-4 h-4" />
            Swagger UI
          </a>
          <a
            href="/redoc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-smooth"
          >
            <Code className="w-4 h-4" />
            ReDoc
          </a>
        </div>
      </div>

      <Card>
        <CardHeader title="Base URL" description="All endpoints are relative to this base URL" />
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm">
            <code>{baseUrl}</code>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(baseUrl)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 mt-6">
        {endpoints.map((category) => (
          <Card key={category.category}>
            <CardHeader
              title={category.category}
              action={
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleCategory(category.category)}
                  className="h-8 w-8 p-0"
                >
                  {expanded.includes(category.category) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              }
            />
            {expanded.includes(category.category) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {category.items.map((endpoint) => (
                    <div key={`${endpoint.method}-${endpoint.path}`} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <Badge className={cn(methodColors[endpoint.method], 'px-3 py-1 font-mono text-xs')}>
                          {endpoint.method}
                        </Badge>
                        <code className="font-mono text-sm text-slate-900 dark:text-white flex-1">{endpoint.path}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(endpoint.path)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <a
                          href={`/docs#/${endpoint.method.toLowerCase()}-api-files-${endpoint.path.replace(/\//g, '-').replace(/{/g, '').replace(/}/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="View in docs"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <div className="p-4 space-y-3">
                        <p className="text-slate-600 dark:text-slate-400">{endpoint.description}</p>
                        
                        {endpoint.params && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Query Parameters</p>
                            <pre className="mt-1 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-slate-600 dark:text-slate-400 overflow-auto">
                              {endpoint.params}
                            </pre>
                          </div>
                        )}

                        {endpoint.request && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Request</p>
                            <pre className="mt-1 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-slate-600 dark:text-slate-400 overflow-auto">
                              {endpoint.request}
                            </pre>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Response Schema</p>
                          <pre className="mt-1 text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded font-mono text-slate-600 dark:text-slate-400 overflow-auto">
                            {endpoint.response}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader title="Authentication" description="Current authentication status" />
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Code className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">No Authentication Required</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">API is currently open for development</p>
                </div>
              </div>
              <Badge variant="warning">Public</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">CORS Enabled</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Frontend origin allowed</p>
                </div>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}