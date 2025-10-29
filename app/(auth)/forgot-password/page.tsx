"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { resetPasswordSchema } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = resetPasswordSchema.parse({ email });
      
      const response = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to send reset email");
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid input");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <Card className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Reset Password
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {success
              ? "Check your email for a reset link"
              : "We'll send you a link to reset your password"}
          </p>
        </div>

        {success ? (
          // Success state
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-success/10">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </div>
            <div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                We've sent a password reset link to:
              </p>
              <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                {email}
              </p>
            </div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
              The link will expire in 24 hours. Check your spam folder if you don't see it.
            </p>
            <Link href="/login">
              <Button variant="primary" size="lg" className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-shake">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Link href="/login">
              <Button variant="ghost" size="lg" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Login
              </Button>
            </Link>
          </form>
        )}
      </Card>
    </div>
  );
}
