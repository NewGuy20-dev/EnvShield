import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import { getClientIdentifier } from "@/lib/rateLimit";
import {
  acceptInviteForUser,
  clearPendingInviteCookie,
  findInviteByToken,
  setPendingInviteCookie,
} from "@/lib/projectInvites";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const identifier = getClientIdentifier(req);

    const invite = await findInviteByToken(params.token);

    if (!invite) {
      throw new AuthError("Invalid or expired invite");
    }

    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      const redirectUrl = new URL(`/register?invite=${params.token}`, req.url);
      const response = NextResponse.redirect(redirectUrl);
      setPendingInviteCookie(response, params.token);
      return response;
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

    const { project, member } = await acceptInviteForUser({
      invite,
      userId: auth.user.id,
      userEmail: auth.user.email,
      ip: identifier,
    });

    const response = NextResponse.json({
      status: "success",
      message: "Invite accepted successfully",
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      role: member.role,
    });
    clearPendingInviteCookie(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
