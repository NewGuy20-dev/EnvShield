import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createEnvironmentSchema = z.object({
  name: z.string().min(1, "Environment name is required"),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const environments = await prisma.environment.findMany({
      where: {
        project: {
          slug: params.slug,
          members: { some: { userId: auth.user.id } },
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
    logger.error({ error }, "Get environments error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const body = await req.json();
    
    // Validate input
    const validatedData = createEnvironmentSchema.parse(body);

    // Check if project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        slug: params.slug,
        members: { some: { userId: auth.user.id } },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    // Check if user has permission to create environments (OWNER, ADMIN, or DEVELOPER)
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: project.id,
        userId: auth.user.id,
        role: { in: ["OWNER", "ADMIN", "DEVELOPER"] },
      },
    });

    if (!member) {
      return NextResponse.json({ 
        message: "Insufficient permissions. Only owners, admins, and developers can create environments." 
      }, { status: 403 });
    }

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check for duplicate slug within project
    const existingEnv = await prisma.environment.findFirst({
      where: {
        projectId: project.id,
        slug: slug,
      },
    });

    if (existingEnv) {
      return NextResponse.json({ 
        message: "An environment with this name already exists in this project" 
      }, { status: 409 });
    }

    // Create environment
    const environment = await prisma.environment.create({
      data: {
        name: validatedData.name,
        slug: slug,
        description: validatedData.description || null,
        projectId: project.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: "environment.created",
        entityType: "environment",
        entityId: environment.id,
        metadata: {
          environmentName: environment.name,
          environmentSlug: environment.slug,
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
      },
    });

    logger.info({ 
      environmentId: environment.id, 
      projectId: project.id,
      userId: auth.user.id 
    }, "Environment created");

    return NextResponse.json({
      message: "Environment created successfully",
      ...environment,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        message: "Validation error",
        errors: error.issues 
      }, { status: 400 });
    }
    
    logger.error({ error }, "Create environment error");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
