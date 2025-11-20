'use client';

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import { Shield, Lock, Users, GitBranch, Terminal, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedThemeToggler } from "@/registry/magicui/animated-theme-toggler";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { HeroSection } from "@/components/landing/hero-section";
import { LogoMarquee } from "@/components/landing/logo-marquee";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SocialProof } from "@/components/landing/social-proof";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/user/onboarding-status');
      if (response.ok) {
        const data = await response.json();
        if (!data.onboardingCompleted) {
          router.replace('/onboarding');
        } else {
          router.replace('/projects');
        }
      } else {
        router.replace('/projects');
      }
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      router.replace('/projects');
    }
  }, [router]);

  // Redirect authenticated users to dashboard or onboarding
  useEffect(() => {
    if (!isPending && session) {
      // Check if user needs onboarding
      checkOnboardingStatus();
    }
  }, [session, isPending, checkOnboardingStatus]);

  // Show loading while checking session
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authenticated, don't show landing page (will redirect)
  if (session) {
    return null;
  }
  return (
    <div className="min-h-screen relative">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-light-border dark:border-glass-dark-border backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold text-gradient-primary">
                EnvShield
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
              <AnimatedThemeToggler />
            </div>
          </div>
        </div>
      </nav>

      {/* New Hero Section with Spotlight Background */}
      <HeroSection />

      {/* Integrations Marquee */}
      <LogoMarquee />

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-secondary/20 mb-6">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Features
              </span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 tracking-tight">
              Everything you need to manage secrets
            </h2>
            <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto">
              Built for modern development teams with security and collaboration in mind
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="hover"
                className={`p-8 animate-slide-up group`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Social Proof Section */}
      <SocialProof />

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="p-12 lg:p-16 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/15 to-primary/20 animate-gradient-shift" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/30 mb-8">
                <Shield className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                  Join 1,000+ teams
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 tracking-tight">
                Ready to secure your secrets?
              </h2>
              <p className="text-xl text-text-secondary-light dark:text-text-secondary-dark mb-10 max-w-2xl mx-auto leading-relaxed">
                Join teams who trust EnvShield with their environment variables. Start protecting your secrets today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                    Get Started for Free
                  </Button>
                </Link>
                <Link href="#">
                  <Button variant="secondary" size="lg">
                    Schedule a Demo
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-6">
                No credit card required • Free 14-day trial • Cancel anytime
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-glass-light-border dark:border-glass-dark-border mt-12">
        <div className="max-w-7xl mx-auto">
          {/* Top Section: Logo + Status */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">EnvShield</span>
            </div>
            
            {/* Status Pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-success">All systems operational</span>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Product */}
            <div>
              <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-8 border-t border-glass-light-border dark:border-glass-dark-border text-center">
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
              © 2025 EnvShield. All rights reserved. Built with security and transparency.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: <Lock className="w-7 h-7 text-primary" />,
    title: "AES-256 Encryption",
    description: "Military-grade encryption at rest. Your secrets are encrypted before storage and decrypted only when authorized.",
  },
  {
    icon: <Terminal className="w-7 h-7 text-primary" />,
    title: "Git-like CLI",
    description: "Familiar push/pull workflow. Sync environment variables across teams with simple command-line operations.",
  },
  {
    icon: <Users className="w-7 h-7 text-primary" />,
    title: "Team Collaboration",
    description: "Role-based access control with Owner, Admin, Developer, and Viewer roles. Manage team permissions easily.",
  },
  {
    icon: <GitBranch className="w-7 h-7 text-primary" />,
    title: "Version Control",
    description: "Track all changes with complete audit logs. Rollback to previous versions when needed.",
  },
  {
    icon: <Zap className="w-7 h-7 text-secondary" />,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for instant syncs and blazing-fast performance.",
  },
  {
    icon: <Shield className="w-7 h-7 text-primary" />,
    title: "Secure by Default",
    description: "Security best practices baked in. Automatic token rotation, audit logging, and IP tracking.",
  },
];
