import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { handleApiError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { randomInt } from "crypto";
import { hash } from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import {
  acceptInviteForUser,
  clearPendingInviteCookie,
  findInviteByToken,
  getPendingInviteToken,
} from "@/lib/projectInvites";

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

    let pendingInviteToken: string | undefined;

    const body = await req.json();
    const data = registerSchema.parse(body);
    const normalizedName = data.name?.trim() || data.email.split("@")[0];

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const registerResponse = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: normalizedName,
        callbackURL: data.callbackURL,
        rememberMe: data.rememberMe,
      },
      headers: req.headers,
      request: req,
      asResponse: true,
    });

    const result = await registerResponse.json();

    if (!result?.user) {
      throw new ConflictError("Registration failed");
    }

    const user = result.user;

    pendingInviteToken = getPendingInviteToken(req);

    if (pendingInviteToken) {
      try {
        const invite = await findInviteByToken(pendingInviteToken);

        if (invite) {
          await acceptInviteForUser({
            invite,
            userId: user.id,
            userEmail: user.email,
            ip: identifier,
          });
        }
      } catch (inviteError) {
        logger.warn(
          {
            userId: user.id,
            email: user.email,
            inviteToken: pendingInviteToken,
            error:
              inviteError instanceof Error
                ? inviteError.message
                : String(inviteError),
          },
          "Failed to auto-accept invite during registration"
        );
      }
    }

    const verificationCode = randomInt(0, 1_000_000).toString().padStart(6, "0");
    const hashedCode = await hash(verificationCode, 10);

    await prisma.verification.upsert({
      where: { identifier: `email_verification_${user.email.toLowerCase()}` },
      update: {
        value: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      create: {
        identifier: `email_verification_${user.email.toLowerCase()}`,
        value: hashedCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    await sendVerificationEmail(user.email, verificationCode, user.name || undefined);

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    const response = NextResponse.json(
      {
        message: "User created. Please verify your email.",
        user,
        emailVerificationSentPending: true,
      },
      { status: 201 }
    );

    if (pendingInviteToken) {
      clearPendingInviteCookie(response);
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
