/**
 * OAuth Account Linking API Route
 * GET - Initiate OAuth account linking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { handleApiError, AuthError, ValidationError } from '@/lib/errors';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const linkQuerySchema = z.object({
  provider: z.enum(['google', 'github']),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUserFromRequest(req);
    if (!authResult) {
      throw new AuthError('Authentication required');
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const { provider } = linkQuerySchema.parse({
      provider: searchParams.get('provider'),
    });

    // Generate OAuth authorization URL
    // Better Auth handles the OAuth flow internally
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackURL = `${baseURL}/api/auth/callback/${provider}`;
    
    // Store user ID in session for callback
    // Better Auth will handle this internally via session cookies
    
    // Redirect to Better Auth OAuth endpoint
    const authURL = `${baseURL}/api/auth/sign-in/${provider}?redirect=/settings/security&link=true`;
    
    return NextResponse.redirect(authURL);
  } catch (error) {
    return handleApiError(error);
  }
}
