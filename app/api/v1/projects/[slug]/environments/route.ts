import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { jwtVerify } from "jose";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload.id as string;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const environments = await prisma.environment.findMany({
      where: {
        project: {
          slug: params.slug,
          members: { some: { userId } },
        },
      },
      include: { variables: true },
    });

    const formatted = environments.map(e => ({
      id: e.id,
      name: e.name,
      slug: e.slug,
      description: e.description,
      variablesCount: e.variables.length,
    }));

    return NextResponse.json({ environments: formatted });
  } catch (error) {
    console.error("Get environments error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
