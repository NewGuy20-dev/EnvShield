/**
 * Variable Rollback API Route
 * POST - Rollback variable to a previous version
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canModifyVariables } from '@/lib/permissions';
import { handleApiError, NotFoundError, PermissionError, ValidationError } from '@/lib/errors';
import { encryptForStorage, decryptFromStorage } from '@/lib/encryption';
import { z } from 'zod';

const rollbackSchema = z.object({
  historyId: z.string().min(1, 'History ID is required'),
  reason: z.string().optional(),
});

export async function POST(
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

    // Parse request body
    const body = await req.json();
    const { historyId, reason } = rollbackSchema.parse(body);

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
    if (!member || !canModifyVariables(member.role)) {
      throw new PermissionError('Insufficient permissions to rollback variables');
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

    // Get history entry
    const historyEntry = await prisma.variableHistory.findFirst({
      where: {
        id: historyId,
        variableId: variable.id,
      },
    });

    if (!historyEntry) {
      throw new NotFoundError('History entry');
    }

    // Get the old value from history
    const oldValue = decryptFromStorage(historyEntry.value);

    // Create new history entry for current value before rollback
    await prisma.variableHistory.create({
      data: {
        variableId: variable.id,
        key: variable.key,
        value: variable.value, // Current encrypted value
        changedBy: auth.user.id,
      },
    });

    // Update variable with old value (re-encrypt it)
    const encryptedValue = encryptForStorage(oldValue);
    const updatedVariable = await prisma.variable.update({
      where: { id: variable.id },
      data: {
        value: encryptedValue,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: 'VARIABLE_ROLLBACK',
        entityType: 'VARIABLE',
        entityId: variable.id,
        metadata: {
          key: variable.key,
          environment: environment.slug,
          historyId,
          reason: reason || 'Manual rollback',
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      message: 'Variable rolled back successfully',
      variable: {
        id: updatedVariable.id,
        key: updatedVariable.key,
        description: updatedVariable.description,
        updatedAt: updatedVariable.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
