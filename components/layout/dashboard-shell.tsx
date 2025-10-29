"use client";

import { Navbar, NavbarProps } from "./navbar";
import { Sidebar, SidebarProps } from "./sidebar";

export interface DashboardShellProps extends NavbarProps, SidebarProps {
  children: React.ReactNode;
}

export function DashboardShell({
  children,
  user,
  onLogout,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Navbar user={user} onLogout={onLogout} />
      <div className="flex pt-16">
        <Sidebar user={user} onLogout={onLogout} />
        <main className="flex-1 md:pl-0">
          {children}
        </main>
      </div>
    </div>
  );
}
