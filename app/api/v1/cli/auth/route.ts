import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit';
import { handleApiError, AuthError } from '@/lib/errors';
import { logger, logSecurityEvent } from '@/lib/logger';
import { MAX_API_TOKENS_PER_USER } from '@/lib/constants';

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
    if (!user.passwordHash) {
      logSecurityEvent('cli_auth_failed', 'low', {
        email: parsed.email,
        userId: user.id,
        reason: 'oauth_only_user',
        ip: identifier,
      });
      throw new AuthError('Invalid credentials');
    }

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
    const tokenDigest = crypto.createHash('sha256').update(tokenPlain).digest('hex');

    const activeTokens = await prisma.apiToken.count({
      where: {
        userId: user.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (activeTokens >= MAX_API_TOKENS_PER_USER) {
      return NextResponse.json(
        {
          error: 'token_limit_reached',
          message: `You already have ${MAX_API_TOKENS_PER_USER} active tokens. Revoke an existing token before creating a new one.`,
        },
        { status: 429 }
      );
    }

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create token in database
    const token = await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        tokenDigest,
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
