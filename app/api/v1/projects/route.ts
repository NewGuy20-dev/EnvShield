import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { jwtVerify } from "jose";

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        environments: true,
        members: true,
      },
    });

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      environmentsCount: p.environments.length,
      variablesCount: 0, // TODO: Calculate
      updatedAt: p.updatedAt,
      role: p.members.find(m => m.userId === userId)?.role,
    }));

    return NextResponse.json({ projects: formattedProjects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createProjectSchema.parse(body);

    // Generate slug
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        members: {
          create: {
            userId,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Project created",
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
