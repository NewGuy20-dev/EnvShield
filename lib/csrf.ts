/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF protection using double-submit cookie pattern
 * for state-changing operations (POST, PUT, DELETE, PATCH)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Verify CSRF token from request
 */
export function verifyCsrfToken(req: NextRequest): boolean {
  // Skip CSRF for safe methods
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  // Skip CSRF for API token authentication (already has token in header)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return true;
  }

  // Get token from header and cookie
  const headerToken = req.headers.get(CSRF_TOKEN_HEADER);
  const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;

  // Both must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  );
}

/**
 * Set CSRF token in response cookie
 */
export function setCsrfToken(response: NextResponse, token?: string): string {
  const csrfToken = token || generateCsrfToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return csrfToken;
}

/**
 * Middleware wrapper to enforce CSRF protection
 */
export function withCsrfProtection<T = unknown>(
  handler: (req: NextRequest, context?: T) => Promise<Response>
) {
  return async (req: NextRequest, context?: T) => {
    // Verify CSRF token
    if (!verifyCsrfToken(req)) {
      return new Response(
        JSON.stringify({
          error: 'CSRF validation failed',
          message: 'Invalid or missing CSRF token',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Call the original handler
    return handler(req, context);
  };
}

/**
 * API route to get CSRF token
 */
export async function getCsrfTokenRoute(): Promise<Response> {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  setCsrfToken(response, token);
  return response;
}
