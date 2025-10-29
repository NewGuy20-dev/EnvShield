import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const verified = await jwtVerify(token, secret);
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
    console.error("Session error:", error);
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
}
