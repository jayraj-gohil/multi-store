import type { ApiSuccess } from '../types/api';
import { api } from './api';

export interface ReadinessData {
  database: 'connected';
}

/** Calls GET /api/v1/health/ready — succeeds only when the API and PostgreSQL are both up. */
export async function getReadiness(): Promise<ApiSuccess<ReadinessData>> {
  const { data } = await api.get<ApiSuccess<ReadinessData>>('/health/ready');
  return data;
}
