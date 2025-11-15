/**
 * OAuth Account Unlinking API Route
 * POST - Unlink OAuth account (requires password + optional 2FA)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { handleApiError, AuthError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import prisma from '@/lib/db';
import { compare } from 'bcryptjs';
import { verifyTwoFactorToken } from '@/lib/twoFactor';
import { queueSecurityAlert } from '@/lib/securityEvents';
import { z } from 'zod';

const unlinkSchema = z.object({
  provider: z.enum(['google', 'github']),
  password: z.string().min(8, 'Password is required'),
  twoFactorToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUserFromRequest(req);
    if (!authResult) {
      throw new AuthError('Authentication required');
    }

    // Parse request body
    const body = await req.json();
    const { provider, password, twoFactorToken } = unlinkSchema.parse(body);

    // Get user with accounts and project memberships
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: {
        accounts: true,
        projects: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    // Verify password
    if (!user.passwordHash) {
      throw new ValidationError('Cannot unlink: no password set. Please set a password first.');
    }

    const passwordValid = await compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new AuthError('Invalid password');
    }

    // Verify 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        throw new ValidationError('2FA code required');
      }

      const twoFactorValid = await verifyTwoFactorToken(user.id, twoFactorToken);
      if (!twoFactorValid) {
        throw new AuthError('Invalid 2FA code');
      }
    }

    // Check if this is the last authentication method
    const linkedAccounts = user.accounts.length;
    const hasPassword = !!user.passwordHash;
    const totalAuthMethods = linkedAccounts + (hasPassword ? 1 : 0);

    if (totalAuthMethods <= 1) {
      throw new ValidationError('Cannot unlink last authentication method. Add another method first.');
    }

    // Find and delete the OAuth account
    const account = user.accounts.find(acc => acc.providerId === provider);
    if (!account) {
      throw new ValidationError(`${provider} account not linked`);
    }

    await prisma.account.delete({
      where: { id: account.id },
    });

    // Queue security alert
    await queueSecurityAlert({
      userId: user.id,
      type: 'oauth_unlinked',
      metadata: {
        provider,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      },
    });

    // Log audit event (if user has a project membership)
    const primaryProjectId = user.projects[0]?.projectId;

    if (primaryProjectId) {
      await prisma.auditLog.create({
        data: {
          projectId: primaryProjectId,
          userId: user.id,
          action: 'OAUTH_UNLINK',
          entityType: 'USER',
          entityId: user.id,
          metadata: {
            provider,
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });
    } else {
      logger.warn({ userId: user.id }, 'OAuth unlink without project membership; skipping audit log');
    }

    logger.info({ userId: user.id, provider }, 'OAuth account unlinked');

    return NextResponse.json({
      message: `${provider} account unlinked successfully`,
      provider,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
