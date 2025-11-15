import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError, PermissionError, NotFoundError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { sendProjectInviteEmail } from "@/lib/email";
import { createHash, randomBytes } from "crypto";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["OWNER", "ADMIN", "DEVELOPER", "VIEWER"]).default("DEVELOPER"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Rate limit invites
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, authLimiter, 10, 60 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Too many invites",
          message: "Please try again later",
        }),
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    const params = await context.params;

    // Resolve project by slug
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    const projectId = project.id;

    // Check if user is admin/owner of the project
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: auth.user.id,
        },
      },
    });

    if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
      throw new PermissionError("You don't have permission to invite members");
    }

    // Check if user already exists in project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new AuthError("User is already a member of this project");
    }

    // Check if invite already exists
    const existingInvite = await prisma.projectInvite.findUnique({
      where: {
        projectId_email: {
          projectId,
          email,
        },
      },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new AuthError("An active invite already exists for this email");
    }

    // Generate invite token
    const token = randomBytes(32).toString("hex");
    const tokenDigest = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite
    const invite = await prisma.projectInvite.create({
      data: {
        projectId,
        email,
        role,
        token: tokenDigest,
        expiresAt,
        createdBy: auth.user.id,
      },
      include: {
        project: true,
      },
    });

    // Send invite email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invites/${token}`;
    await sendProjectInviteEmail(
      email,
      auth.user.name || auth.user.email,
      invite.project.name,
      role,
      inviteUrl
    );

    logSecurityEvent("project_invite_sent", "low", {
      userId: auth.user.id,
      projectId,
      invitedEmail: email,
      role,
      ip: identifier,
    });

    logger.info(
      { userId: auth.user.id, projectId, email },
      "Project invite sent"
    );

    return NextResponse.json({
      status: "success",
      message: "Invite sent successfully",
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const params = await context.params;

    // Resolve project by slug
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    const projectId = project.id;

    // Check if user is member of the project
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: auth.user.id,
        },
      },
    });

    if (!member) {
      throw new PermissionError("You don't have access to this project");
    }

    // Get all active invites for the project
    const invites = await prisma.projectInvite.findMany({
      where: {
        projectId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      invites,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
