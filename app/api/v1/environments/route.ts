import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { jwtVerify } from "jose";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const secret = new TextEncoder().encode(JWT_SECRET);

const createEnvironmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
});

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ message: "Project ID required" }, { status: 400 });
    }

    const environments = await prisma.environment.findMany({
      where: { projectId },
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

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createEnvironmentSchema.parse(body);

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const environment = await prisma.environment.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        slug,
        description: data.description,
      },
    });

    return NextResponse.json({ environment }, { status: 201 });
  } catch (error) {
    console.error("Create environment error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
