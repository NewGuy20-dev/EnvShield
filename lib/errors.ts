/**
 * Centralized Error Handling
 * 
 * Custom error classes and error handling utilities for consistent
 * error responses across the application.
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(process.env.NODE_ENV === 'development' && this.details
        ? { details: this.details }
        : {}),
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Authentication error (401)
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'AUTH_ERROR');
  }
}

/**
 * Authorization/Permission error (403)
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(403, message, 'PERMISSION_ERROR');
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT_ERROR');
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter: number = 900) {
    super(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_ERROR', {
      retryAfter,
    });
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_ERROR', details);
  }
}

/**
 * Encryption error
 */
export class EncryptionError extends AppError {
  constructor(message: string = 'Encryption operation failed') {
    super(500, message, 'ENCRYPTION_ERROR');
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(500, message, 'DATABASE_ERROR', details);
  }
}

/**
 * Handle errors in API routes
 */
export function handleApiError(error: unknown): Response {
  // Log error for debugging
  console.error('API Error:', error);

  // Handle known application errors
  if (error instanceof AppError) {
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...(error instanceof RateLimitError && error.details?.retryAfter
          ? { 'Retry-After': error.details.retryAfter.toString() }
          : {}),
      },
    });
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return new Response(
      JSON.stringify({
        error: 'ValidationError',
        message: 'Invalid request data',
        code: 'VALIDATION_ERROR',
        issues: (error as any).issues,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      return new Response(
        JSON.stringify({
          error: 'ConflictError',
          message: 'A record with this value already exists',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    if (prismaError.code === 'P2025') {
      return new Response(
        JSON.stringify({
          error: 'NotFoundError',
          message: 'Record not found',
          code: 'NOT_FOUND',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Unknown error - return generic 500
  return new Response(
    JSON.stringify({
      error: 'InternalError',
      message:
        process.env.NODE_ENV === 'development'
          ? (error as Error)?.message || 'An unexpected error occurred'
          : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
