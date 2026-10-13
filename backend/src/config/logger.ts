import winston from 'winston';
import env from './env.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  env.NODE_ENV === 'development'
    ? winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    : winston.format.json()
);

const logDir = process.env.LOG_DIR || 'logs';

// Log files hold request paths and account ids, so they are bounded: each file rotates at
// LOG_MAX_FILE_MB (default 10) and only LOG_MAX_FILES (default 5) are kept, oldest removed first.
const LOG_ROTATION = {
  maxsize: (Number(process.env.LOG_MAX_FILE_MB) || 10) * 1024 * 1024,
  maxFiles: Number(process.env.LOG_MAX_FILES) || 5,
  tailable: true,
};

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: `${logDir}/error.log`,
    ...LOG_ROTATION,
    level: 'error'
  }),
  new winston.transports.File({ filename: `${logDir}/combined.log`, ...LOG_ROTATION })
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
  exitOnError: false
});

export default logger;
