import { useState } from 'react';

export interface Pagination<T> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageItems: T[];
  totalItems: number;
  pageSize: number;
}

/**
 * Client-side pagination over an already-loaded array. If the list shrinks below the
 * stored page (e.g. after a delete), reads are clamped to the last valid page — the
 * stored page number itself is left alone and simply reclamps if the list grows back.
 */
export function usePagination<T>(items: T[], pageSize = 8): Pagination<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const start = (clampedPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { page: clampedPage, setPage, totalPages, pageItems, totalItems: items.length, pageSize };
}
