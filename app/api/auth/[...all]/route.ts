import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth Catch-All Handler
 * 
 * Automatically handles:
 * - /api/auth/sign-in/social (OAuth initiation for Google/GitHub)
 * - /api/auth/sign-in/email (Email/password sign in)
 * - /api/auth/sign-up/email (Email/password registration)
 * - /api/auth/sign-out (Sign out)
 * - /api/auth/callback/google (Google OAuth callback)
 * - /api/auth/callback/github (GitHub OAuth callback)
 * - /api/auth/session (Get current session)
 * - /api/auth/user (Get current user)
 * - /api/auth/csrf-token (CSRF protection)
 */
export const { GET, POST } = toNextJsHandler(auth);
