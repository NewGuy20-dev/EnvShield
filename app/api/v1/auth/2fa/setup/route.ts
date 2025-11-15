import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError, AuthError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { generateTwoFactorSecret, generateBackupCodes, hashBackupCodes, generateRecoveryCode } from "@/lib/twoFactor";
import { authLimiter } from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/rateLimitHelper";

const setupSchema = z.object({
  passwordConfirmation: z.string().min(1, "Password confirmation required"),
});

export async function POST(req: NextRequest) {
  try {
    const identifier = await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 15 * 60 * 1000,
      event: "two_factor_setup_rate_limit",
    });

    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const body = await req.json();
    const data = setupSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, passwordHash: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    if (!user.passwordHash) {
      throw new AuthError("Password authentication required to enable 2FA");
    }

    const { compare } = await import("bcryptjs");
    const isPasswordValid = await compare(data.passwordConfirmation, user.passwordHash);
    if (!isPasswordValid) {
      logSecurityEvent("two_factor_setup_failed", "low", {
        userId: auth.user.id,
        reason: "invalid_password",
      });
      throw new AuthError("Invalid password");
    }

    if (user.twoFactorEnabled) {
      throw new AuthError("2FA is already enabled for this account");
    }

    const secret = await generateTwoFactorSecret(auth.user.email);
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);
    const recoveryCode = generateRecoveryCode();
    const hashedRecoveryCode = await hash(recoveryCode, 10);

    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        twoFactorSecret: secret.secret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorRecoveryCode: hashedRecoveryCode,
      },
    });

    logSecurityEvent("two_factor_setup_initiated", "medium", {
      userId: auth.user.id,
      ip: identifier,
    });

    return NextResponse.json({
      qrCodeUrl: secret.qrCodeUrl,
      backupCodes,
      recoveryCode,
      message: "2FA setup initiated. Scan the QR code and verify with your authenticator app.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
