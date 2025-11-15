import { NextRequest, NextResponse } from "next/server";
import { passwordResetConfirmSchema } from "@/lib/validation";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { createHash } from "crypto";
import { queueSecurityAlert } from "@/lib/securityEvents";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import type { Verification } from "@prisma/client";

const RESET_IDENTIFIER_PREFIX = "password_reset_";

type ResetPayload = {
  hashedToken: string;
  userId?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  try {
    // Rate limit password reset confirmations
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, authLimiter, 5, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Too many password reset attempts",
          message: "Please try again later",
        }),
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await req.json();
    const { token, password } = passwordResetConfirmSchema.parse(body);

    const match = await findResetVerificationByToken(token);

    if (!match) {
      logSecurityEvent("password_reset_invalid_token", "low", {
        ip: identifier,
      });
      throw new AuthError("Invalid or expired reset token");
    }

    const { verification, payload } = match;

    // Check if token has expired (24 hours)
    const now = new Date();
    if (now > verification.expiresAt) {
      await prisma.verification
        .delete({ where: { id: verification.id } })
        .catch(() => undefined);
      throw new AuthError("Reset token has expired");
    }

    let userId = payload.userId;
    let user: { id: string; email: string; name: string | null } | null = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });
    } else if (payload.email) {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true, name: true },
      });
      if (user) {
        userId = user.id;
      }
    }

    if (!user || !userId) {
      await prisma.verification
        .delete({ where: { id: verification.id } })
        .catch(() => undefined);
      logSecurityEvent("password_reset_invalid_token", "low", {
        ip: identifier,
        reason: "user_not_found",
      });
      throw new AuthError("Invalid or expired reset token");
    }

    // Update password via Better Auth (if available) or directly
    const hashedPassword = await hash(password, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // Revoke all existing sessions for this user (force re-login)
    await prisma.session.deleteMany({
      where: { userId },
    });

    // Delete the verification token
    await prisma.verification.delete({
      where: { id: verification.id },
    }).catch(() => undefined);

    // Queue security alert
    await queueSecurityAlert({
      userId,
      type: "password_reset_success",
      metadata: {
        ip: identifier,
      },
    });

    logSecurityEvent("password_reset_success", "medium", {
      userId,
      email: user.email,
      ip: identifier,
    });

    logger.info({ userId, email: user.email }, "Password reset successful");

    return NextResponse.json({
      status: "success",
      message: "Password has been reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function extractEmailFromIdentifier(identifier: string): string | undefined {
  if (!identifier.startsWith(RESET_IDENTIFIER_PREFIX)) {
    return undefined;
  }

  const value = identifier.slice(RESET_IDENTIFIER_PREFIX.length);
  return value.includes("@") ? value : undefined;
}

function parseResetPayload(record: Verification): ResetPayload | null {
  const raw = record.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const hashedToken =
        typeof parsed.hash === "string"
          ? parsed.hash
          : typeof parsed.hashedToken === "string"
          ? parsed.hashedToken
          : undefined;

      if (!hashedToken) {
        return null;
      }

      const payload: ResetPayload = { hashedToken };

      if (typeof parsed.userId === "string") {
        payload.userId = parsed.userId;
      }

      if (typeof parsed.email === "string") {
        payload.email = parsed.email;
      }

      return payload;
    }
  } catch {
    // Legacy format falls through to bcrypt string
  }

  const payload: ResetPayload = { hashedToken: raw };
  const legacyEmail = extractEmailFromIdentifier(record.identifier);

  if (legacyEmail) {
    payload.email = legacyEmail;
  }

  return payload;
}

async function findResetVerificationByToken(
  token: string
): Promise<{ verification: Verification; payload: ResetPayload } | null> {
  const tokenDigest = createHash("sha256").update(token).digest("hex");
  const identifier = `${RESET_IDENTIFIER_PREFIX}${tokenDigest}`;

  const direct = await prisma.verification.findUnique({
    where: { identifier },
  });

  if (direct) {
    const payload = parseResetPayload(direct);
    if (payload) {
      try {
        const matches = await compare(token, payload.hashedToken);
        if (matches) {
          return { verification: direct, payload };
        }
      } catch {
        // ignore invalid hash strings
      }
    }
  }

  const candidates = await prisma.verification.findMany({
    where: {
      identifier: { startsWith: RESET_IDENTIFIER_PREFIX },
    },
  });

  for (const candidate of candidates) {
    if (direct && candidate.id === direct.id) {
      continue;
    }

    const payload = parseResetPayload(candidate);
    if (!payload) {
      continue;
    }

    try {
      const matches = await compare(token, payload.hashedToken);
      if (matches) {
        return { verification: candidate, payload };
      }
    } catch {
      continue;
    }
  }

  return null;
}
