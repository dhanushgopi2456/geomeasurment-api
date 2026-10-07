import { ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { cn } from '../../utils/helpers';
import { 
  FileText, 
  Upload, 
  Database, 
  Code, 
  Home, 
  ChevronRight,
  LogOut,
  LogIn,
  UserPlus,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Files', href: '/files', icon: Database },
  { name: 'API Explorer', href: '/api-explorer', icon: Code },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-200 lg:translate-x-0 flex flex-col justify-between">
        <div>
          <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-700">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 10V10" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">GeoMeasure</span>
            </Link>
          </div>
          
          <nav className="p-4 space-y-1" aria-label="Main navigation">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Analysis Tools
            </div>
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Account Pages
            </div>
            <Link
              to="/login"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth',
                location.pathname === '/login'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <LogIn className="w-4 h-4 flex-shrink-0" />
              Sign In Page
            </Link>
            <Link
              to="/register"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-smooth',
                location.pathname === '/register'
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )}
            >
              <UserPlus className="w-4 h-4 flex-shrink-0" />
              Register Page
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          {isAuthenticated && user ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center text-sm">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout} 
                className="w-full text-xs h-7 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/login" className="block">
                <Button variant="primary" size="sm" className="w-full text-xs">
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  Sign In (Demo)
                </Button>
              </Link>
              <Link to="/register" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Register
                </Button>
              </Link>
            </div>
          )}

          <ThemeToggle variant="full" />

          <div className="text-[11px] text-slate-400 text-center">
            GeoMeasure API v1.0.0
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-850/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="px-6 py-3.5 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              {location.pathname === '/login' 
                ? 'Sign In' 
                : location.pathname === '/register' 
                ? 'Register' 
                : navigation.find(n => location.pathname === n.href || (n.href !== '/' && location.pathname.startsWith(n.href)))?.name || 'GeoMeasure'}
            </h1>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-medium text-slate-900 dark:text-white">{user.name}</span>
                    <span className="text-[11px] text-primary-600 dark:text-primary-400">{user.email}</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center font-medium text-xs">
                    {user.name[0]}
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="text-xs">
                    <LogOut className="w-3.5 h-3.5 mr-1" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="text-xs">
                      <LogIn className="w-3.5 h-3.5 mr-1" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary" size="sm" className="text-xs">
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      {description && <p className="mt-1 text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-4', className)}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}