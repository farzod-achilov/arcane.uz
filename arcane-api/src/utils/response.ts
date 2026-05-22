export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
  error?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, ...(message ? { message } : {}) };
}

export function paginated<T>(data: T[], pagination: Pagination): ApiResponse<T[]> {
  return { success: true, data, pagination };
}

export function fail(error: string, statusCode = 400): { status: number; body: ApiResponse } {
  return { status: statusCode, body: { success: false, error } };
}
