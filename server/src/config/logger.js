import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  if (stack) return `${timestamp} [${level}] ${stack}${metaStr}`;
  return `${timestamp} [${level}] ${message}${metaStr}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  }),
];

if (env.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    })
  );
}

const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  transports,
});

export function auditLog(action, userId, details = {}) {
  logger.info(`[AUDIT] ${action}`, { userId, ...details });
}

export default logger;
