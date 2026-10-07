import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Lock, Mail, Sparkles, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const navigate = useNavigate();
  const { login, fillDemoCredentials, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState('demo@geomeasure.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const ok = login(email, password);
      setLoading(false);
      if (ok) {
        navigate('/');
      }
    }, 300);
  };

  const handleUseDemo = () => {
    const creds = fillDemoCredentials();
    setEmail(creds.email);
    setPassword(creds.password);
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-3">
          <LogIn className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign In to GeoMeasure</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Access your geospatial analysis files and measurement tools
        </p>
      </div>

      <Card>
        <CardHeader 
          title="Account Login" 
          description="Enter your credentials or use the demo account below"
        />
        <CardContent>
          <div className="p-3 mb-5 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Credentials Included
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUseDemo}
                className="text-xs py-1 h-7"
              >
                Auto-fill Demo
              </Button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
              <div>Email: <span className="font-semibold text-slate-900 dark:text-white">demo@geomeasure.io</span></div>
              <div>Password: <span className="font-semibold text-slate-900 dark:text-white">password123</span></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full mt-2" loading={loading}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center gap-1">
              Register now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
