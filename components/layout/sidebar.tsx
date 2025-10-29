"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Zap, Settings, LogOut, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { Avatar } from "@/components/ui/avatar";

export interface SidebarProps {
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/projects", label: "Projects", icon: FileText },
    { href: "/tokens", label: "API Tokens", icon: Zap },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen glass border-r border-glass-light-border dark:border-glass-dark-border pt-20 backdrop-blur-xl">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 text-primary shadow-glow-primary/10"
                  : "text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 hover:text-primary hover:border-primary/20 border border-transparent"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
              )}
              <div className={clsx(
                "p-2 rounded-lg transition-all",
                isActive 
                  ? "bg-primary/20" 
                  : "bg-transparent group-hover:bg-primary/10"
              )}>
                <Icon className={clsx(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
              </div>
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="px-4 py-4 border-t border-glass-light-border dark:border-glass-dark-border space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl glass-hover cursor-pointer group">
            <Avatar initials={user.name.charAt(0)} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate group-hover:text-primary transition-colors">
                {user.name}
              </p>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark truncate">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:text-error hover:bg-error/10 transition-all group border border-transparent hover:border-error/20"
          >
            <div className="p-2 rounded-lg bg-transparent group-hover:bg-error/10 transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
