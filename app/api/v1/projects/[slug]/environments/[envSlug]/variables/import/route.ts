/**
 * Variables Import API Route
 * POST - Import variables from dotenv/JSON/YAML format
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canModifyVariables } from '@/lib/permissions';
import { handleApiError, NotFoundError, PermissionError, ValidationError } from '@/lib/errors';
import { parseFile, generateDiff, applyImport, type ImportFormat, type ConflictStrategy } from '@/lib/importExport';
import { z } from 'zod';

const importSchema = z.object({
  format: z.enum(['dotenv', 'json', 'yaml']),
  content: z.string().min(1, 'Content is required'),
  strategy: z.enum(['overwrite', 'skip', 'merge']).default('merge'),
  dryRun: z.boolean().default(false),
});

interface RouteContext {
  params: {
    slug: string;
    envSlug: string;
  };
}

export async function POST(
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

    // Parse request body
    const body = await req.json();
    const { format, content, strategy, dryRun } = importSchema.parse(body);

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
      throw new PermissionError('Insufficient permissions to import variables');
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

    // Parse imported file
    let parsed: Record<string, string>;
    try {
      parsed = parseFile(content, format as ImportFormat);
    } catch (error) {
      throw new ValidationError(
        `Failed to parse ${format} content: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Validate that we have at least one variable
    if (Object.keys(parsed).length === 0) {
      throw new ValidationError('No variables found in imported content');
    }

    // Generate diff
    const diff = await generateDiff(environment.id, parsed);

    // If dry run, return diff without applying
    if (dryRun) {
      return NextResponse.json({
        dryRun: true,
        diff: {
          added: diff.added.map(v => ({ key: v.key, value: '***' })), // Mask values in response
          updated: diff.updated.map(u => ({
            key: u.key,
            oldValue: '***',
            newValue: '***',
          })),
          unchanged: diff.unchanged,
        },
        summary: {
          toAdd: diff.added.length,
          toUpdate: diff.updated.length,
          unchanged: diff.unchanged.length,
        },
      });
    }

    // Apply import
    const result = await applyImport(
      environment.id,
      parsed,
      strategy as ConflictStrategy,
      auth.user.id
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: 'VARIABLES_IMPORT',
        entityType: 'ENVIRONMENT',
        entityId: environment.id,
        metadata: {
          environment: environment.slug,
          format,
          strategy,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          errors: result.errors,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      },
    });

    return NextResponse.json({
      message: 'Variables imported successfully',
      result: {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
