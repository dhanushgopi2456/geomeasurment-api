import React, { ReactNode, TableHTMLAttributes } from 'react';
import { cn } from '../../utils/helpers';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  className?: string;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table<T>({ 
  columns, 
  data, 
  keyExtractor, 
  className, 
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700', className)}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400',
                  'border-b border-slate-200 dark:border-slate-700',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row)}
                className={cn(
                  'bg-white dark:bg-slate-850',
                  striped && rowIndex % 2 === 1 && 'bg-slate-50 dark:bg-slate-800',
                  hoverable && 'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn('px-4 py-3 text-slate-900 dark:text-slate-100', column.className)}
                  >
                    {column.render ? column.render(row) : (row as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
  );

  return (
    <nav className={cn('flex items-center justify-center gap-1 mt-4', className)} aria-label="Pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600',
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-smooth'
        )}
        aria-label="Previous page"
      >
        ← Prev
      </button>
      
      {visiblePages.map((page, index) => (
        <React.Fragment key={page}>
          {index > 0 && visiblePages[index - 1] !== page - 1 && (
            <span className="px-2 text-slate-400">...</span>
          )}
          <button
            onClick={() => onPageChange(page)}
            className={cn(
              'w-8 h-8 rounded-lg text-sm font-medium transition-smooth',
              page === currentPage
                ? 'bg-primary-600 text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
            aria-current={page === currentPage ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        </React.Fragment>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600',
          'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-smooth'
        )}
        aria-label="Next page"
      >
        Next →
      </button>
    </nav>
  );
}