import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import prisma from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = auth.user.id;

    const params = await context.params;
    const tokenId = params.tokenId;

    // Find the token and verify ownership
    const token = await prisma.apiToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      return NextResponse.json({ message: 'Token not found' }, { status: 404 });
    }

    if (token.userId !== userId) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this token' },
        { status: 403 }
      );
    }

    // Delete the token
    await prisma.apiToken.delete({
      where: { id: tokenId },
    });

    return NextResponse.json({
      message: 'Token revoked successfully',
    });
  } catch (error) {
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
