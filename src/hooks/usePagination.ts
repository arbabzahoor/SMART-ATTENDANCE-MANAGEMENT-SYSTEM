import { useEffect, useState } from 'react';

export interface PaginationState<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function usePagination<T>(
  items: T[],
  resetKey = '',
  initialPageSize = 10
): PaginationState<T> {
  const [page, setPage] = useState(1);
  const [pageSize, updatePageSize] = useState(initialPageSize);
  const totalRecords = items.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  return {
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    page: currentPage,
    pageSize,
    totalPages,
    totalRecords,
    startRecord,
    endRecord,
    setPage: nextPage => setPage(Math.max(1, Math.min(nextPage, totalPages))),
    setPageSize: nextPageSize => {
      updatePageSize(nextPageSize);
      setPage(1);
    },
  };
}
