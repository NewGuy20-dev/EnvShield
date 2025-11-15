/**
 * OAuth Account Status API Route
 * GET - Get linked OAuth accounts for current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { handleApiError, AuthError } from '@/lib/errors';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUserFromRequest(req);
    if (!authResult) {
      throw new AuthError('Authentication required');
    }

    // Get user with linked accounts
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      include: {
        accounts: {
          select: {
            id: true,
            providerId: true,
            accountId: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthError('User not found');
    }

    // Map accounts to response format
    const linkedAccounts = user.accounts.map(account => ({
      provider: account.providerId,
      accountId: account.accountId,
      linkedAt: account.createdAt,
    }));

    // Calculate authentication methods count
    const hasPassword = !!user.passwordHash;
    const totalAuthMethods = linkedAccounts.length + (hasPassword ? 1 : 0);
    const canUnlink = totalAuthMethods > 1;

    return NextResponse.json({
      accounts: linkedAccounts,
      hasPassword,
      canUnlink,
      totalAuthMethods,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
