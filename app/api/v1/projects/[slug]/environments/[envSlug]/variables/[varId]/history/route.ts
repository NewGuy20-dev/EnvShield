/**
 * Variable History API Route
 * GET - Fetch variable change history
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canViewDecryptedVariables, canViewVariables } from '@/lib/permissions';
import { handleApiError, NotFoundError, PermissionError } from '@/lib/errors';
import { decryptFromStorage } from '@/lib/encryption';
import { logSecurityEvent } from '@/lib/logger';
import { maskSecret } from '@/lib/secrets';

export async function GET(
  req: NextRequest,
  context: any // Use 'any' to bypass type checking for this specific issue
) {
  const params = context.params as { slug: string; envSlug: string; varId: string };
  try {
    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new PermissionError('Authentication required');
    }

    // Get project with member info
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    const member = project.members[0];
    if (!member || !canViewVariables(member.role)) {
      throw new PermissionError('Insufficient permissions');
    }

    const canViewDecrypted = canViewDecryptedVariables(member.role);
    const revealRequested = req.nextUrl.searchParams.get('reveal') === 'true';

    if (revealRequested && !canViewDecrypted) {
      throw new PermissionError('Insufficient permissions to reveal decrypted history');
    }

    // Get environment
    const environment = await prisma.environment.findFirst({
      where: {
        slug: params.envSlug,
        projectId: project.id,
      },
    });

    if (!environment) {
      throw new NotFoundError('Environment');
    }

    // Get variable
    const variable = await prisma.variable.findFirst({
      where: {
        id: params.varId,
        environmentId: environment.id,
      },
    });

    if (!variable) {
      throw new NotFoundError('Variable');
    }

    // Get history
    const history = await prisma.variableHistory.findMany({
      where: { variableId: variable.id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 changes
      include: {
        variable: {
          select: {
            key: true,
          },
        },
      },
    });

    // Get user information for each history entry
    const userIds = [...new Set(history.map(h => h.changedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const formattedHistory = history.map(entry => {
      const user = userMap.get(entry.changedBy);
      let value = '••••';
      let masked = true;
      let decryptionError: string | null = null;

      if (revealRequested || canViewDecrypted) {
        try {
          const decrypted = decryptFromStorage(entry.value);
          if (revealRequested) {
            value = decrypted;
            masked = false;
          } else if (canViewDecrypted) {
            value = maskSecret(decrypted);
          }
        } catch (error) {
          decryptionError = 'Decryption failed';
          value = '[Decryption failed]';
        }
      }

      return {
        id: entry.id,
        key: entry.key,
        newValue: value,
        masked,
        decryptionError,
        changedBy: entry.changedBy,
        changedByName: user?.name || 'Unknown',
        changedByEmail: user?.email || 'unknown@example.com',
        createdAt: entry.createdAt.toISOString(),
      };
    });

    if (revealRequested) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      logSecurityEvent('variable_history_revealed', 'medium', {
        projectId: project.id,
        environmentId: environment.id,
        variableId: params.varId,
        userId: auth.user.id,
        historyEntries: formattedHistory.length,
        ip,
      });

      await prisma.auditLog.create({
        data: {
          projectId: project.id,
          userId: auth.user.id,
          action: 'VARIABLE_HISTORY_REVEALED',
          entityType: 'VARIABLE',
          entityId: params.varId,
          metadata: {
            environmentId: environment.id,
            historyEntries: formattedHistory.length,
            revealRequested: true,
          },
          ipAddress: ip,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });
    }

    return NextResponse.json({
      history: formattedHistory,
      total: formattedHistory.length,
      reveal: revealRequested,
      canReveal: canViewDecrypted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
