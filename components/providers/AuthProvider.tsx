'use client';

/**
 * Auth Provider for Better Auth
 * 
 * Better Auth doesn't require a provider wrapper like NextAuth.
 * The hooks (useSession, etc.) work directly without a provider.
 * This component is kept for consistency and future extensibility.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
