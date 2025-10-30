/**
 * Structured Logging with Pino
 * 
 * Provides consistent logging across the application with proper
 * log levels and structured data.
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    env: process.env.NODE_ENV,
  },
});

/**
 * Create a child logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log API request
 */
export function logRequest(req: Request, userId?: string) {
  const url = new URL(req.url);
  logger.info({
    type: 'request',
    method: req.method,
    path: url.pathname,
    userId,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
    userAgent: req.headers.get('user-agent'),
  }, 'API Request');
}

/**
 * Log API response
 */
export function logResponse(req: Request, status: number, duration: number) {
  const url = new URL(req.url);
  logger.info({
    type: 'response',
    method: req.method,
    path: url.pathname,
    status,
    duration,
  }, 'API Response');
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  }, 'Error occurred');
}

/**
 * Log security event
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) {
  logger.warn({
    type: 'security',
    event,
    severity,
    ...details,
  }, `Security Event: ${event}`);
}

/**
 * Log audit event
 */
export function logAuditEvent(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
) {
  logger.info({
    type: 'audit',
    userId,
    action,
    resource,
    timestamp: new Date().toISOString(),
    ...details,
  }, `Audit: ${action} ${resource}`);
}
