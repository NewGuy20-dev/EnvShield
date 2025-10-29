import { NextRequest, NextResponse } from "next/server";
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

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userId = await getUserFromRequest(req);
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

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
