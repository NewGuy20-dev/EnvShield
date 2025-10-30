"use client";

import { use, useEffect, useState } from "react";
import { Plus, Search, Download, Upload, Copy, Eye, EyeOff, Trash2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";

interface Variable {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
  error?: string;
  masked?: boolean;
}

interface EnvironmentInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
}

export default function VariablesPage({
  params,
}: {
  params: Promise<{ slug: string; envSlug: string }>;
}) {
  const { slug, envSlug } = use(params);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentInfo | null>(null);
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [canViewDecrypted, setCanViewDecrypted] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVariable, setNewVariable] = useState({ key: "", value: "", description: "" });

  useEffect(() => {
    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, envSlug]);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/projects/${slug}/environments/${envSlug}/variables`
      );
      if (response.ok) {
        const data = await response.json();
        setVariables(data.variables || []);
        setEnvironment(data.environment);
        setProject(data.project);
        setCanViewDecrypted(data.canViewDecrypted || false);
      }
    } catch (error) {
      console.error("Failed to fetch variables:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (id: string) => {
    // Only allow reveal if user has permission
    if (!canViewDecrypted) {
      return;
    }
    const newSet = new Set(revealedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setRevealedIds(newSet);
  };

  const handleAddVariable = async () => {
    try {
      const response = await fetch(
        `/api/v1/projects/${slug}/environments/${envSlug}/variables`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newVariable),
        }
      );

      if (response.ok) {
        fetchVariables();
        setShowAddModal(false);
        setNewVariable({ key: "", value: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to add variable:", error);
    }
  };

  const filteredVariables = variables.filter(
    (v) =>
      v.key.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark">
              {environment?.name || 'Environment Variables'}
            </h1>
          </div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {project?.name} • {variables.length} variables
          </p>
          {!canViewDecrypted && variables.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-warning">
              <AlertCircle className="w-4 h-4" />
              <span>Values are masked. Contact an admin for full access.</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="lg"
            icon={<Download className="w-5 h-5" />}
          >
            Export
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Upload className="w-5 h-5" />}
          >
            Import
          </Button>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Variable
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <Input
          type="search"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Variables Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredVariables.length === 0 ? (
        <EmptyState
          icon={<Lock className="w-12 h-12" />}
          title={search ? "No variables found" : "No variables yet"}
          description={
            search
              ? "Try adjusting your search terms"
              : "Add your first environment variable"
          }
          action={{
            label: "Add Variable",
            onClick: () => setShowAddModal(true),
          }}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-glass-light-border dark:border-glass-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Key
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Updated
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-light-border dark:divide-glass-dark-border">
                {filteredVariables.map((variable) => {
                  const isRevealed = revealedIds.has(variable.id);
                  return (
                    <tr
                      key={variable.id}
                      className="hover:bg-glass-light dark:hover:bg-glass-dark transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                          <code className="font-mono font-medium text-text-primary-light dark:text-text-primary-dark">
                            {variable.key}
                          </code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {variable.error ? (
                              <span className="text-danger">Decryption failed</span>
                            ) : variable.masked && !canViewDecrypted ? (
                              variable.value
                            ) : isRevealed ? (
                              variable.value
                            ) : (
                              "••••••••"
                            )}
                          </code>
                          {variable.masked && (
                            <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                              (masked)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary-light dark:text-text-secondary-dark text-sm">
                        {new Date(variable.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 flex items-center justify-end">
                        {canViewDecrypted && !variable.error && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              onClick={() => toggleReveal(variable.id)}
                            >{null}</Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Copy className="w-4 h-4" />}
                              onClick={() => navigator.clipboard.writeText(variable.value)}
                            >{null}</Button>
                          </>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                        >{null}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Variable Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Variable"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Key"
            placeholder="DATABASE_URL"
            value={newVariable.key}
            onChange={(e) =>
              setNewVariable({ ...newVariable, key: e.target.value.toUpperCase() })
            }
          />
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Value
            </label>
            <textarea
              value={newVariable.value}
              onChange={(e) =>
                setNewVariable({ ...newVariable, value: e.target.value })
              }
              placeholder="Enter value..."
              className="w-full px-4 py-2 rounded-lg glass-input bg-glass-light-input dark:bg-glass-dark-input border border-glass-light-border dark:border-glass-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              rows={4}
            />
          </div>
          <Input
            label="Description (optional)"
            placeholder="What is this variable for?"
            value={newVariable.description}
            onChange={(e) =>
              setNewVariable({ ...newVariable, description: e.target.value })
            }
          />
          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Lock className="w-4 h-4 text-primary" />
            <p className="text-sm text-primary font-medium">
              Auto-encrypted with AES-256-GCM
            </p>
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddVariable}>
              Add Variable
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
