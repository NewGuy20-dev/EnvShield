"use client";

import { useEffect, useState } from "react";
import { User, Key, Shield, ShieldAlert, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { TwoFactorSettingsPanel } from "@/components/settings/TwoFactorSettingsPanel";
import { ConnectedAccountsSection } from "@/components/settings/ConnectedAccountsSection";

interface ApiToken {
  id: string;
  name: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "tokens">("profile");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "tokens") {
      fetchTokens();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await fetch("/api/v1/user/profile");
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch profile data',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      setTokensLoading(true);
      const response = await fetch("/api/v1/tokens");
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch API tokens',
      });
    } finally {
      setTokensLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/v1/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile information has been updated successfully.',
        });
        setFormData({
          ...formData,
          name: data.user.name || "",
          email: data.user.email || "",
        });
      } else {
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.message || 'Failed to update profile',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Token name is required',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedToken(data.token);
        setNewTokenName("");
        fetchTokens();
        addToast({
          type: 'success',
          title: 'Token Created',
          message: 'API token created successfully. Make sure to copy it now.',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Creation Failed',
          message: data.message || 'Failed to create token',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create token. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tokens/${tokenId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Token Revoked',
          message: 'The API token has been revoked successfully.',
        });
        fetchTokens();
      } else {
        const data = await response.json();
        addToast({
          type: 'error',
          title: 'Revocation Failed',
          message: data.message || 'Failed to revoke token',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to revoke token. Please try again.',
      });
    }
  };

  const [twoFactorState, setTwoFactorState] = useState<{ enabled: boolean; pending: boolean; updatedAt?: string | null } | null>(null);

  useEffect(() => {
    const loadTwoFactorState = async () => {
      try {
        const res = await fetch("/api/v1/auth/2fa/status");
        if (!res.ok) return;
        const data = await res.json();
        setTwoFactorState(data);
      } catch (error) {
        console.error("Failed to load 2FA status", error);
      }
    };

    loadTwoFactorState();
  }, []);

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "tokens", label: "API Tokens", icon: Key },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-glass-light-border dark:border-glass-dark-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-all duration-200 whitespace-nowrap ${isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-glass-light/50 dark:hover:bg-glass-dark/50 rounded-t-lg"
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <Card className="p-8 animate-slide-up">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Profile Information
            </h2>
            {profileLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <Input
                  label="Full Name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                Account Security
              </h2>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Manage two-factor authentication and secure recovery options.
              </p>
            </div>

            {twoFactorState ? (
              <>
                <TwoFactorSettingsPanel initialState={twoFactorState} />
                <div className="mt-8">
                  <ConnectedAccountsSection />
                </div>
              </>
            ) : (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            )}
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                  API Tokens
                </h2>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  Create and manage API tokens for CLI access
                </p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-glass-light-border dark:border-glass-dark-border bg-glass-light dark:bg-glass-dark px-4 py-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <ShieldAlert className="w-4 h-4 text-warning" />
                Rotate tokens after enabling 2FA to ensure CLI access stays synced.
              </div>
            </div>

            {/* Create Token Section */}
            <div className="p-6 bg-glass-light dark:bg-glass-dark rounded-lg border border-glass-light-border dark:border-glass-dark-border">
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Create New Token
              </h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Token name (e.g., My Laptop)"
                  value={newTokenName}
                  onChange={(e) => setNewTokenName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleCreateToken}
                  disabled={loading || !newTokenName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>

            {/* Display Created Token */}
            {createdToken && (
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20 animate-scale-in">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                      Token Created Successfully!
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Make sure to copy your token now. You won't be able to see it again!
                    </p>
                  </div>
                  <CopyButton text={createdToken} variant="button" />
                </div>
                <code className="block p-3 bg-glass-dark/50 rounded text-sm font-mono break-all text-white">
                  {createdToken}
                </code>
              </div>
            )}

            {/* Tokens List */}
            <div>
              <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
                Active Tokens
              </h3>
              {tokensLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : tokens.length === 0 ? (
                <EmptyState
                  icon={<Key className="w-12 h-12" />}
                  title="No active tokens"
                  description="Create a token to use the EnvShield CLI"
                />
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 bg-glass-light dark:bg-glass-dark rounded-lg border border-glass-light-border dark:border-glass-dark-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {token.name || "Unnamed Token"}
                        </h4>
                        <div className="flex gap-4 mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          <span>
                            Created: {new Date(token.createdAt).toLocaleDateString()}
                          </span>
                          {token.lastUsedAt && (
                            <span>
                              Last used: {new Date(token.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                          {token.expiresAt && (
                            <span>
                              Expires: {new Date(token.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleRevokeToken(token.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                <strong className="text-warning">Security Note:</strong> Tokens provide full access to your account via the CLI. Keep them secure and revoke any tokens you no longer use.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
