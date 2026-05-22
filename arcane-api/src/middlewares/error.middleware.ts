import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { config } from '../config';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: config.isDev ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: config.isDev ? err.message : 'Internal server error',
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
}
