"use client";

import { useState, useEffect } from "react";
import { Github, Mail, AlertCircle, CheckCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

interface LinkedAccount {
  provider: string;
  accountId: string;
  linkedAt: string;
}

interface AccountStatus {
  accounts: LinkedAccount[];
  hasPassword: boolean;
  canUnlink: boolean;
  totalAuthMethods: number;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "google",
    name: "Google",
    icon: <Mail className="w-5 h-5" />,
    color: "bg-red-500",
  },
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="w-5 h-5" />,
    color: "bg-gray-800 dark:bg-gray-600",
  },
];

export function ConnectedAccountsSection() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkProvider, setUnlinkProvider] = useState<string | null>(null);
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [unlinkTwoFactor, setUnlinkTwoFactor] = useState("");
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/v1/auth/oauth/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch OAuth status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async (providerId: string) => {
    // Redirect to OAuth link endpoint
    window.location.href = `/api/v1/auth/oauth/link?provider=${providerId}`;
  };

  const handleUnlinkClick = (providerId: string) => {
    setUnlinkProvider(providerId);
    setUnlinkPassword("");
    setUnlinkTwoFactor("");
    setUnlinkError("");
    setShowUnlinkModal(true);
  };

  const handleUnlink = async () => {
    if (!unlinkProvider || !unlinkPassword) {
      setUnlinkError("Password is required");
      return;
    }

    setUnlinkLoading(true);
    setUnlinkError("");

    try {
      const response = await fetch("/api/v1/auth/oauth/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: unlinkProvider,
          password: unlinkPassword,
          twoFactorToken: unlinkTwoFactor || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to unlink account");
      }

      setSuccess(`${unlinkProvider} account unlinked successfully`);
      setShowUnlinkModal(false);
      fetchStatus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setUnlinkError(error instanceof Error ? error.message : "Failed to unlink account");
    } finally {
      setUnlinkLoading(false);
    }
  };

  const isLinked = (providerId: string) => {
    return status?.accounts.some(acc => acc.provider === providerId) || false;
  };

  const getLinkedAccount = (providerId: string) => {
    return status?.accounts.find(acc => acc.provider === providerId);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
            Connected Accounts
          </h2>
        </div>

        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
          Link your accounts to sign in with multiple methods. You must have at least one authentication method.
        </p>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {/* Provider Cards */}
        <div className="space-y-4">
          {PROVIDERS.map((provider) => {
            const linked = isLinked(provider.id);
            const account = getLinkedAccount(provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border border-glass-light-border dark:border-glass-dark-border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${provider.color} text-white`}>
                    {provider.icon}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {provider.name}
                    </div>
                    {linked && account ? (
                      <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Linked {new Date(account.linkedAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <div className="text-sm text-text-muted-light dark:text-text-muted-dark">
                        Not connected
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {linked ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUnlinkClick(provider.id)}
                      disabled={!status?.canUnlink}
                    >
                      Unlink
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLink(provider.id)}
                    >
                      Link
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning if only one method */}
        {status && status.totalAuthMethods === 1 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              You have only one authentication method. Link another account or set a password before unlinking.
            </p>
          </div>
        )}
      </Card>

      {/* Unlink Confirmation Modal */}
      <Modal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        title={`Unlink ${unlinkProvider} Account`}
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            To unlink your {unlinkProvider} account, please confirm with your password
            {status?.hasPassword && " and 2FA code if enabled"}.
          </p>

          {unlinkError && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{unlinkError}</p>
            </div>
          )}

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={unlinkPassword}
            onChange={(e) => setUnlinkPassword(e.target.value)}
            disabled={unlinkLoading}
          />

          <Input
            type="text"
            label="2FA Code (if enabled)"
            placeholder="000000"
            value={unlinkTwoFactor}
            onChange={(e) => setUnlinkTwoFactor(e.target.value)}
            disabled={unlinkLoading}
          />

          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowUnlinkModal(false)}
              disabled={unlinkLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUnlink}
              loading={unlinkLoading}
              disabled={!unlinkPassword}
            >
              Unlink Account
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </>
  );
}
