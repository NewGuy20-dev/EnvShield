"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { useSession, signOut } from "@/lib/auth-client";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { logger } from "@/lib/logger";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      logger.error({ error }, "Logout failed");
      // Fallback to manual logout
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/login";
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session?.user) {
    return null; // SessionProvider will handle redirect
  }

  return (
    <DashboardShell 
      user={{ 
        name: session.user.name || "User", 
        email: session.user.email,
      }} 
      onLogout={handleLogout}
    >
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider requireAuth>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
