'use client';

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface SessionProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function SessionProvider({ children, requireAuth = false }: SessionProviderProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const checkOnboardingAndRedirect = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        if (!data.onboardingCompleted) {
          router.push('/onboarding');
        } else {
          router.push('/projects');
        }
      } else {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      router.push('/projects');
    }
  }, [router]);

  useEffect(() => {
    if (isPending) return;

    // Redirect to login if auth is required but user is not authenticated
    if (requireAuth && !session) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }

    // Redirect to dashboard if user is authenticated and on auth pages
    if (session && (pathname === '/login' || pathname === '/register' || pathname === '/verify-email')) {
      // Check onboarding status and redirect appropriately
      checkOnboardingAndRedirect();
    }
  }, [session, isPending, requireAuth, router, pathname, checkOnboardingAndRedirect]);

  // Show loading spinner while checking session
  if (requireAuth && isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render protected content until we know auth status
  if (requireAuth && !session && !isPending) {
    return null;
  }

  return <>{children}</>;
}
