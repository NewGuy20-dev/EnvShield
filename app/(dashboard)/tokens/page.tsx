"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface Token {
  id: string;
  name: string;
  token?: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewToken, setShowNewToken] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/v1/tokens");
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      }
    } catch (error) {
      console.error("Failed to fetch tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      const response = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Token" }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewToken(data.token);
        setShowNewToken(true);
        fetchTokens();
      }
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            API Tokens
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Manage your API tokens for CLI access
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={handleCreateToken}
        >
          Create Token
        </Button>
      </div>

      {/* New Token Display */}
      {showNewToken && newToken && (
        <Card className="p-6 mb-8 border-2 border-success/20 bg-success/5">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-2">
                Your new token (save this, you won't see it again)
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-black/10 dark:bg-black/30 rounded-lg font-mono text-sm break-all">
                  {newToken}
                </code>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Copy className="w-4 h-4" />}
                  onClick={() => copyToClipboard(newToken)}
                >
                  Copy
                </Button>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewToken(false)}
            >
              Done
            </Button>
          </div>
        </Card>
      )}

      {/* Tokens List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : tokens.length === 0 ? (
        <Card className="p-8 text-center">
          <Key className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark mx-auto mb-4 opacity-50" />
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
            No tokens yet
          </p>
          <Button variant="primary" onClick={handleCreateToken}>
            Create Your First Token
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {tokens.map((token) => (
            <Card key={token.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {token.name}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    <span>Created {new Date(token.createdAt).toLocaleDateString()}</span>
                    {token.lastUsedAt && (
                      <span>Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Revoke
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
