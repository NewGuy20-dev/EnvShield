"use client";

import { useState, useEffect } from "react";
import { User, Lock, Key, Trash2, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
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
          currentPassword: "",
          newPassword: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
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
    } finally {
      setTokensLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
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
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setFormData({
          ...formData,
          name: data.user.name || "",
          email: data.user.email || "",
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      setMessage({ type: 'error', text: 'Token name is required' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
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
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create token. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? This action cannot be undone.")) {
      return;
    }

    try {
      console.log('[Frontend] Revoking token:', tokenId);
      const response = await fetch(`/api/v1/tokens/${tokenId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('[Frontend] Response status:', response.status);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Token revoked successfully' });
        fetchTokens();
      } else {
        const data = await response.json();
        console.error('[Frontend] Error response:', data);
        setMessage({ type: 'error', text: data.message || 'Failed to revoke token' });
      }
    } catch (error) {
      console.error('[Frontend] Fetch error:', error);
      setMessage({ type: 'error', text: 'Failed to revoke token. Please try again.' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Token copied to clipboard!' });
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "tokens", label: "API Tokens", icon: Key },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
          Settings
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-glass-light-border dark:border-glass-dark-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-success/10 border-success/20 text-success' 
            : 'bg-danger/10 border-danger/20 text-danger'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Content */}
      <Card className="p-8">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Profile Information
            </h2>
            {profileLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
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
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
              Change Password
            </h2>
            <Input
              label="Current Password"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
            />
            <Input
              label="New Password"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
            />
            <div className="flex gap-3">
              <Button variant="primary">Update Password</Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </div>
        )}

        {activeTab === "tokens" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                API Tokens
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Create and manage API tokens for CLI access
              </p>
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
              <div className="p-6 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                      Token Created Successfully!
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Make sure to copy your token now. You won't be able to see it again!
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Copy className="w-4 h-4" />}
                    onClick={() => copyToClipboard(createdToken)}
                  >
                    Copy
                  </Button>
                </div>
                <code className="block p-3 bg-glass-dark/50 rounded text-sm font-mono break-all">
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
                <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active tokens</p>
                  <p className="text-sm mt-1">Create a token to use the CLI</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-4 bg-glass-light dark:bg-glass-dark rounded-lg border border-glass-light-border dark:border-glass-dark-border"
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
