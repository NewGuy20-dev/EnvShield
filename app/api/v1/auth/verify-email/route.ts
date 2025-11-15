import { NextRequest, NextResponse } from "next/server";
import { verifyEmailSchema, resendVerificationSchema } from "@/lib/validation";
import { handleApiError, AuthError } from "@/lib/errors";
import prisma from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import { randomInt } from "crypto";
import { enforceRateLimit } from "@/lib/rateLimitHelper";
import { authLimiter } from "@/lib/rateLimit";

const VERIFICATION_EXPIRY_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = verifyEmailSchema.parse(body);

    await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 6,
      windowMs: 15 * 60 * 1000,
      event: "email_verification_attempts",
      severity: "medium",
    });

    const identifier = `email_verification_${data.email.toLowerCase()}`;
    const verification = await prisma.verification.findUnique({
      where: { identifier },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new AuthError("Invalid or expired verification code");
    }

    const isValid = await compare(data.code, verification.value);

    if (!isValid) {
      throw new AuthError("Invalid or expired verification code");
    }

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      await prisma.verification
        .delete({ where: { identifier } })
        .catch(() => undefined);
      throw new AuthError("Invalid or expired verification code");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await prisma.verification.delete({ where: { identifier } });

    return NextResponse.json({ message: "Email verified" });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 60 * 60 * 1000,
      event: "email_verification_resend",
      severity: "medium",
    });

    const body = await req.json();
    const { email } = resendVerificationSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    const responseMessage = "If the account exists, a verification code has been sent.";

    if (!user || user.emailVerified) {
      return NextResponse.json({ message: responseMessage });
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hashedCode = await hash(code, 10);

    await prisma.verification.upsert({
      where: { identifier: `email_verification_${email.toLowerCase()}` },
      update: {
        value: hashedCode,
        expiresAt: new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000),
      },
      create: {
        identifier: `email_verification_${email.toLowerCase()}`,
        value: hashedCode,
        expiresAt: new Date(Date.now() + VERIFICATION_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, code, user.name || undefined);

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    return handleApiError(error);
  }
}
