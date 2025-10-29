"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <DashboardShell user={{ name: "User", email: "user@example.com" }} onLogout={handleLogout}>
      {children}
    </DashboardShell>
  );
}
