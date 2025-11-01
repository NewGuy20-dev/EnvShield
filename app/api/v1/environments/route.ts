import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { z } from "zod";
import { canManageEnvironments } from "@/lib/permissions";
import { PermissionError, handleApiError } from "@/lib/errors";

const createEnvironmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ message: "Project ID required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
      },
    });

    const member = project?.members[0];
    if (!project || !member) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = createEnvironmentSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
      },
    });

    const member = project?.members[0];
    if (!project || !member) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!canManageEnvironments(member.role)) {
      throw new PermissionError("You do not have permission to create environments");
    }

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

    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: "ENVIRONMENT_CREATED",
        entityType: "ENVIRONMENT",
        entityId: environment.id,
        metadata: {
          name: environment.name,
          slug: environment.slug,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
        userAgent: req.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({ environment }, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Create environment error:", error);
    return handleApiError(error);
  }
}
