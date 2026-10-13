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

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'RATE_LIMITED',
};

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

  // Malformed ids in the URL or body (e.g. "/roadmap/undefined") are a client error, not a crash
  if (err.name === 'BSONError' || err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'The request contains an invalid identifier.',
        details: null,
      },
    });
    return;
  }

  // Handle standard application or unexpected exceptions
  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  // A client error thrown without a code still gets one that matches its status
  const errorCode = appErr.code || STATUS_CODES[statusCode] || (statusCode < 500 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR');
  // An unexpected server error's own message can carry internal details (database, file paths):
  // it goes to the log only. Errors raised on purpose with a code keep their message.
  const errorMessage = statusCode >= 500 && !appErr.code
    ? 'An unexpected error occurred on the server.'
    : appErr.message || 'An unexpected error occurred on the server.';

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
