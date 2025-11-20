import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAuth } from '@/lib/authMiddleware';
import { canManageTeam } from '@/lib/permissions';
import { AppError, handleApiError } from '@/lib/errors';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Validation schema
const createTokenSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    expiresInDays: z.number().int().min(1).max(365).optional(),
});

/**
 * Generate a secure random token
 */
function generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash token with bcrypt for storage
 */
async function hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
}

/**
 * Create SHA-256 digest for fast lookup
 */
function createTokenDigest(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/v1/projects/[slug]/service-accounts/[id]/tokens
 * Generate a new API token for a service account
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string; id: string } }
) {
    try {
        const session = await requireAuth(req);
        const { slug, id } = params;

        // Parse and validate request body
        const body = await req.json();
        const validatedData = createTokenSchema.parse(body);

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
                'Only owners and admins can create service account tokens'
            );
        }

        // Verify the service account belongs to this project
        const serviceAccount = await prisma.serviceAccount.findUnique({
            where: { id },
        });

        if (!serviceAccount) {
            throw new AppError(404, 'Service account not found');
        }

        if (serviceAccount.projectId !== project.id) {
            throw new AppError(403, 'Service account does not belong to this project');
        }

        // Generate token
        const rawToken = generateToken();
        const tokenHash = await hashToken(rawToken);
        const tokenDigest = createTokenDigest(rawToken);

        // Calculate expiration
        const expiresAt = validatedData.expiresInDays
            ? new Date(Date.now() + validatedData.expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        // Create token in database
        const token = await prisma.apiToken.create({
            data: {
                serviceAccountId: serviceAccount.id,
                tokenDigest,
                tokenHash,
                name: validatedData.name,
                expiresAt,
            },
        });

        // Log the token creation
        await prisma.auditLog.create({
            data: {
                projectId: project.id,
                userId: session.user.id,
                action: 'service_account_token.created',
                entityType: 'api_token',
                entityId: token.id,
                metadata: {
                    serviceAccountId: serviceAccount.id,
                    serviceAccountName: serviceAccount.name,
                    tokenName: token.name || 'Unnamed',
                    expiresAt: token.expiresAt,
                },
            },
        });

        return NextResponse.json(
            {
                token: {
                    id: token.id,
                    name: token.name,
                    expiresAt: token.expiresAt,
                    createdAt: token.createdAt,
                },
                // IMPORTANT: Return the raw token only once
                rawToken: `es_${rawToken}`,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
