"use client";

import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { Avatar } from "@/components/ui/avatar";

export interface NavbarProps {
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-glass-light-border dark:border-glass-dark-border backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/projects" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl font-bold text-gradient-primary hidden sm:inline">
              EnvShield
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/projects">
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-primary/5 transition-all">
                Projects
              </span>
            </Link>
            <Link href="/tokens">
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-primary/5 transition-all">
                API Tokens
              </span>
            </Link>
            <Link href="/settings">
              <span className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-primary hover:bg-primary/5 transition-all">
                Settings
              </span>
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <AnimatedThemeToggler />
            
            {user && (
              <div className="flex items-center gap-3">
                <Avatar initials={user.name.charAt(0)} size="sm" />
                <Button variant="ghost" size="sm" onClick={onLogout}>
                  Logout
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-glass-light dark:hover:bg-glass-dark transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-glass-light-border dark:border-glass-dark-border mt-4">
            <Link href="/projects" className="block px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
              Projects
            </Link>
            <Link href="/tokens" className="block px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
              API Tokens
            </Link>
            <Link href="/settings" className="block px-4 py-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark">
              Settings
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
