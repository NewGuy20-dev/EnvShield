import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import prisma from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's onboarding status
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { onboardingCompleted: true },
    });

    return NextResponse.json({ 
      onboardingCompleted: user?.onboardingCompleted || false
    });
  } catch (error) {
    return handleApiError(error);
  }
}
