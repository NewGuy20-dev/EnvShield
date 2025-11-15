import { NextRequest } from 'next/server';
import { compare } from 'bcryptjs';
import { jwtVerify } from 'jose';
import prisma from './db';
import { ENABLE_LEGACY_JWT, jwtSecretBuffer } from './config';
import crypto from 'crypto';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    image?: string | null;
  };
  token?: {
    id: string;
    name: string | null;
  };
  session?: any;
  authMethod: 'bearer-token' | 'session' | 'legacy-jwt';
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
    const tokenPlain = authHeader.replace('Bearer ', '').trim();
    const now = new Date();
    const digest = crypto.createHash('sha256').update(tokenPlain).digest('hex');

    const candidateToken = await prisma.apiToken.findUnique({
      where: { tokenDigest: digest },
      include: { user: true },
    });

    type ApiTokenWithUser = NonNullable<typeof candidateToken>;
    const candidates: ApiTokenWithUser[] = [];

    if (candidateToken && (!candidateToken.expiresAt || candidateToken.expiresAt > now)) {
      candidates.push(candidateToken);
    } else {
      const legacyTokens = await prisma.apiToken.findMany({
        where: {
          tokenDigest: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        include: { user: true },
      });
      candidates.push(...legacyTokens);
    }

    for (const t of candidates) {
      try {
        const isValid = await compare(tokenPlain, t.token);
        if (!isValid) continue;

        await prisma.apiToken.update({
          where: { id: t.id },
          data: { lastUsedAt: new Date() },
        });

        return {
          user: {
            id: t.user.id,
            email: t.user.email,
            name: t.user.name,
            image: t.user.image,
          },
          token: {
            id: t.id,
            name: t.name,
          },
          authMethod: 'bearer-token',
        };
      } catch (err) {
        continue;
      }
    }
  }

  // Try Better Auth session (OAuth or email/password via Better Auth)
  try {
    const { auth } = await import('./auth');
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (session?.user) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        },
        session: session,
        authMethod: 'session',
      };
    }
  } catch (error) {
    // Better Auth session invalid or not present, continue to next auth method
  }

  // Try legacy JWT session cookie (for backward compatibility)
  if (ENABLE_LEGACY_JWT) {
    const sessionToken = req.cookies.get('auth-token')?.value;
    if (sessionToken) {
      try {
        const verified = await jwtVerify(sessionToken, jwtSecretBuffer);
        const userId = verified.payload.id as string;
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true, image: true },
        });

        if (user) {
          return {
            user,
            session: verified.payload,
            authMethod: 'legacy-jwt',
          };
        }
      } catch (err) {
        // Invalid session token
        return null;
      }
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
