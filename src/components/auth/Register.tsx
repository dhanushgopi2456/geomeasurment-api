import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { UserPlus, ArrowRight, Sparkles, LogIn, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Senior Geospatial Analyst');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password && confirmPassword && password !== confirmPassword) {
      toast.error('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const ok = register(name, email, password, role);
      setLoading(false);
      if (ok) {
        navigate('/');
      }
    }, 300);
  };

  const handleFillSample = () => {
    setName('Alex Rivers');
    setEmail('alex.rivers@geomeasure.io');
    setPassword('surveyor2026');
    setConfirmPassword('surveyor2026');
    setRole('Senior Geospatial Analyst');
    toast('Filled sample registration data', { icon: '✨' });
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 mb-3">
          <UserPlus className="w-6 h-6" />
        </div>
        <Badge variant="info" className="mb-2">New Account Registration</Badge>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Register for GeoMeasure</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create a separate personal profile for geospatial measurements
        </p>
      </div>

      <Card>
        <CardHeader
          title="Create New Account"
          description="Fill in your details below to set up your account"
          action={
            <Button variant="ghost" size="sm" onClick={handleFillSample} className="text-xs h-7">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Fill Sample
            </Button>
          }
        />
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivers"
              required
            />

            <Input
              label="Work Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@organization.com"
              required
            />

            <Input
              label="Role or Specialization"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. GIS Analyst, Land Surveyor"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" className="w-full mt-2" loading={loading}>
              <UserPlus className="w-4 h-4 mr-2" />
              Register Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 inline-flex items-center gap-1">
              Go to Sign In Page
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
