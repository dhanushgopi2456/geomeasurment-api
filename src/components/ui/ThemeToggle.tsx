import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'badge' | 'full';
}

export function ThemeToggle({ className, variant = 'button' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'flex items-center justify-between w-full px-3 py-2 text-xs font-medium rounded-lg transition-smooth',
          'border border-slate-200 dark:border-slate-700/80',
          'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200',
          className
        )}
        title={`Current theme: ${theme}. Click to toggle.`}
        aria-label="Toggle theme"
      >
        <span className="flex items-center gap-2">
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-primary-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300',
        'hover:bg-slate-100 dark:hover:bg-slate-700 transition-smooth',
        'focus-ring flex items-center justify-center',
        className
      )}
      title={`Current: ${theme} mode. Click to toggle to ${isDark ? 'light' : 'dark'} mode.`}
      aria-label="Toggle color theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-primary-600 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
