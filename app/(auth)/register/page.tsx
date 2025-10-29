"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, User, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PasswordStrength } from "@/components/ui/password-strength";
import { signupSchema } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
    terms: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = signupSchema.parse(formData);
      
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Registration failed");
        return;
      }

      router.push("/verify-email?email=" + encodeURIComponent(formData.email));
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
            Create Account
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Join thousands managing secrets securely
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-shake">
              {error}
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            name="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            icon={<User className="w-4 h-4" />}
          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Company (Optional)"
            type="text"
            name="company"
            placeholder="Your company"
            value={formData.company}
            onChange={handleChange}
            icon={<Building2 className="w-4 h-4" />}
          />

          <div>
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              icon={<Lock className="w-4 h-4" />}
            />
            <PasswordStrength password={formData.password} />
          </div>

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            icon={<Lock className="w-4 h-4" />}
          />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-primary mt-1"
            />
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              I agree to the{" "}
              <Link href="#">
                <span className="text-primary hover:underline">Terms of Service</span>
              </Link>{" "}
              and{" "}
              <Link href="#">
                <span className="text-primary hover:underline">Privacy Policy</span>
              </Link>
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
            icon={!loading && <CheckCircle2 className="w-4 h-4" />}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">OR</span>
          <div className="flex-1 h-px bg-glass-light-border dark:bg-glass-dark-border" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <Button variant="secondary" size="lg" className="w-full">
            Sign up with GitHub
          </Button>
          <Button variant="secondary" size="lg" className="w-full">
            Sign up with Google
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-6">
          Already have an account?{" "}
          <Link href="/login">
            <span className="text-primary font-medium hover:text-primary/80 transition-colors">
              Sign in
            </span>
          </Link>
        </p>
      </Card>

      {/* Benefits */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-text-muted-light dark:text-text-muted-dark">
        <div>
          <div className="text-lg font-bold text-primary mb-1">AES-256</div>
          <div>Encryption</div>
        </div>
        <div>
          <div className="text-lg font-bold text-primary mb-1">∞</div>
          <div>Free Tier</div>
        </div>
        <div>
          <div className="text-lg font-bold text-primary mb-1">24/7</div>
          <div>Support</div>
        </div>
      </div>
    </div>
  );
}
