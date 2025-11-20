import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authMiddleware';
import { canManageTeam } from '@/lib/permissions';
import { AppError, handleApiError } from '@/lib/errors';

/**
 * DELETE /api/v1/projects/[slug]/service-accounts/[id]
 * Delete a service account and all its tokens
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { slug: string; id: string } }
) {
    try {
        const session = await requireAuth(req);
        const { slug, id } = params;

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

        if (!canManageTeam(member.role)) {
            throw new AppError(
                403,
                'Only owners and admins can delete service accounts'
            );
        }

        // Verify the service account belongs to this project
        const serviceAccount = await prisma.serviceAccount.findUnique({
            where: { id },
            include: {
                tokens: true,
            },
        });

        if (!serviceAccount) {
            throw new AppError(404, 'Service account not found');
        }

        if (serviceAccount.projectId !== project.id) {
            throw new AppError(403, 'Service account does not belong to this project');
        }

        // Delete the service account (tokens will cascade delete)
        await prisma.serviceAccount.delete({
            where: { id },
        });

        // Log the deletion
        await prisma.auditLog.create({
            data: {
                projectId: project.id,
                userId: session.user.id,
                action: 'service_account.deleted',
                entityType: 'service_account',
                entityId: id,
                metadata: {
                    serviceAccountName: serviceAccount.name,
                    tokensDeleted: serviceAccount.tokens.length,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
