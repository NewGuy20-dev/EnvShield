import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import prisma from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user to mark onboarding as completed
    await prisma.user.update({
      where: { id: auth.user.id },
      data: { onboardingCompleted: true },
    });

    return NextResponse.json({ 
      success: true,
      message: "Onboarding completed successfully" 
    });
  } catch (error) {
    return handleApiError(error);
  }
}
