// src/utils/pagination.ts

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Convert raw query params into normalized pagination options.
 */
export const getPaginationOptions = (
  query: PaginationQuery,
  defaults: { page?: number; limit?: number } = {},
): PaginationOptions => {
  const defaultPage = defaults.page ?? 1;
  const defaultLimit = defaults.limit ?? 20;

  let page = Number(query.page ?? defaultPage);
  let limit = Number(query.limit ?? defaultLimit);

  if (!Number.isFinite(page) || page < 1) page = defaultPage;
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Build a standard paginated response envelope.
 */
export const buildPaginatedResult = <T>(
  data: T[],
  total: number,
  options: PaginationOptions,
): PaginatedResult<T> => {
  const { page, limit } = options;
  const totalPages = Math.max(Math.ceil(total / limit) || 1, 1);

  return {
    data,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
