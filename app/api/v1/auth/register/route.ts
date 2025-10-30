import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { registerSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { handleApiError, ConflictError } from "@/lib/errors";
import { logger } from "@/lib/logger";

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

    // Hash password
    const passwordHash = await hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
    });

    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');

    // TODO: Send verification email

    return NextResponse.json(
      {
        message: "User created. Please verify your email.",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
