import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware for authentication routes (login, register).
 * Restricts brute-forcing by limiting each IP to 15 authentication requests per 15-minute window.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 authentication attempts
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
export default authRateLimiter;
