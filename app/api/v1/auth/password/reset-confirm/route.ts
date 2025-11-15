import { NextRequest, NextResponse } from "next/server";
import { passwordResetConfirmSchema } from "@/lib/validation";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { queueSecurityAlert } from "@/lib/securityEvents";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";

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

    // Find verification record by token (stored as identifier with prefix)
    const verification = await prisma.verification.findUnique({
      where: { identifier: `password_reset_${token}` },
    });

    if (!verification) {
      logSecurityEvent("password_reset_invalid_token", "low", {
        ip: identifier,
      });
      throw new AuthError("Invalid or expired reset token");
    }

    // Check if token has expired (24 hours)
    const now = new Date();
    if (now > verification.expiresAt) {
      await prisma.verification.delete({ where: { id: verification.id } });
      throw new AuthError("Reset token has expired");
    }

    // Parse the verification data to get userId
    let verificationData;
    try {
      verificationData = JSON.parse(verification.value);
    } catch {
      throw new AuthError("Invalid reset token data");
    }

    const userId = verificationData.userId as string;
    if (!userId) {
      throw new AuthError("Invalid reset token");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      throw new AuthError("User not found");
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
    });

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
