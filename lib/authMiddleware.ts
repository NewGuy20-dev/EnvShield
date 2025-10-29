import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';
import { jwtVerify } from 'jose';
import prisma from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  token?: {
    id: string;
    name: string | null;
  };
  session?: any;
}

/**
 * Get authenticated user from request
 * Tries Bearer token first (for CLI), then session cookie (for web)
 */
export async function getAuthenticatedUserFromRequest(
  req: NextRequest
): Promise<AuthResult | null> {
  // Try Bearer token first (CLI auth)
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const tokenPlain = authHeader.replace('Bearer ', '');
    
    // Find all non-expired tokens
    const tokens = await prisma.apiToken.findMany({
      where: {
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    // Compare with stored hashed tokens
    for (const t of tokens) {
      try {
        const isValid = await compare(tokenPlain, t.token);
        if (isValid) {
          // Update lastUsedAt
          await prisma.apiToken.update({
            where: { id: t.id },
            data: { lastUsedAt: new Date() },
          });

          return {
            user: {
              id: t.user.id,
              email: t.user.email,
              name: t.user.name,
            },
            token: {
              id: t.id,
              name: t.name,
            },
          };
        }
      } catch (err) {
        // Continue checking other tokens
        continue;
      }
    }
  }

  // Try session cookie (web auth)
  const sessionToken = req.cookies.get('auth-token')?.value;
  if (sessionToken) {
    try {
      const verified = await jwtVerify(sessionToken, secret);
      const userId = verified.payload.id as string;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        return {
          user,
          session: verified.payload,
        };
      }
    } catch (err) {
      // Invalid session token
      return null;
    }
  }

  return null;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const auth = await getAuthenticatedUserFromRequest(req);
  if (!auth) {
    throw new Error('Unauthorized');
  }
  return auth;
}
