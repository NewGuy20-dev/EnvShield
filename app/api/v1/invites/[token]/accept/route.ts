import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { getClientIdentifier } from "@/lib/rateLimit";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const identifier = getClientIdentifier(req);

    // Find the invite
    const invite = await prisma.projectInvite.findUnique({
      where: { token: params.token },
      include: { project: true },
    });

    if (!invite) {
      logSecurityEvent("invite_accept_invalid_token", "low", {
        userId: auth.user.id,
        ip: identifier,
      });
      throw new AuthError("Invalid or expired invite");
    }

    // Check if invite has expired
    if (invite.expiresAt < new Date()) {
      throw new AuthError("Invite has expired");
    }

    // Check if email matches
    if (invite.email !== auth.user.email) {
      logSecurityEvent("invite_accept_email_mismatch", "medium", {
        userId: auth.user.id,
        inviteEmail: invite.email,
        userEmail: auth.user.email,
        ip: identifier,
      });
      throw new AuthError("This invite is for a different email address");
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: auth.user.id,
        },
      },
    });

    if (existingMember) {
      throw new AuthError("You are already a member of this project");
    }

    // Add user to project
    const projectMember = await prisma.projectMember.create({
      data: {
        projectId: invite.projectId,
        userId: auth.user.id,
        role: invite.role,
      },
    });

    // Delete the invite
    await prisma.projectInvite.delete({
      where: { id: invite.id },
    });

    logSecurityEvent("invite_accepted", "low", {
      userId: auth.user.id,
      projectId: invite.projectId,
      role: invite.role,
      ip: identifier,
    });

    logger.info(
      { userId: auth.user.id, projectId: invite.projectId, role: invite.role },
      "Project invite accepted"
    );

    return NextResponse.json({
      status: "success",
      message: "Invite accepted successfully",
      project: {
        id: invite.project.id,
        name: invite.project.name,
        slug: invite.project.slug,
      },
      role: projectMember.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
