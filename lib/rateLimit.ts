/**
 * Rate Limiting Configuration
 * 
 * Provides tiered rate limiting to protect API endpoints from abuse:
 * - Auth endpoints: Strict limits to prevent brute force
 * - API routes: Standard limits for general usage
 * - CLI endpoints: Moderate limits for automation
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Fallback in-memory store for development
class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  async limit(identifier: string, max: number, windowMs: number) {
    const now = Date.now();
    const key = identifier;
    const data = this.store.get(key);

    if (!data || data.resetAt < now) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { success: true, limit: max, remaining: max - 1, reset: now + windowMs };
    }

    if (data.count >= max) {
      return { success: false, limit: max, remaining: 0, reset: data.resetAt };
    }

    data.count++;
    return { success: true, limit: max, remaining: max - data.count, reset: data.resetAt };
  }
}

const inMemoryLimiter = new InMemoryRateLimiter();

/**
 * Auth Limiter - Strict limits for authentication endpoints
 * 5 requests per 15 minutes to prevent brute force attacks
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * API Limiter - Standard limits for general API usage
 * 100 requests per minute for authenticated users
 */
export const apiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null;

/**
 * CLI Limiter - Moderate limits for CLI operations
 * 30 requests per minute to allow automation while preventing abuse
 */
export const cliLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      analytics: true,
      prefix: 'ratelimit:cli',
    })
  : null;

/**
 * Password Reset Limiter - Very strict for password reset attempts
 * 3 requests per hour to prevent enumeration attacks
 */
export const passwordResetLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: 'ratelimit:reset',
    })
  : null;

/**
 * Helper function to apply rate limiting with fallback to in-memory
 */
export async function applyRateLimit(
  identifier: string,
  limiter: Ratelimit | null,
  maxRequests: number,
  windowMs: number
) {
  if (!limiter) {
    // Fallback to in-memory limiter for development
    return inMemoryLimiter.limit(identifier, maxRequests, windowMs);
  }

  const result = await limiter.limit(identifier);
  return result;
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(req: Request): string {
  // Try to get real IP from headers (for proxy/CDN scenarios)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  
  return forwarded?.split(',')[0].trim() || realIp || 'unknown';
}

/**
 * Rate limit response helper
 */
export function createRateLimitResponse() {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '900', // 15 minutes in seconds
      },
    }
  );
}
