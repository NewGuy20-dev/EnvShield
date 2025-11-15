import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { handleApiError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per 15 minutes)
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, authLimiter, 5, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Too many registration attempts',
          message: 'Please try again later',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900',
          },
        }
      );
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        callbackURL: data.callbackURL,
        rememberMe: data.rememberMe,
      },
      headers: req.headers,
      request: req,
    });

    if (result.error) {
      throw new ConflictError(result.error.message || "Registration failed");
    }

    const verificationCode = randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
    const hashedCode = await hash(verificationCode, 10);

    await prisma.verification.upsert({
      where: { identifier: `email_verification_${result.data.user.email.toLowerCase()}` },
      update: {
        value: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      create: {
        identifier: `email_verification_${result.data.user.email.toLowerCase()}`,
        value: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendVerificationEmail(result.data.user.email, verificationCode, result.data.user.name || undefined);

    logger.info({ userId: result.data.user.id, email: result.data.user.email }, 'User registered successfully');

    return NextResponse.json(
      {
        message: "User created. Please verify your email.",
        user: result.data.user,
        emailVerificationSentPending: true,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
