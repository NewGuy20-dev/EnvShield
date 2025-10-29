import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";

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
    console.error("Get tokens error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const userId = auth.user.id;

    const body = await req.json();
    const tokenName = body.name || "API Token";

    // Generate token
    const tokenPlain = "esh_" + crypto.randomBytes(24).toString("hex");
    const tokenHash = await hash(tokenPlain, 12);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const token = await prisma.apiToken.create({
      data: {
        userId,
        token: tokenHash,
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
    console.error("Create token error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
