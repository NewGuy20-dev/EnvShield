import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit';
import { handleApiError, AuthError } from '@/lib/errors';
import { logger, logSecurityEvent } from '@/lib/logger';
import { MAX_API_TOKENS_PER_USER } from '@/lib/constants';
import { auth } from '@/lib/auth';
import { verifyTwoFactorToken, verifyBackupCode } from '@/lib/twoFactor';
import { queueSecurityAlert } from '@/lib/securityEvents';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tokenName: z.string().optional(),
  twoFactorToken: z.string().optional(),
  backupCode: z.string().optional(),
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

    // Authenticate via Better Auth
    let authResult;
    try {
      authResult = await auth.api.signInEmail({
        body: {
          email: parsed.email,
          password: parsed.password,
        },
        headers: req.headers,
        request: req,
      });
    } catch (err) {
      logSecurityEvent('cli_auth_failed', 'low', {
        email: parsed.email,
        reason: 'invalid_credentials',
        ip: identifier,
      });
      throw new AuthError('Invalid credentials');
    }

    if (!authResult?.user) {
      logSecurityEvent('cli_auth_failed', 'low', {
        email: parsed.email,
        reason: 'auth_failed',
        ip: identifier,
      });
      throw new AuthError('Invalid credentials');
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled) {
      const hasProvidedCode = parsed.twoFactorToken || parsed.backupCode;

      if (!hasProvidedCode) {
        logSecurityEvent('cli_2fa_required', 'low', {
          userId: user.id,
          email: user.email,
          ip: identifier,
        });
        return NextResponse.json(
          {
            twoFactorRequired: true,
            methods: ['totp', 'backup'],
            message: '2FA verification required. Please provide a code using --totp or --backup flag.',
          },
          { status: 428 }
        );
      }

      // Validate 2FA code
      let isValid2FA = false;
      
      if (parsed.twoFactorToken && user.twoFactorSecret) {
        isValid2FA = verifyTwoFactorToken(user.twoFactorSecret, parsed.twoFactorToken);
        
        if (!isValid2FA) {
          logSecurityEvent('cli_2fa_failed', 'medium', {
            userId: user.id,
            email: user.email,
            method: 'totp',
            ip: identifier,
          });
          throw new AuthError('Invalid 2FA code');
        }
      } else if (parsed.backupCode && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const { valid, codeIndex } = await verifyBackupCode(
          parsed.backupCode,
          user.twoFactorBackupCodes
        );
        isValid2FA = valid;

        if (isValid2FA && codeIndex >= 0) {
          const updatedCodes = [...user.twoFactorBackupCodes];
          updatedCodes[codeIndex] = `USED:${new Date().toISOString()}`;
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: updatedCodes },
          });
        }

        if (!isValid2FA) {
          logSecurityEvent('cli_2fa_failed', 'medium', {
            userId: user.id,
            email: user.email,
            method: 'backup',
            ip: identifier,
          });
          throw new AuthError('Invalid backup code');
        }
      } else {
        throw new AuthError('Invalid 2FA method');
      }

      logSecurityEvent('cli_2fa_success', 'low', {
        userId: user.id,
        email: user.email,
        method: parsed.twoFactorToken ? 'totp' : 'backup',
        ip: identifier,
      });
    }

    // Generate API token with esh_ prefix
    const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex');
    const tokenDigest = crypto.createHash('sha256').update(tokenPlain).digest('hex');
    const tokenHash = await hash(tokenPlain, 12);

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

    // Create token in database with new schema (tokenDigest primary, tokenHash for legacy)
    const token = await prisma.apiToken.create({
      data: {
        userId: user.id,
        tokenDigest,
        tokenHash,
        name: parsed.tokenName ?? 'CLI Token',
        expiresAt,
      },
    });

    logSecurityEvent('cli_token_created', 'medium', {
      userId: user.id,
      tokenId: token.id,
      tokenName: parsed.tokenName,
      ip: identifier,
    });

    logger.info({ 
      userId: user.id, 
      tokenId: token.id,
      tokenName: parsed.tokenName 
    }, 'CLI token created');

    await queueSecurityAlert({
      userId: user.id,
      type: 'cli_token_created',
      metadata: {
        tokenName: token.name,
        ip: identifier,
      },
    });

    return NextResponse.json({
      token: tokenPlain,
      expiresAt: expiresAt.toISOString(),
      tokenId: token.id,
      tokenName: token.name,
      message: 'Authentication successful',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
