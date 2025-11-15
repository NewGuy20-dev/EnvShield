import { createHash } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import prisma from "./db";
import { AuthError } from "./errors";
import { logSecurityEvent, logger } from "./logger";

export async function findInviteByToken(token: string) {
  const tokenDigest = createHash("sha256").update(token).digest("hex");

  let invite = await prisma.projectInvite.findUnique({
    where: { token: tokenDigest },
    include: { project: true },
  });

  if (!invite) {
    invite = await prisma.projectInvite.findUnique({
      where: { token },
      include: { project: true },
    });
  }

  return invite;
}

interface AcceptInviteParams {
  invite: NonNullable<Awaited<ReturnType<typeof findInviteByToken>>>;
  userId: string;
  userEmail: string;
  ip?: string;
}

export async function acceptInviteForUser({ invite, userId, userEmail, ip }: AcceptInviteParams) {
  if (invite.expiresAt < new Date()) {
    throw new AuthError("Invite has expired");
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new AuthError("This invite is for a different email address");
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: invite.projectId,
        userId,
      },
    },
  });

  if (existingMember) {
    throw new AuthError("You are already a member of this project");
  }

  const projectMember = await prisma.projectMember.create({
    data: {
      projectId: invite.projectId,
      userId,
      role: invite.role,
    },
  });

  await prisma.projectInvite.delete({ where: { id: invite.id } });

  logSecurityEvent("invite_accepted", "low", {
    userId,
    projectId: invite.projectId,
    role: invite.role,
    ip,
  });

  logger.info(
    { userId, projectId: invite.projectId, role: invite.role },
    "Project invite accepted"
  );

  return {
    project: invite.project,
    member: projectMember,
  };
}

export const PENDING_INVITE_COOKIE = "envshield_pending_invite";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setPendingInviteCookie(response: NextResponse, token: string) {
  response.cookies.set(PENDING_INVITE_COOKIE, token, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearPendingInviteCookie(response: NextResponse) {
  response.cookies.set(PENDING_INVITE_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}

export function getPendingInviteToken(req: NextRequest): string | undefined {
  return req.cookies.get(PENDING_INVITE_COOKIE)?.value;
}
