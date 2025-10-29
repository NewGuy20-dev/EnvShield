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
      console.log('[Token Delete] Unauthorized - no user ID');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = auth.user.id;

    const params = await context.params;
    const tokenId = params.tokenId;

    console.log('[Token Delete] Attempting to delete token:', tokenId, 'for user:', userId);

    // Find the token and verify ownership
    const token = await prisma.apiToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      console.log('[Token Delete] Token not found:', tokenId);
      return NextResponse.json({ message: 'Token not found' }, { status: 404 });
    }

    if (token.userId !== userId) {
      console.log('[Token Delete] Permission denied. Token owner:', token.userId, 'Request user:', userId);
      return NextResponse.json(
        { message: 'You do not have permission to delete this token' },
        { status: 403 }
      );
    }

    // Delete the token
    await prisma.apiToken.delete({
      where: { id: tokenId },
    });

    console.log('[Token Delete] Token deleted successfully:', tokenId);

    return NextResponse.json({
      message: 'Token revoked successfully',
    });
  } catch (error) {
    console.error('[Token Delete] Error:', error);
    return NextResponse.json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
