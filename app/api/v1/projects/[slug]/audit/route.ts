import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";

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
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const logs = await prisma.auditLog.findMany({
      where: { projectId: project.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      user: { name: log.user.name, email: log.user.email },
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
    }));

    return NextResponse.json({ logs: formatted });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
