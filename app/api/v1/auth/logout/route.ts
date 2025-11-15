import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { logSecurityEvent } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("envshield.session")?.value;

    if (sessionToken) {
      await auth.api.signOut({
        headers: req.headers,
        request: req,
      });
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    response.cookies.delete("envshield.session");
    response.cookies.delete("envshield.session_data");

    return response;
  } catch (error) {
    logSecurityEvent('logout_failed', 'medium', { error: error instanceof Error ? error.message : 'unknown' });
    return handleApiError(error);
  }
}
