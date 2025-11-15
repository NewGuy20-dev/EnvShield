import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { verifyTwoFactorToken, verifyBackupCode, generateRecoveryCode } from "@/lib/twoFactor";
import { authLimiter } from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/rateLimitHelper";

const disableSchema = z.object({
  password: z.string().min(1, "Password required"),
  tokenOrRecovery: z.string().min(1, "TOTP token or recovery code required"),
});

export async function POST(req: NextRequest) {
  try {
    const identifier = await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 15 * 60 * 1000,
      event: "two_factor_disable_rate_limit",
    });

    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const body = await req.json();
    const data = disableSchema.parse(body);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        id: true,
        passwordHash: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
        twoFactorRecoveryCode: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new AuthError("2FA is not enabled for this account");
    }

    // Verify password
    if (!user.passwordHash || !(await compare(data.password, user.passwordHash))) {
      logSecurityEvent("two_factor_disable_failed", "low", {
        userId: auth.user.id,
        reason: "invalid_password",
        ip: identifier,
      });
      throw new AuthError("Invalid password");
    }

    // Verify token, backup code, or recovery code
    let isValid = false;
    if (data.tokenOrRecovery.length === 6 && user.twoFactorSecret) {
      isValid = verifyTwoFactorToken(user.twoFactorSecret, data.tokenOrRecovery);
    }

    if (!isValid && user.twoFactorBackupCodes.length > 0) {
      const { valid, codeIndex } = await verifyBackupCode(data.tokenOrRecovery, user.twoFactorBackupCodes);
      if (valid && codeIndex >= 0) {
        isValid = true;
        const updatedCodes = [...user.twoFactorBackupCodes];
        updatedCodes[codeIndex] = `USED:${new Date().toISOString()}`;
        await prisma.user.update({
          where: { id: auth.user.id },
          data: { twoFactorBackupCodes: updatedCodes },
        });
      }
    }

    if (!isValid && user.twoFactorRecoveryCode) {
      isValid = await compare(data.tokenOrRecovery, user.twoFactorRecoveryCode);
    }

    if (!isValid) {
      logSecurityEvent("two_factor_disable_failed", "low", {
        userId: auth.user.id,
        reason: "invalid_token_or_recovery",
        ip: identifier,
      });
      throw new AuthError("Invalid verification code or recovery code");
    }

    // Generate new recovery code for future use
    const newRecoveryCode = generateRecoveryCode();
    const hashedNewRecoveryCode = await hash(newRecoveryCode, 10);

    // Disable 2FA
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorRecoveryCode: hashedNewRecoveryCode,
        twoFactorUpdatedAt: new Date(),
      },
    });

    logSecurityEvent("two_factor_disabled", "medium", {
      userId: auth.user.id,
      ip: identifier,
    });

    return NextResponse.json({
      status: "disabled",
      message: "2FA has been successfully disabled",
      recoveryCode: newRecoveryCode,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
