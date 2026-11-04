import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationState } from '../hooks/usePagination';

interface PaginationControlsProps {
  pagination: Pick<
    PaginationState<unknown>,
    'page' | 'pageSize' | 'totalPages' | 'totalRecords' | 'startRecord' | 'endRecord' | 'setPage' | 'setPageSize'
  >;
  label?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  pagination,
  label = 'records',
}) => {
  const {
    page,
    pageSize,
    totalPages,
    totalRecords,
    startRecord,
    endRecord,
    setPage,
    setPageSize,
  } = pagination;
  const firstPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstPage + index
  );

  return (
    <nav
      aria-label={`${label} pagination`}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-600"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span aria-live="polite">
          Showing {startRecord}-{endRecord} of {totalRecords} {label}
        </span>
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            aria-label={`${label} per page`}
            value={pageSize}
            onChange={event => setPageSize(Number(event.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
          >
            {[10, 20, 25].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {visiblePages.map(pageNumber => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => setPage(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === page ? 'page' : undefined}
            className={`min-w-8 rounded-lg border px-2 py-1.5 ${
              pageNumber === page
                ? 'border-indigo-600 bg-indigo-600 text-white'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};
