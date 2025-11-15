/**
 * Variables Export API Route
 * GET - Export variables in dotenv/JSON/YAML format
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canViewDecryptedVariables } from '@/lib/permissions';
import { handleApiError, NotFoundError, PermissionError, ValidationError } from '@/lib/errors';
import { exportVariables, type ImportFormat } from '@/lib/importExport';
import { z } from 'zod';

const exportQuerySchema = z.object({
  format: z.enum(['dotenv', 'json', 'yaml']).default('dotenv'),
});

interface RouteContext {
  params: {
    slug: string;
    envSlug: string;
  };
}

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  const params = context.params;
  try {
    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new PermissionError('Authentication required');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const formatParam = searchParams.get('format') || 'dotenv';
    const { format } = exportQuerySchema.parse({ format: formatParam });

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
    if (!member || !canViewDecryptedVariables(member.role)) {
      throw new PermissionError('Insufficient permissions to export variables (requires DEVELOPER+ role)');
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

    // Export variables
    const exported = await exportVariables(environment.id, format as ImportFormat);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: 'VARIABLES_EXPORT',
        entityType: 'ENVIRONMENT',
        entityId: environment.id,
        metadata: {
          environment: environment.slug,
          format,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    });

    // Determine content type and file extension
    let contentType: string;
    let fileExtension: string;
    switch (format) {
      case 'json':
        contentType = 'application/json';
        fileExtension = 'json';
        break;
      case 'yaml':
        contentType = 'application/x-yaml';
        fileExtension = 'yaml';
        break;
      case 'dotenv':
      default:
        contentType = 'text/plain';
        fileExtension = 'env';
        break;
    }

    // Return file for download
    const filename = `${project.slug}_${environment.slug}.${fileExtension}`;
    return new NextResponse(exported, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
