import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);

    if (!auth) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build response
    const response: any = {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
      },
    };

    // Add token info if authenticated via API token
    if (auth.token) {
      response.token = {
        id: auth.token.id,
        name: auth.token.name,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Whoami error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
