import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url, 'http://localhost');
    const sensitiveKeys = ['code', 'state', 'accessToken', 'refreshToken', 'client_secret', 'token'];
    
    sensitiveKeys.forEach(key => {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, 'REDACTED');
      }
    });

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const safeUrl = sanitizeUrl(req.originalUrl);
    logger.http(`${req.method} ${safeUrl} ${res.statusCode} - ${req.ip} - ${duration}ms`);
  });

  next();
};

export default requestLogger;
