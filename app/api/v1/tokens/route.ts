import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { applyRateLimit, authLimiter, getClientIdentifier } from "@/lib/rateLimit";
import { MAX_API_TOKENS_PER_USER } from "@/lib/constants";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = auth.user.id;

    const tokens = await prisma.apiToken.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    logError(error as Error, { endpoint: "GET /tokens" });
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(identifier, authLimiter, 5, 15 * 60 * 1000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "token_rate_limited",
          message: "Too many token creation attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "900",
          },
        }
      );
    }

    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = auth.user.id;

    const body = await req.json();
    const tokenName = body.name || "API Token";

    const activeTokens = await prisma.apiToken.count({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (activeTokens >= MAX_API_TOKENS_PER_USER) {
      return NextResponse.json(
        {
          error: "token_limit_reached",
          message: `You already have ${MAX_API_TOKENS_PER_USER} active tokens. Revoke an existing token before creating a new one.`,
        },
        { status: 429 }
      );
    }

    // Generate token
    const tokenPlain = "esh_" + crypto.randomBytes(24).toString("hex");
    const tokenHash = await hash(tokenPlain, 12);
    const tokenDigest = crypto.createHash("sha256").update(tokenPlain).digest("hex");

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const token = await prisma.apiToken.create({
      data: {
        userId,
        token: tokenHash,
        tokenDigest,
        name: tokenName,
        expiresAt,
      },
    });

    return NextResponse.json(
      {
        token: tokenPlain,
        message: "Save this token, you won't see it again",
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error as Error, { endpoint: "POST /tokens" });
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
