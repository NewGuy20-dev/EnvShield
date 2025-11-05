"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (newCode.every(c => c !== "")) {
      handleSubmit(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (verificationCode?: string) => {
    const codeString = verificationCode || code.join("");
    if (codeString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeString }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Verification failed");
        return;
      }

      router.push("/"); // Redirect to dashboard home
    } catch (err) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await fetch("/api/v1/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResendCountdown(60);
    } catch {
      setError("Failed to resend code");
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
            Verify Email
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Enter the 6-digit code sent to {email}
          </p>
        </div>

        {/* Code Input */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm animate-shake">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-12 text-center text-2xl font-bold rounded-lg glass-input bg-glass-light-input dark:bg-glass-dark-input border border-glass-light-border dark:border-glass-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
              />
            ))}
          </div>

          <Button
            onClick={() => handleSubmit()}
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
            disabled={code.some(c => c === "")}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center">
            {resendCountdown > 0 ? (
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                Resend code in {resendCountdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                type="button"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Didn't receive code? Resend
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
