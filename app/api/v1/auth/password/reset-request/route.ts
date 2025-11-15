import { NextRequest, NextResponse } from "next/server";
import { passwordResetRequestSchema } from "@/lib/validation";
import { handleApiError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rateLimitHelper";
import { passwordResetLimiter } from "@/lib/rateLimit";
import prisma from "@/lib/db";
import { createHash, randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";
import { queueSecurityAlert } from "@/lib/securityEvents";

const RESET_EXPIRY_MINUTES = 60;

export async function POST(req: NextRequest) {
  try {
    await enforceRateLimit({
      req,
      limiter: passwordResetLimiter,
      max: 3,
      windowMs: 60 * 60 * 1000,
      event: "password_reset_request",
      severity: "medium",
    });

    const body = await req.json();
    const { email } = passwordResetRequestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenDigest = createHash("sha256").update(token).digest("hex");
      const hashedToken = await hash(token, 12);

      // Remove any existing reset tokens for this user (legacy + new format)
      await prisma.verification.deleteMany({
        where: {
          OR: [
            { identifier: `password_reset_${email.toLowerCase()}` },
            {
              AND: [
                { identifier: { startsWith: "password_reset_" } },
                { value: { contains: `"userId":"${user.id}"` } },
              ],
            },
          ],
        },
      });

      await prisma.verification.upsert({
        where: { identifier: `password_reset_${tokenDigest}` },
        update: {
          value: JSON.stringify({
            hash: hashedToken,
            userId: user.id,
            email: user.email.toLowerCase(),
          }),
          expiresAt: new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000),
        },
        create: {
          identifier: `password_reset_${tokenDigest}`,
          value: JSON.stringify({
            hash: hashedToken,
            userId: user.id,
            email: user.email.toLowerCase(),
          }),
          expiresAt: new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000),
        },
      });

      await sendPasswordResetEmail(email, token, user.name || undefined);

      await queueSecurityAlert({
        userId: user.id,
        type: "password_reset",
        metadata: {
          ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    }

    return NextResponse.json({ message: "If the email exists, a reset link has been sent." });
  } catch (error) {
    return handleApiError(error);
  }
}
