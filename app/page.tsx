import Link from "next/link";
import { Shield, Lock, Users, GitBranch, Terminal, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AnimatedBackground } from "@/components/shared/animated-background";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Military-grade encryption for your secrets
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-text-primary-light dark:text-text-primary-dark mb-8 animate-slide-up tracking-tight leading-tight">
              Shield your secrets,
              <br />
              <span className="text-gradient-primary inline-flex items-center gap-3">
                empower your team
                <Shield className="w-12 h-12 lg:w-16 lg:h-16 text-primary inline-block animate-float" />
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-text-secondary-light dark:text-text-secondary-dark max-w-4xl mx-auto mb-12 animate-slide-up animation-delay-100 leading-relaxed">
              Securely store, share, and manage environment variables across teams and environments. 
              <span className="text-text-primary-light dark:text-text-primary-dark font-semibold"> Git-like CLI workflow</span> with military-grade encryption.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-slide-up animation-delay-200">
              <Link href="/register">
                <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                  Start Free Trial
                </Button>
              </Link>
              <Link href="https://github.com/envshield/envshield" target="_blank">
                <Button variant="secondary" size="lg" icon={<GitBranch className="w-5 h-5" />}>
                  View on GitHub
                </Button>
              </Link>
            </div>

            {/* CLI Preview */}
            <Card className="max-w-4xl mx-auto p-8 font-mono text-sm lg:text-base animate-slide-up animation-delay-300 hover-lift">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-glass-light-border dark:border-glass-dark-border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <span className="text-text-primary-light dark:text-text-primary-dark font-semibold">Terminal</span>
                <div className="ml-auto flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/60"></div>
                  <div className="w-3 h-3 rounded-full bg-warning/60"></div>
                  <div className="w-3 h-3 rounded-full bg-success/60"></div>
                </div>
              </div>
              <div className="text-left space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted-light dark:text-text-muted-dark">$</span>
                  <span className="text-success font-medium">envshield login</span>
                </div>
                <div className="text-text-secondary-light dark:text-text-secondary-dark pl-4">✓ Logged in successfully</div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-text-muted-light dark:text-text-muted-dark">$</span>
                  <span className="text-primary font-medium">envshield pull</span>
                </div>
                <div className="text-text-secondary-light dark:text-text-secondary-dark pl-4">✓ Pulled 23 variables to .env</div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-text-muted-light dark:text-text-muted-dark">$</span>
                  <span className="text-secondary font-medium">envshield push</span>
                </div>
                <div className="text-text-secondary-light dark:text-text-secondary-dark pl-4">✓ Pushed changes to production</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

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
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-gradient-primary">EnvShield</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                Documentation
              </Link>
              <Link href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                API
              </Link>
              <Link href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                Support
              </Link>
              <Link href="#" className="text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors">
                Privacy
              </Link>
            </div>
          </div>
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
