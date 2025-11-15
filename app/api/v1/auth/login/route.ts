import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { authLimiter } from "@/lib/rateLimit";
import { enforceRateLimit } from "@/lib/rateLimitHelper";
import { handleApiError, AuthError } from "@/lib/errors";
import { logger, logSecurityEvent } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { extractSetCookies } from "@/lib/cookies";
import prisma from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting (5 attempts per 15 minutes)
    const identifier = await enforceRateLimit({
      req,
      limiter: authLimiter,
      max: 5,
      windowMs: 15 * 60 * 1000,
      event: 'login_rate_limit_exceeded',
    });

    const body = await req.json();
    logger.info({ email: body.email }, 'Login attempt');
    const data = loginSchema.parse(body);

    try {
      const betterAuthResponse = await auth.api.signInEmail({
        body: {
          email: data.email,
          password: data.password,
          rememberMe: data.rememberMe,
        },
        headers: req.headers,
        request: req,
        asResponse: true,
        returnHeaders: true,
      });

      const setCookies = extractSetCookies(betterAuthResponse.headers);
      const result = betterAuthResponse.response;

      if (!result) {
        throw new AuthError("Invalid email or password");
      }

      const user = result.user;

      if (!user) {
        throw new AuthError("Invalid email or password");
      }

      // Check if user has 2FA enabled
      const userWithTwoFactor = await prisma.user.findUnique({
        where: { id: user.id },
        select: { twoFactorEnabled: true },
      });

      if (userWithTwoFactor?.twoFactorEnabled) {
        // Create pending session token
        const pendingSessionToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Store pending session
        await prisma.verification.create({
          data: {
            identifier: `pending_session_${pendingSessionToken}`,
            value: JSON.stringify({
              userId: user.id,
              sessionToken: result.token,
            }),
            expiresAt,
          },
        });

        logSecurityEvent('login_2fa_required', 'low', {
          userId: user.id,
          email: user.email,
          ip: identifier,
        });

        return NextResponse.json(
          {
            twoFactorRequired: true,
            pendingSessionToken,
            message: "2FA verification required",
          },
          { status: 202 }
        );
      }

      logger.info({ userId: user.id, email: user.email }, 'Login successful');

      const responseWithCookies = new NextResponse(
        JSON.stringify({
          message: "Logged in successfully",
          user,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setCookies.forEach((cookie) => {
        responseWithCookies.headers.append('Set-Cookie', cookie);
      });

      return responseWithCookies;
    } catch (err) {
      logSecurityEvent('failed_login', 'low', {
        email: data.email,
        reason: err instanceof Error ? err.message : 'unknown',
        ip: identifier,
      });
      throw new AuthError("Invalid email or password");
    }
  } catch (error) {
    return handleApiError(error);
  }
}
