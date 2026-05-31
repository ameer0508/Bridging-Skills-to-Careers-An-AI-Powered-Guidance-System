/**
 * Centralized Error Handling Middleware
 * Catches all errors passed via next(err) and returns structured JSON responses.
 */

const config = require('../config/env');

/**
 * Custom application error class.
 * Allows throwing errors with a specific HTTP status code.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes known errors from unexpected ones
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler — attach to end of route definitions.
 */
const notFound = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler — must be the last middleware registered.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors.join(', ');
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Build the error response
  const response = {
    success: false,
    statusCode,
    message,
  };

  // Include stack trace only in development
  if (config.isDevelopment) {
    response.stack = err.stack;
  }

  // Log unexpected (non-operational) errors
  if (!err.isOperational) {
    console.error('🔥 Unexpected Error:', err);
  }

  res.status(statusCode).json(response);
};

module.exports = { AppError, notFound, errorHandler };
