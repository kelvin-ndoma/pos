import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const sendSuccess = (
  res: Response,
  message: string,
  data?: any,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const sendPaginated = (
  res: Response,
  message: string,
  data: any[],
  meta: { page: number; limit: number; total: number }
) => {
  const pages = Math.ceil(meta.total / meta.limit);
  
  const paginationMeta: PaginationMeta = {
    page: meta.page,
    limit: meta.limit,
    total: meta.total,
    pages,
    hasNext: meta.page < pages,
    hasPrev: meta.page > 1,
  };

  return res.status(200).json({
    success: true,
    message,
    data,
    meta: paginationMeta,
    timestamp: new Date().toISOString(),
  });
};