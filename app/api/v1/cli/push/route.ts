import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canModifyVariables } from '@/lib/permissions';
import { encryptForStorage } from '@/lib/encryption';
import prisma from '@/lib/db';
import { logError } from '@/lib/logger';

const bodySchema = z.object({
  projectSlug: z.string(),
  environment: z.string(),
  variables: z.array(
    z.object({
      key: z.string().regex(/^[A-Z0-9_]+$/, 'Key must contain only uppercase letters, numbers, and underscores'),
      value: z.string(),
      description: z.string().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const parsed = bodySchema.parse(data);

    // Find project and check membership
    const project = await prisma.project.findUnique({
      where: { slug: parsed.projectSlug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
        environments: {
          where: { slug: parsed.environment },
          include: {
            variables: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      );
    }

    const member = project.members[0];
    if (!member) {
      return NextResponse.json(
        { message: 'You are not a member of this project' },
        { status: 403 }
      );
    }

    // Check if user has permission to modify variables
    if (!canModifyVariables(member.role)) {
      return NextResponse.json(
        { message: 'You do not have permission to modify variables' },
        { status: 403 }
      );
    }

    const environment = project.environments[0];
    if (!environment) {
      return NextResponse.json(
        { message: 'Environment not found' },
        { status: 404 }
      );
    }

    // Track changes
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Process each variable
    for (const variable of parsed.variables) {
      try {
        // Encrypt the value
        const encryptedValue = encryptForStorage(variable.value);

        // Find existing variable
        const existing = environment.variables.find(
          (v) => v.key === variable.key
        );

        if (existing) {
          // Update existing variable
          await prisma.variable.update({
            where: { id: existing.id },
            data: {
              value: encryptedValue,
              description: variable.description,
              updatedAt: new Date(),
            },
          });

          // Create history entry
          await prisma.variableHistory.create({
            data: {
              variableId: existing.id,
              key: variable.key,
              value: existing.value, // Store old encrypted value
              changedBy: auth.user.id,
            },
          });

          updated++;
        } else {
          // Create new variable
          await prisma.variable.create({
            data: {
              environmentId: environment.id,
              key: variable.key,
              value: encryptedValue,
              description: variable.description,
            },
          });

          created++;
        }
      } catch (error) {
        logError(error as Error, { context: `Failed to process variable ${variable.key}` });
        errors.push(`Failed to process ${variable.key}`);
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: 'CLI_PUSH',
        entityType: 'ENVIRONMENT',
        entityId: environment.id,
        metadata: {
          environment: parsed.environment,
          created,
          updated,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        slug: project.slug,
        name: project.name,
      },
      environment: {
        slug: environment.slug,
        name: environment.name,
      },
      changes: {
        created,
        updated,
        total: created + updated,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.issues.map(issue => issue.message) },
        { status: 400 }
      );
    }

    logError(error as Error, { endpoint: 'POST /cli/push' });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
