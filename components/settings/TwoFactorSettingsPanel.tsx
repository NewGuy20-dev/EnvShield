"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldOff, KeyRound, RefreshCcw, Copy, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface TwoFactorSettingsPanelProps {
  initialState?: {
    enabled: boolean;
    pending: boolean;
    updatedAt?: string | null;
  };
}

type WizardStep = "password" | "qr" | "verify" | "backup";

export function TwoFactorSettingsPanel({ initialState }: TwoFactorSettingsPanelProps) {
  const [state, setState] = useState(initialState ?? { enabled: false, pending: false });
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);

  const [password, setPassword] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  const [wizardStep, setWizardStep] = useState<WizardStep>("password");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);

  useEffect(() => {
    if (wizardStep === "verify") {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => (prev === 0 ? 30 : prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [wizardStep]);

  const resetWizard = () => {
    setWizardStep("password");
    setPassword("");
    setTotpCode("");
    setSetupError(null);
    setQrCodeUrl(null);
    setBackupCodes(null);
    setRecoveryCode(null);
  };

  const handleStartSetup = () => {
    resetWizard();
    setIsSetupOpen(true);
  };

  const handleSetupSubmit = async () => {
    if (wizardStep === "password") {
      setIsSubmitting(true);
      setSetupError(null);
      try {
        const response = await fetch("/api/v1/auth/2fa/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passwordConfirmation: password }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to initiate setup");
        }

        setQrCodeUrl(data.qrCodeUrl);
        setBackupCodes(data.backupCodes ?? []);
        setRecoveryCode(data.recoveryCode ?? null);
        setWizardStep("qr");
      } catch (error) {
        setSetupError(error instanceof Error ? error.message : "Unable to start setup");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (wizardStep === "verify") {
      if (!totpCode.trim()) {
        setSetupError("Enter the 6-digit code from your authenticator app");
        return;
      }

      setIsSubmitting(true);
      setSetupError(null);
      try {
        const response = await fetch("/api/v1/auth/2fa/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: totpCode }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Verification failed");
        }

        setState({ enabled: true, pending: false, updatedAt: new Date().toISOString() });
        setWizardStep("backup");
      } catch (error) {
        setSetupError(error instanceof Error ? error.message : "Unable to verify token");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDisable = async () => {
    if (!disablePassword.trim() || !disableCode.trim()) {
      setSetupError("Password and verification code are required");
      return;
    }

    setIsSubmitting(true);
    setSetupError(null);
    try {
      const response = await fetch("/api/v1/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, tokenOrRecovery: disableCode }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to disable 2FA");
      }

      setState({ enabled: false, pending: false, updatedAt: new Date().toISOString() });
      setRecoveryCode(data.recoveryCode ?? null);
      setIsDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to disable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  const handleDownloadBackupCodes = () => {
    if (!backupCodes) return;
    const blob = new Blob([
      "EnvShield Backup Codes\n" + backupCodes.join("\n"),
    ], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "envshield-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStateCard = () => {
    if (state.enabled) {
      return (
        <Card className="border border-success/20 bg-success/5">
          <CardTitle className="flex items-center gap-3 text-success">
            <ShieldCheck className="w-6 h-6" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription className="text-success/80">
            Your account is protected with Time-based One-Time Passwords. Keep your backup and recovery codes stored securely.
          </CardDescription>
          <CardContent className="mt-4 space-y-2 text-sm text-success/80">
            <p>Last updated: {state.updatedAt ? new Date(state.updatedAt).toLocaleString() : "Unknown"}</p>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="secondary" icon={<RefreshCcw className="w-4 h-4" />} onClick={handleStartSetup}>
              Reconfigure
            </Button>
            <Button variant="danger" icon={<ShieldOff className="w-4 h-4" />} onClick={() => setIsDisableOpen(true)}>
              Disable 2FA
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (state.pending) {
      return (
        <Card className="border border-warning/20 bg-warning/5">
          <CardTitle className="flex items-center gap-3 text-warning">
            <AlertTriangle className="w-6 h-6" />
            Verification Required
          </CardTitle>
          <CardDescription className="text-warning/80">
            Complete the verification step by entering the code from your authenticator app.
          </CardDescription>
          <CardFooter className="justify-between">
            <Button variant="secondary" onClick={handleStartSetup}>
              Resume Setup
            </Button>
            <Button variant="ghost" onClick={() => setIsDisableOpen(true)}>
              Cancel Setup
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return (
      <Card className="border border-primary/20">
        <CardTitle className="flex items-center gap-3">
          <ShieldOff className="w-6 h-6 text-primary" />
          Two-Factor Authentication Disabled
        </CardTitle>
        <CardDescription>
          Protect your account with a second layer of security. We recommend enabling 2FA for all users, especially admins and owners.
        </CardDescription>
        <CardFooter>
          <Button variant="primary" icon={<ShieldCheck className="w-4 h-4" />} onClick={handleStartSetup}>
            Enable 2FA
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const renderWizardContent = () => {
    if (wizardStep === "password") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Confirm your password to begin setting up two-factor authentication.
          </p>
          <Input
            label="Current Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      );
    }

    if (wizardStep === "qr") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Scan the QR code below using your authenticator app, then click Continue.
          </p>
          {qrCodeUrl ? (
            <div className="flex flex-col items-center gap-4">
              <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 rounded-xl border border-glass-light-border dark:border-glass-dark-border" />
              <Button variant="secondary" icon={<RefreshCcw className="w-4 h-4" />} onClick={() => setWizardStep("verify")}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}
        </div>
      );
    }

    if (wizardStep === "verify") {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span>Enter the 6-digit code from your authenticator app</span>
            <span>Next refresh in {timeRemaining}s</span>
          </div>
          <Input
            label="Authenticator Code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
          />
        </div>
      );
    }

    if (wizardStep === "backup") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Save these backup codes in a secure location. Each code can be used once if you lose access to your authenticator app.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {backupCodes?.map((code) => (
              <div key={code} className="flex items-center justify-between p-3 rounded-xl border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark">
                <span className="font-mono text-sm">{code}</span>
                <Button variant="ghost" size="sm" icon={<Copy className="w-4 h-4" />} onClick={() => handleCopy(code)}>
                  Copy
                </Button>
              </div>
            ))}
          </div>
          {recoveryCode && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm font-semibold text-warning mb-2">Recovery Code</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{recoveryCode}</span>
                <Button variant="ghost" size="sm" icon={<Copy className="w-4 h-4" />} onClick={() => handleCopy(recoveryCode)}>
                  Copy
                </Button>
              </div>
            </div>
          )}
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={handleDownloadBackupCodes}>
            Download Codes
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {renderStateCard()}

      {/* Setup Wizard Modal */}
      <Modal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)} title="Enable Two-Factor Authentication" size="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <KeyRound className="w-4 h-4" />
            <span>Step {wizardStep === "password" ? "1" : wizardStep === "qr" ? "2" : wizardStep === "verify" ? "3" : "4"} of 4</span>
          </div>

          {setupError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {setupError}
            </div>
          )}

          {renderWizardContent()}

          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsSetupOpen(false)}>
              Cancel
            </Button>

            {wizardStep === "password" && (
              <Button variant="primary" onClick={handleSetupSubmit} loading={isSubmitting || !password.trim()}>
                Continue
              </Button>
            )}

            {wizardStep === "qr" && (
              <Button variant="primary" onClick={() => setWizardStep("verify")}>
                I've Scanned the QR
              </Button>
            )}

            {wizardStep === "verify" && (
              <Button variant="primary" onClick={handleSetupSubmit} loading={isSubmitting}>
                Verify & Enable
              </Button>
            )}

            {wizardStep === "backup" && (
              <Button variant="primary" onClick={() => setIsSetupOpen(false)}>
                Done
              </Button>
            )}
          </ModalFooter>
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal isOpen={isDisableOpen} onClose={() => setIsDisableOpen(false)} title="Disable Two-Factor" size="md">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Enter your password and either a current TOTP code, a backup code, or your recovery code to disable 2FA.
          </p>

          {setupError && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              {setupError}
            </div>
          )}

          <Input
            label="Password"
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
          />

          <Input
            label="TOTP / Backup / Recovery Code"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
          />

          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsDisableOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDisable} loading={isSubmitting}>
              Disable 2FA
            </Button>
          </ModalFooter>
        </div>
      </Modal>

    </div>
  );
}
