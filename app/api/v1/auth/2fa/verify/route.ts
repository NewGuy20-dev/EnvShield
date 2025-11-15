import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { verifyTwoFactorToken, isValidTotpFormat } from "@/lib/twoFactor";
import { authLimiter } from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/rateLimitHelper";

const verifySchema = z.object({
  token: z.string().length(6, "Token must be 6 digits"),
});

export async function POST(req: NextRequest) {
  try {
    const identifier = await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 15 * 60 * 1000,
      event: "two_factor_verify_rate_limit",
    });

    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const body = await req.json();
    const data = verifySchema.parse(body);

    // Validate token format
    if (!isValidTotpFormat(data.token)) {
      throw new AuthError("Invalid token format");
    }

    // Get user with 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new AuthError("2FA not set up for this account");
    }

    if (user.twoFactorEnabled) {
      throw new AuthError("2FA is already enabled");
    }

    // Verify token
    const isValid = verifyTwoFactorToken(user.twoFactorSecret, data.token);
    if (!isValid) {
      logSecurityEvent("two_factor_verify_failed", "low", {
        userId: auth.user.id,
        reason: "invalid_token",
        ip: identifier,
      });
      throw new AuthError("Invalid verification code");
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorUpdatedAt: new Date(),
      },
    });

    logSecurityEvent("two_factor_enabled", "medium", {
      userId: auth.user.id,
      ip: identifier,
    });

    return NextResponse.json({
      status: "verified",
      message: "2FA has been successfully enabled",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
