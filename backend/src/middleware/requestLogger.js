/**
 * Request Logger Middleware
 * Logs incoming HTTP requests with method, URL, status, and response time.
 */

const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Color-code status for readability in development
    const statusColor =
      statusCode >= 500
        ? '\x1b[31m' // Red
        : statusCode >= 400
        ? '\x1b[33m' // Yellow
        : statusCode >= 300
        ? '\x1b[36m' // Cyan
        : '\x1b[32m'; // Green

    console.log(
      `[${timestamp}] ${method} ${originalUrl} ${statusColor}${statusCode}\x1b[0m ${duration}ms`
    );
  });

  next();
};

module.exports = requestLogger;
