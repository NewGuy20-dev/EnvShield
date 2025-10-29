import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { canDeleteProject, canManageEnvironments } from "@/lib/permissions";

const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        environments: true,
        members: {
          where: { userId: auth.user.id },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const member = project.members[0];
    if (!member) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Count total variables across all environments
    const variablesCount = await prisma.variable.count({
      where: {
        environment: {
          projectId: project.id,
        },
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        environmentsCount: project.environments.length,
        membersCount: project._count.members,
        variablesCount,
        createdAt: project.createdAt,
        role: member.role,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    // Find project and check membership
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const member = project.members[0];
    if (!member) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Check permissions - only OWNER and ADMIN can edit
    if (!canManageEnvironments(member.role)) {
      return NextResponse.json(
        { message: "You don't have permission to edit this project" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    // If name is being changed, regenerate slug
    const updateData: { name?: string; slug?: string; description?: string | null } = {};
    if (data.name) {
      const baseSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "project";

      let slug = baseSlug;
      let suffix = 1;

      // Check if slug is already taken by another project
      while (true) {
        const existing = await prisma.project.findUnique({ where: { slug } });
        if (!existing || existing.id === project.id) {
          break;
        }
        slug = `${baseSlug}-${suffix++}`;
      }

      updateData.name = data.name;
      updateData.slug = slug;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: auth.user.id,
        action: "PROJECT_UPDATED",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: {
          changes: data,
        },
      },
    });

    return NextResponse.json({
      message: "Project updated successfully",
      project: {
        id: updatedProject.id,
        name: updatedProject.name,
        slug: updatedProject.slug,
        description: updatedProject.description,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Update project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    // Find project and check membership
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
        environments: {
          include: {
            variables: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const member = project.members[0];
    if (!member) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Check permissions - only OWNER can delete
    if (!canDeleteProject(member.role)) {
      return NextResponse.json(
        { message: "Only project owners can delete projects" },
        { status: 403 }
      );
    }

    // Delete in correct order due to foreign key constraints
    // 1. Delete all variable history entries
    await prisma.variableHistory.deleteMany({
      where: {
        variable: {
          environment: {
            projectId: project.id,
          },
        },
      },
    });

    // 2. Delete all variables
    await prisma.variable.deleteMany({
      where: {
        environment: {
          projectId: project.id,
        },
      },
    });

    // 3. Delete all environments
    await prisma.environment.deleteMany({
      where: { projectId: project.id },
    });

    // 4. Delete all audit logs
    await prisma.auditLog.deleteMany({
      where: { projectId: project.id },
    });

    // 5. Delete all project members
    await prisma.projectMember.deleteMany({
      where: { projectId: project.id },
    });

    // 6. Finally, delete the project
    await prisma.project.delete({
      where: { id: project.id },
    });

    return NextResponse.json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
