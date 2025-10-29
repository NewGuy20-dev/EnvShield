import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canViewDecryptedVariables } from '@/lib/permissions';
import { decryptFromStorage } from '@/lib/encryption';
import prisma from '@/lib/db';

const bodySchema = z.object({
  projectSlug: z.string(),
  environment: z.string(),
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

    // Check if user has permission to view decrypted variables
    if (!canViewDecryptedVariables(member.role)) {
      return NextResponse.json(
        { message: 'You do not have permission to view decrypted variables' },
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

    // Decrypt variables
    const variables = environment.variables.map((v) => {
      try {
        const decrypted = decryptFromStorage(v.value);
        return {
          key: v.key,
          value: decrypted,
          description: v.description,
          updatedAt: v.updatedAt.toISOString(),
        };
      } catch (error) {
        console.error(`Failed to decrypt variable ${v.key}:`, error);
        return {
          key: v.key,
          value: '',
          description: v.description,
          updatedAt: v.updatedAt.toISOString(),
          error: 'Decryption failed',
        };
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: 'CLI_PULL',
        entityType: 'ENVIRONMENT',
        entityId: environment.id,
        metadata: {
          environment: parsed.environment,
          variableCount: variables.length,
        },
      },
    });

    return NextResponse.json({
      project: {
        slug: project.slug,
        name: project.name,
      },
      environment: {
        slug: environment.slug,
        name: environment.name,
      },
      variables,
      lastUpdated: environment.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('CLI pull error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
