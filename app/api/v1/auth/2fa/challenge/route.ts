import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError, AuthError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { verifyTwoFactorToken, verifyBackupCode } from "@/lib/twoFactor";
import { authLimiter } from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/rateLimitHelper";

const challengeSchema = z.object({
  pendingSessionToken: z.string().min(1, "Pending session token required"),
  token: z.string().optional(),
  backupCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const identifier = await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 5 * 60 * 1000,
      event: "two_factor_challenge_rate_limit",
    });

    const body = await req.json();
    const data = challengeSchema.parse(body);

    // Retrieve pending session from Verification table (using identifier as the token)
    const verification = await prisma.verification.findUnique({
      where: { identifier: `pending_session_${data.pendingSessionToken}` },
    });

    if (!verification) {
      logSecurityEvent("two_factor_challenge_failed", "low", {
        reason: "invalid_pending_token",
        ip: identifier,
      });
      throw new AuthError("Invalid or expired pending session");
    }

    // Check expiry (5 minutes)
    const now = new Date();
    if (now > verification.expiresAt) {
      await prisma.verification.delete({ where: { id: verification.id } });
      throw new AuthError("Pending session expired");
    }

    // Parse pending session data from value field
    let pendingData;
    try {
      pendingData = JSON.parse(verification.value || "{}");
    } catch {
      throw new AuthError("Invalid pending session data");
    }

    const userId = pendingData.userId as string;
    if (!userId) {
      throw new AuthError("Invalid pending session");
    }

    // Get user with 2FA info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new AuthError("2FA not enabled for this user");
    }

    // Verify TOTP or backup code
    let isValid = false;
    if (data.token && data.token.length === 6 && user.twoFactorSecret) {
      isValid = verifyTwoFactorToken(user.twoFactorSecret, data.token);
    } else if (data.backupCode && user.twoFactorBackupCodes.length > 0) {
      const { valid, codeIndex } = await verifyBackupCode(data.backupCode, user.twoFactorBackupCodes);
      if (valid && codeIndex >= 0) {
        isValid = true;
        const updatedCodes = [...user.twoFactorBackupCodes];
        updatedCodes[codeIndex] = `USED:${new Date().toISOString()}`;
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: updatedCodes },
        });
      }
    }

    if (!isValid) {
      logSecurityEvent("two_factor_challenge_failed", "low", {
        userId,
        reason: "invalid_code",
        ip: identifier,
      });
      throw new AuthError("Invalid verification code or backup code");
    }

    // Clean up pending session
    await prisma.verification.delete({ where: { id: verification.id } });

    logSecurityEvent("two_factor_challenge_success", "low", {
      userId,
      ip: identifier,
    });

    // Return the pending session data (e.g., Better Auth session token) so client can finalize login
    return NextResponse.json({
      status: "verified",
      message: "2FA challenge passed",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
