import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/db";
import { jwtSecretBuffer } from "@/lib/config";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const verified = await jwtVerify(token, jwtSecretBuffer);
    const userId = verified.payload.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    logError(error as Error, { endpoint: "GET /session" });
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
