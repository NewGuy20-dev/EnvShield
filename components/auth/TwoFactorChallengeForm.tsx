"use client";

import { useState } from "react";
import { ShieldAlert, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TwoFactorChallengeFormProps {
  pendingSessionToken: string;
  onSuccess: () => void;
}

export function TwoFactorChallengeForm({ pendingSessionToken, onSuccess }: TwoFactorChallengeFormProps) {
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [token, setToken] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token && !backupCode) {
      setError("Enter a TOTP or backup code");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pendingSessionToken,
          token: mode === "totp" ? token : undefined,
          backupCode: mode === "backup" ? backupCode : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify code");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border border-glass-light-border dark:border-glass-dark-border rounded-2xl bg-glass-light dark:bg-glass-dark">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-warning" />
        <div>
          <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Two-factor challenge required</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Enter the code from your authenticator app or use a backup code.</p>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl bg-background-light/80 dark:bg-background-dark/40 p-1">
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === "totp" ? "bg-white dark:bg-white/10 shadow" : "text-text-secondary-light dark:text-text-secondary-dark"}`}
          onClick={() => setMode("totp")}
        >
          Authenticator App
        </button>
        <button
          type="button"
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${mode === "backup" ? "bg-white dark:bg-white/10 shadow" : "text-text-secondary-light dark:text-text-secondary-dark"}`}
          onClick={() => setMode("backup")}
        >
          Backup Code
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
          {error}
        </div>
      )}

      {mode === "totp" ? (
        <Input
          label="Authenticator Code"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          maxLength={6}
          placeholder="123456"
          icon={<KeyRound className="w-4 h-4" />}
        />
      ) : (
        <Input
          label="Backup Code"
          value={backupCode}
          onChange={(e) => setBackupCode(e.target.value)}
          placeholder="ABCD-EFGH"
          icon={<KeyRound className="w-4 h-4" />}
        />
      )}

      <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}
        icon={!isSubmitting ? <RotateCcw className="w-4 h-4" /> : undefined}
      >
        {isSubmitting ? "Verifying..." : "Verify and Continue"}
      </Button>
    </form>
  );
}
