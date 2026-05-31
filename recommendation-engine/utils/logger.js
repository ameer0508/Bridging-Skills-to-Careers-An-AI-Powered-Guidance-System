/**
 * logger.js
 * Lightweight structured logger for the recommendation engine.
 * Outputs JSON-formatted log lines suitable for log aggregation.
 */

'use strict';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

/**
 * Internal log writer.
 *
 * @param {string} level   - Log level
 * @param {string} message - Log message
 * @param {Object} [meta]  - Optional metadata
 */
function log(level, message, meta = {}) {
  if (LEVELS[level] < CURRENT_LEVEL) return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  const output = JSON.stringify(entry);

  if (level === 'error' || level === 'warn') {
    process.stderr.write(output + '\n');
  } else {
    process.stdout.write(output + '\n');
  }
}

const logger = {
  debug : (msg, meta) => log('debug', msg, meta),
  info  : (msg, meta) => log('info',  msg, meta),
  warn  : (msg, meta) => log('warn',  msg, meta),
  error : (msg, meta) => log('error', msg, meta),
};

module.exports = logger;
