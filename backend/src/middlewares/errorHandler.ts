import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../config/logger.js';

export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Capture Zod validation errors
  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map(issue => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));

    logger.warn(`[Validation Warning] ${req.method} ${req.originalUrl}:`, {
      details: formattedDetails,
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload parameters.',
        details: formattedDetails,
      },
    });
    return;
  }

  // Handle standard application or unexpected exceptions
  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const errorCode = appErr.code || 'INTERNAL_SERVER_ERROR';
  const errorMessage = appErr.message || 'An unexpected error occurred on the server.';

  logger.error(
    `[Error Trace] ${req.method} ${req.originalUrl} - ${statusCode} - ${appErr.stack || errorMessage}`
  );

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
      details: appErr.details || null,
    },
  });
};

export default errorHandler;
