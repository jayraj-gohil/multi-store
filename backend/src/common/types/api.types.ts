export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: unknown[];
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
