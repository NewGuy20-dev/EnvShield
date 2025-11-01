import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { SignJWT } from "jose";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import { jwtSecretBuffer } from "@/lib/config";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per 15 minutes)
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, authLimiter, 5, 15 * 60 * 1000);
    
    if (!rateLimitResult.success) {
      logSecurityEvent('rate_limit_exceeded', 'medium', {
        identifier,
        endpoint: '/api/v1/auth/login',
      });
      
      return new Response(
        JSON.stringify({
          error: 'Too many login attempts',
          message: 'Please try again later',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '900', // 15 minutes
          },
        }
      );
    }

    const body = await req.json();
    logger.info({ email: body.email }, 'Login attempt');
    const data = loginSchema.parse(body);

    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { mode: "insensitive", equals: data.email } },
    });

    if (!user) {
      logSecurityEvent('failed_login', 'low', {
        email: data.email,
        reason: 'user_not_found',
        ip: identifier,
      });
      throw new AuthError("Invalid email or password");
    }

    // Verify password
    const passwordMatch = await compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      logSecurityEvent('failed_login', 'low', {
        email: data.email,
        userId: user.id,
        reason: 'invalid_password',
        ip: identifier,
      });
      throw new AuthError("Invalid email or password");
    }

    // Create JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(jwtSecretBuffer);

    logger.info({ userId: user.id, email: user.email }, 'Login successful');

    // Set HTTP-only cookie
    const response = NextResponse.json(
      {
        message: "Logged in successfully",
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
