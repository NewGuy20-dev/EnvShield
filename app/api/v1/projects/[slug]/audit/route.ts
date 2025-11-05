import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { canManageProject } from "@/lib/permissions";
import { PermissionError } from "@/lib/errors";
import { Role } from "@prisma/client";
import { logError } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const params = await context.params;
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
      },
    });

    const member = project?.members[0];
    if (!project || !member) {
      throw new PermissionError("You are not a member of this project");
    }

    if (!canManageProject(member.role)) {
      throw new PermissionError("You do not have permission to view audit logs");
    }

    const logs = await prisma.auditLog.findMany({
      where: { projectId: project.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const includeIp = member.role === Role.OWNER;
    const formatted = logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      user: { name: log.user.name, email: log.user.email },
      createdAt: log.createdAt,
      metadata: log.metadata,
      ipAddress: includeIp ? log.ipAddress : undefined,
    }));

    return NextResponse.json({ logs: formatted, canViewIp: includeIp });
  } catch (error) {
    logError(error as Error, { endpoint: 'GET /projects/[slug]/audit' });
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
