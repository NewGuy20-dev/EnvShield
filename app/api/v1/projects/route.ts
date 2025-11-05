import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createProjectSchema } from "@/lib/validation";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { logError } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = auth.user.id;

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
    logError(error as Error, { endpoint: "GET /projects" });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = auth.user.id;

    const body = await req.json();
    const data = createProjectSchema.parse(body);

    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "project";

    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

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
        environments: {
          create: [
            {
              name: "Development",
              slug: "development",
              description: "Development environment for local testing",
            },
            {
              name: "Staging",
              slug: "staging",
              description: "Staging environment for pre-production testing",
            },
            {
              name: "Production",
              slug: "production",
              description: "Production environment for live deployments",
            },
          ],
        },
      },
      include: {
        environments: true,
      },
    });

    return NextResponse.json(
      {
        message: "Project created with 3 default environments",
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
          environments: project.environments.map(env => ({
            id: env.id,
            name: env.name,
            slug: env.slug,
            description: env.description,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { message: "A project with this name already exists. Try a different name." },
        { status: 409 }
      );
    }

    logError(error as Error, { endpoint: "POST /projects" });
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
