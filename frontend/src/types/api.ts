// Mirrors the backend response envelope (backend/src/common/types/api.types.ts).

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: { path: string; message: string }[];
}
