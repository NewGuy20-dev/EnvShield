import type { NextRequest } from 'next/server';
import type { Ratelimit } from '@upstash/ratelimit';

import { RateLimitError } from './errors';
import { applyRateLimit, getClientIdentifier } from './rateLimit';
import { logSecurityEvent } from './logger';

interface EnforceRateLimitOptions {
  req: NextRequest;
  limiter: Ratelimit | null;
  max: number;
  windowMs: number;
  event: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export async function enforceRateLimit({
  req,
  limiter,
  max,
  windowMs,
  event,
  severity = 'medium',
}: EnforceRateLimitOptions) {
  const identifier = getClientIdentifier(req);
  const rateLimitResult = await applyRateLimit(identifier, limiter, max, windowMs);

  if (!rateLimitResult.success) {
    logSecurityEvent(event, severity, {
      identifier,
      windowMs,
    });
    throw new RateLimitError(Math.ceil(windowMs / 1000));
  }

  return identifier;
}
