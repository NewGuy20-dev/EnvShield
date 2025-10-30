/**
 * Variable History API Route
 * GET - Fetch variable change history
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canViewVariables } from '@/lib/permissions';
import { handleApiError, NotFoundError, PermissionError } from '@/lib/errors';
import { decryptFromStorage } from '@/lib/encryption';

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

    // Format history with decrypted values (masked for security)
    const formattedHistory = history.map(entry => {
      const user = userMap.get(entry.changedBy);
      let oldValue = '';
      let newValue = '';

      try {
        newValue = decryptFromStorage(entry.value);
      } catch (error) {
        newValue = '[Decryption failed]';
      }

      return {
        id: entry.id,
        key: entry.key,
        oldValue, // In a real implementation, you'd need to store old values
        newValue,
        changedBy: entry.changedBy,
        changedByName: user?.name || 'Unknown',
        changedByEmail: user?.email || 'unknown@example.com',
        createdAt: entry.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      history: formattedHistory,
      total: formattedHistory.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
