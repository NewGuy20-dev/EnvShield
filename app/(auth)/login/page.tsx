"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { loginSchema } from "@/lib/validation";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { TwoFactorChallengeForm } from "@/components/auth/TwoFactorChallengeForm";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSessionToken, setPendingSessionToken] = useState<string | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  const redirect = searchParams.get("redirect");
  const code = searchParams.get("code");
  const targetPath = redirect
    ? `${redirect}${code ? `?code=${encodeURIComponent(code)}` : ""}`
    : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = loginSchema.parse({ email, password, rememberMe });
      
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      const data = await response.json();

      if (response.status === 202 && data.twoFactorRequired) {
        setTwoFactorRequired(true);
        setPendingSessionToken(data.pendingSessionToken);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.push(targetPath);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid input");
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeSuccess = () => {
    router.push(targetPath);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Back to home link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-primary transition-colors mb-6">
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to home
        </Link>
        
        <Card className="p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 animate-glow-pulse">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Welcome back
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-base">
              Sign in to your EnvShield account
            </p>
          </div>

          {!twoFactorRequired ? (
            <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-shake">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Remember me
                </span>
              </label>
              <Link href="/forgot-password">
                <span className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </span>
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
              icon={!loading && <ArrowRight className="w-4 h-4" />}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {pendingSessionToken && (
              <TwoFactorChallengeForm
                pendingSessionToken={pendingSessionToken}
                onSuccess={handleChallengeSuccess}
              />
            )}
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setTwoFactorRequired(false);
                setPendingSessionToken(null);
              }}
            >
              Use a different account
            </Button>
          </div>
        )}

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">OR</span>
          <div className="flex-1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
        </div>

        {/* Social Login */}
        <OAuthButtons redirectPath={targetPath} />

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register">
            <span className="text-primary font-medium hover:text-primary/80 transition-colors">
              Sign up
            </span>
          </Link>
        </p>
      </Card>

        {/* Trust badges */}
        <div className="mt-8 text-center text-xs text-text-muted-light dark:text-text-muted-dark space-y-2">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>End-to-end encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-success" />
              <span>Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <AnimatedBackground />
        <Card className="p-10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 animate-pulse">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Loading...
            </h1>
          </div>
        </Card>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
