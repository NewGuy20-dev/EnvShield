import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import prisma from "@/lib/db";
import { handleApiError, AuthError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new AuthError("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorUpdatedAt: true,
      },
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    const pending = Boolean(user.twoFactorSecret && !user.twoFactorEnabled);

    return NextResponse.json({
      enabled: Boolean(user.twoFactorEnabled),
      pending,
      updatedAt: user.twoFactorUpdatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
