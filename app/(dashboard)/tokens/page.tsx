"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Key, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading";
import { PageHeader } from "@/components/ui/page-header";
import { CopyButton } from "@/components/ui/copy-button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

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
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch tokens',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;

    try {
      const response = await fetch("/api/v1/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTokenName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedToken(data.token);
        fetchTokens();
        addToast({
          type: 'success',
          title: 'Token Created',
          message: 'API token created successfully',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to create token',
        });
      }
    } catch (error) {
      console.error("Failed to create token:", error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to create token',
      });
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this token?")) return;

    try {
      const response = await fetch(`/api/v1/tokens/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTokens();
        addToast({
          type: 'success',
          title: 'Token Revoked',
          message: 'API token revoked successfully',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Failed to revoke token',
        });
      }
    } catch (error) {
      console.error("Failed to revoke token:", error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to revoke token',
      });
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewTokenName("");
    setCreatedToken(null);
  };

  const filteredTokens = tokens.filter((token) =>
    token.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="API Tokens"
        description="Manage your API tokens for CLI access"
        actions={
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Token
          </Button>
        }
      />

      {/* Tokens List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={<Key className="w-12 h-12" />}
          title="No tokens yet"
          description="Create a token to use the EnvShield CLI"
          action={
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Create Your First Token
            </Button>
          }
        />
      ) : (
        <div className="space-y-4 animate-slide-up">
          {/* Search */}
          <div className="max-w-md">
            <Input
              type="search"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {filteredTokens.length === 0 ? (
            <EmptyState
              icon={<Key className="w-12 h-12" />}
              title="No tokens match your search"
              description="Try adjusting your search terms."
            />
          ) : (
            <Card className="p-0">
              <Table aria-label="API tokens table">
                <TableHeader>
                  <tr>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredTokens.map((token) => {
                    const created = new Date(token.createdAt).toLocaleDateString();
                    const lastUsed = token.lastUsedAt
                      ? new Date(token.lastUsedAt).toLocaleDateString()
                      : "Never";
                    const isExpired = token.expiresAt
                      ? new Date(token.expiresAt) < new Date()
                      : false;
                    const statusLabel = token.expiresAt
                      ? isExpired
                        ? "Expired"
                        : `Expires ${new Date(token.expiresAt).toLocaleDateString()}`
                      : "No expiry";

                    return (
                      <TableRow key={token.id}>
                        <TableCell>
                          <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                            {token.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                          {created}
                        </TableCell>
                        <TableCell className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                          {lastUsed}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={isExpired ? "error" : "default"}
                            size="sm"
                          >
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => handleRevokeToken(token.id)}
                            aria-label={`Revoke token ${token.name}`}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* Create Token Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title={createdToken ? "Token Created" : "Create New Token"}
        size="md"
      >
        {createdToken ? (
          <div className="space-y-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm text-success font-medium mb-2">
                Your new token (save this, you won't see it again)
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-glass-light-input dark:bg-glass-dark-input rounded-lg font-mono text-sm break-all">
                  {createdToken}
                </code>
                <CopyButton text={createdToken} variant="button" />
              </div>
            </div>
            <ModalFooter>
              <Button variant="primary" onClick={closeCreateModal}>
                Done
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Token Name"
              placeholder="e.g., Development Laptop"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              autoFocus
            />
            <ModalFooter>
              <Button variant="secondary" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateToken}
                disabled={!newTokenName.trim()}
              >
                Create Token
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
