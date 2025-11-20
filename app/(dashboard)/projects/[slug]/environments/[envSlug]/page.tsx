"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Download, Upload, Eye, EyeOff, Trash2, Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ImportExportDrawer } from "@/components/variables/ImportExportDrawer";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { CopyButton } from "@/components/ui/copy-button";

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
  variablesCount?: number;
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
  const [environments, setEnvironments] = useState<EnvironmentInfo[]>([]);
  const [canViewDecrypted, setCanViewDecrypted] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVariable, setNewVariable] = useState({ key: "", value: "", description: "" });
  const [showImportDrawer, setShowImportDrawer] = useState(false);
  const [showExportDrawer, setShowExportDrawer] = useState(false);

  useEffect(() => {
    fetchVariables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, envSlug]);

  const fetchVariables = async () => {
    try {
      setLoading(true);
      const [variablesResponse, environmentsResponse] = await Promise.all([
        fetch(`/api/v1/projects/${slug}/environments/${envSlug}/variables`),
        fetch(`/api/v1/projects/${slug}/environments`),
      ]);

      if (variablesResponse.ok) {
        const data = await variablesResponse.json();
        setVariables(data.variables || []);
        setEnvironment(data.environment);
        setProject(data.project);
        setCanViewDecrypted(data.canViewDecrypted || false);
      }

      if (environmentsResponse.ok) {
        const envData = await environmentsResponse.json();
        setEnvironments(envData.environments || []);
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
            onClick={() => setShowExportDrawer(true)}
          >
            Export
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon={<Upload className="w-5 h-5" />}
            onClick={() => setShowImportDrawer(true)}
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

      <div className="grid gap-6 lg:grid-cols-[280px,minmax(0,1fr)]">
        {/* Environment List (left) */}
        <Card className="p-4 h-fit animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark uppercase tracking-wide">
                Environments
              </h2>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Switch between environments
              </p>
            </div>
            {environments.length > 0 && (
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                {environments.length} total
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Loading environments...
            </div>
          ) : environments.length === 0 ? (
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              No environments yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {environments.map((env) => {
                const isActive = env.slug === envSlug;
                return (
                  <li key={env.id}>
                    <Link
                      href={`/projects/${slug}/environments/${env.slug}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all border ${
                        isActive
                          ? "bg-primary/10 text-text-primary-light dark:text-text-primary-dark border-primary/40"
                          : "text-text-secondary-light dark:text-text-secondary-dark border-transparent hover:bg-glass-light dark:hover:bg-glass-dark hover:border-primary/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock
                          className={`w-3 h-3 ${
                            isActive
                              ? "text-primary"
                              : "text-text-muted-light dark:text-text-muted-dark"
                          }`}
                        />
                        <span className="font-medium">{env.name}</span>
                      </div>
                      {typeof env.variablesCount === "number" && (
                        <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                          {env.variablesCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Variables (right) */}
        <div className="space-y-6">
          {/* Search */}
          <div>
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
            <Table aria-label="Environment variables table">
              <TableHeader>
                <tr>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredVariables.map((variable) => {
                  const isRevealed = revealedIds.has(variable.id);
                  return (
                    <TableRow key={variable.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
                          <code className="font-mono font-medium text-text-primary-light dark:text-text-primary-dark">
                            {variable.key}
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {variable.error ? (
                              <span className="text-error">Decryption failed</span>
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
                      </TableCell>
                      <TableCell className="text-text-secondary-light dark:text-text-secondary-dark text-sm whitespace-nowrap">
                        {new Date(variable.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canViewDecrypted && !variable.error && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={
                                  isRevealed ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )
                                }
                                onClick={() => toggleReveal(variable.id)}
                                aria-label={isRevealed ? "Hide value" : "Reveal value"}
                                title={isRevealed ? "Hide value" : "Reveal value"}
                              >
                                {null}
                              </Button>
                              <CopyButton
                                text={variable.value}
                                variant="icon"
                                size="sm"
                                className="ml-1"
                              />
                            </>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            aria-label="Delete variable"
                            title="Delete variable"
                          >
                            {null}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

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

      {/* Import/Export Drawers */}
      <ImportExportDrawer
        isOpen={showImportDrawer}
        onClose={() => setShowImportDrawer(false)}
        mode="import"
        projectSlug={slug}
        envSlug={envSlug}
        onSuccess={fetchVariables}
      />
      <ImportExportDrawer
        isOpen={showExportDrawer}
        onClose={() => setShowExportDrawer(false)}
        mode="export"
        projectSlug={slug}
        envSlug={envSlug}
      />
    </div>
  );
}
