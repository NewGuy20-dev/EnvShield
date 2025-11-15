import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);

    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      user: auth.user,
      session: auth.session,
      token: auth.token,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
