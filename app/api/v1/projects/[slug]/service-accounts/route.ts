import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authMiddleware';
import { canManageTeam } from '@/lib/permissions';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';

// Validation schema
const createServiceAccountSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
});

/**
 * GET /api/v1/projects/[slug]/service-accounts
 * List all service accounts for a project
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const session = await requireAuth(req);
        const { slug } = params;

        // Get project and check membership
        const project = await prisma.project.findUnique({
            where: { slug },
            include: {
                members: {
                    where: { userId: session.user.id },
                },
            },
        });

        if (!project) {
            throw new AppError(404, 'Project not found');
        }

        const member = project.members[0];
        if (!member) {
            throw new AppError(403, 'You are not a member of this project');
        }

        // Get all service accounts for this project
        const serviceAccounts = await prisma.serviceAccount.findMany({
            where: { projectId: project.id },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tokens: {
                    select: {
                        id: true,
                        name: true,
                        lastUsedAt: true,
                        expiresAt: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ serviceAccounts });
    } catch (error) {
        return handleApiError(error);
    }
}

/**
 * POST /api/v1/projects/[slug]/service-accounts
 * Create a new service account
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const session = await requireAuth(req);
        const { slug } = params;

        // Parse and validate request body
        const body = await req.json();
        const validatedData = createServiceAccountSchema.parse(body);

        // Get project and check permissions
        const project = await prisma.project.findUnique({
            where: { slug },
            include: {
                members: {
                    where: { userId: session.user.id },
                },
            },
        });

        if (!project) {
            throw new AppError(404, 'Project not found');
        }

        const member = project.members[0];
        if (!member) {
            throw new AppError(403, 'You are not a member of this project');
        }

        // Check if user has permission to manage team
        if (!canManageTeam(member.role)) {
            throw new AppError(
                403,
                'Only owners and admins can create service accounts'
            );
        }

        // Create service account
        const serviceAccount = await prisma.serviceAccount.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                projectId: project.id,
                createdBy: session.user.id,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                tokens: true,
            },
        });

        // Log the creation
        await prisma.auditLog.create({
            data: {
                projectId: project.id,
                userId: session.user.id,
                action: 'service_account.created',
                entityType: 'service_account',
                entityId: serviceAccount.id,
                metadata: {
                    serviceAccountName: serviceAccount.name,
                },
            },
        });

        return NextResponse.json({ serviceAccount }, { status: 201 });
    } catch (error) {
        return handleApiError(error);
    }
}
