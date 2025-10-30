import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit';
import { handleApiError, AuthError } from '@/lib/errors';
import { logger, logSecurityEvent } from '@/lib/logger';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tokenName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Apply CLI rate limiting (30 requests per minute)
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, cliLimiter, 30, 60 * 1000);
    
    if (!rateLimitResult.success) {
      logSecurityEvent('cli_rate_limit_exceeded', 'medium', {
        identifier,
        endpoint: '/api/v1/cli/auth',
      });
      
      return new Response(
        JSON.stringify({
          error: 'Too many CLI authentication attempts',
          message: 'Please try again in a minute',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }

    const data = await req.json();
    const parsed = bodySchema.parse(data);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      logSecurityEvent('cli_auth_failed', 'low', {
        email: parsed.email,
        reason: 'user_not_found',
        ip: identifier,
      });
      throw new AuthError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await compare(parsed.password, user.passwordHash);
    if (!isValidPassword) {
      logSecurityEvent('cli_auth_failed', 'low', {
        email: parsed.email,
        userId: user.id,
        reason: 'invalid_password',
        ip: identifier,
      });
      throw new AuthError('Invalid credentials');
    }

    // Generate API token with esh_ prefix
    const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex');
    const tokenHash = await hash(tokenPlain, 12);

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create token in database
    const token = await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        name: parsed.tokenName ?? 'CLI Token',
        expiresAt,
      },
    });

    logger.info({ 
      userId: user.id, 
      tokenId: token.id,
      tokenName: parsed.tokenName 
    }, 'CLI token created');

    return NextResponse.json({
      token: tokenPlain,
      expiresAt: expiresAt.toISOString(),
      message: 'Authentication successful',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
