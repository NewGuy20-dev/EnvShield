import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { logger } from "./logger";

export const auth = betterAuth({
  // Database adapter using Prisma
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Base URL configuration - MUST match exactly with OAuth callback URLs
  baseURL: process.env.NODE_ENV === 'production'
    ? 'https://env-shield.vercel.app'
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  
  // Trust X-Forwarded headers (important for proxies/Vercel)
  trustProxy: true,

  // Email/Password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true when email service is configured
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  // OAuth Social Providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.NODE_ENV === 'production'
        ? 'https://env-shield.vercel.app'
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/api/auth/callback/google`,
      scope: ["email", "profile"],
    },
    github: {
      clientId: process.env.NODE_ENV === 'production'
        ? process.env.GITHUB_PROD_CLIENT_ID!
        : process.env.GITHUB_TEST_CLIENT_ID!,
      clientSecret: process.env.NODE_ENV === 'production'
        ? process.env.GITHUB_PROD_CLIENT_SECRET!
        : process.env.GITHUB_TEST_CLIENT_SECRET!,
      redirectURI: `${process.env.NODE_ENV === 'production'
        ? 'https://env-shield.vercel.app'
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/api/auth/callback/github`,
      scope: ["user:email", "read:user"],
    },
  },

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },
    expiresIn: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
    // Cookie settings - critical for OAuth state persistence
    cookie: {
      name: "envshield.session",
      sameSite: "lax", // Required for OAuth redirects
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },

  // Security settings
  secret: process.env.JWT_SECRET,

  // Callbacks for redirects
  callbacks: {
    async onSuccess(ctx: any) {
      // Check if there's a redirect URL in the request
      const redirectTo = ctx.request?.url ? new URL(ctx.request.url).searchParams.get('redirect') : null;
      // Redirect to the requested page or homepage (dashboard)
      return ctx.redirect(redirectTo || '/');
    },
    async onError(ctx: any) {
      // Log error instead of console.error
      logger.error({ error: ctx.error }, 'Better Auth error');
      // Redirect to login on error
      return ctx.redirect('/login?error=auth_failed');
    },
  },

  // Advanced options
  advanced: {
    cookiePrefix: "envshield",
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    generateSessionToken: () => {
      return crypto.randomUUID();
    },
  },

  // Trust proxy for Vercel deployment
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://env-shield.vercel.app',
  ],
});

export type Auth = typeof auth;
