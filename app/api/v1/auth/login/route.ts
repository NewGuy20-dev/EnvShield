import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { z } from "zod";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

export async function POST(req: NextRequest) {
  try {
    console.log("🔐 Login attempt received");
    const body = await req.json();
    console.log("📧 Request body:", { email: body.email });
    const data = loginSchema.parse(body);

    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { mode: "insensitive", equals: data.email } },
    });

    if (!user) {
      console.log("❌ User not found:", data.email);
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    console.log("✅ User found:", user.id);

    // Verify password
    const passwordMatch = await compare(data.password, user.passwordHash);
    console.log("🔑 Password match:", passwordMatch);
    if (!passwordMatch) {
      console.log("❌ Password mismatch");
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create JWT token
    console.log("🔐 JWT_SECRET loaded:", JWT_SECRET.substring(0, 20) + "...");
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);
    console.log("✅ Token created successfully");

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
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
