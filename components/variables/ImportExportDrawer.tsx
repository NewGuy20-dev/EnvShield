"use client";

import { useState } from "react";
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ImportFormat = "dotenv" | "json" | "yaml";
type ConflictStrategy = "overwrite" | "skip" | "merge";
type DrawerMode = "import" | "export";

interface DiffItem {
  key: string;
  value?: string;
  oldValue?: string;
  newValue?: string;
}

interface DiffResult {
  added: DiffItem[];
  updated: DiffItem[];
  unchanged: string[];
}

interface ImportExportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: DrawerMode;
  projectSlug: string;
  envSlug: string;
  onSuccess?: () => void;
}

export function ImportExportDrawer({
  isOpen,
  onClose,
  mode,
  projectSlug,
  envSlug,
  onSuccess,
}: ImportExportDrawerProps) {
  const [format, setFormat] = useState<ImportFormat>("dotenv");
  const [strategy, setStrategy] = useState<ConflictStrategy>("merge");
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setSuccess("");

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    reader.onerror = () => {
      setError("Failed to read file");
    };
    reader.readAsText(selectedFile);
  };

  const handleDryRun = async () => {
    if (!content) {
      setError("Please select a file first");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/v1/projects/${projectSlug}/environments/${envSlug}/variables/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            content,
            strategy,
            dryRun: true,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to preview import");
      }

      const data = await response.json();
      setDiff(data.diff);
      setShowDiff(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview import");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!content) {
      setError("Please select a file first");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/v1/projects/${projectSlug}/environments/${envSlug}/variables/import`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            content,
            strategy,
            dryRun: false,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to import variables");
      }

      const data = await response.json();
      setImportResult(data.result);
      setSuccess(data.message);
      
      // Reset form after successful import
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import variables");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/v1/projects/${projectSlug}/environments/${envSlug}/variables/export?format=${format}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to export variables");
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const extensions = { dotenv: "env", json: "json", yaml: "yaml" };
      a.download = `${projectSlug}_${envSlug}.${extensions[format]}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess("Variables exported successfully");
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export variables");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setContent("");
    setError("");
    setSuccess("");
    setShowDiff(false);
    setDiff(null);
    setImportResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={mode === "import" ? "Import Variables" : "Export Variables"}>
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Format</label>
          <div className="grid grid-cols-3 gap-3">
            {(["dotenv", "json", "yaml"] as ImportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  format === fmt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-glass-light-border dark:border-glass-dark-border hover:border-primary/50"
                }`}
              >
                <FileText className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium uppercase">{fmt}</div>
              </button>
            ))}
          </div>
        </div>

        {mode === "import" && (
          <>
            {/* Conflict Strategy */}
            <div>
              <label className="block text-sm font-medium mb-2">Conflict Strategy</label>
              <div className="space-y-2">
                {(["merge", "overwrite", "skip"] as ConflictStrategy[]).map((strat) => (
                  <label
                    key={strat}
                    className="flex items-start gap-3 p-3 rounded-lg border border-glass-light-border dark:border-glass-dark-border hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={strat}
                      checked={strategy === strat}
                      onChange={(e) => setStrategy(e.target.value as ConflictStrategy)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{strat}</div>
                      <div className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
                        {strat === "merge" && "Add new variables, update existing ones"}
                        {strat === "overwrite" && "Replace all existing variables with imported ones"}
                        {strat === "skip" && "Only add new variables, skip existing ones"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <div className="relative">
                <input
                  type="file"
                  accept={format === "dotenv" ? ".env" : format === "json" ? ".json" : ".yaml,.yml"}
                  onChange={handleFileChange}
                  className="block w-full text-sm text-text-secondary-light dark:text-text-secondary-dark
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary/90
                    cursor-pointer"
                />
              </div>
              {file && (
                <div className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            {/* Diff Preview */}
            {showDiff && diff && (
              <div className="border border-glass-light-border dark:border-glass-dark-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Info className="w-4 h-4 text-primary" />
                  <span>Import Preview</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {diff.added.length}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      To Add
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {diff.updated.length}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      To Update
                    </div>
                  </div>
                  <div className="p-3 bg-gray-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {diff.unchanged.length}
                    </div>
                    <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                      Unchanged
                    </div>
                  </div>
                </div>

                {diff.added.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                      New Variables:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {diff.added.map((item) => (
                        <div key={item.key} className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                          + {item.key}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {diff.updated.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
                      Updated Variables:
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {diff.updated.map((item) => (
                        <div key={item.key} className="text-xs font-mono text-text-secondary-light dark:text-text-secondary-dark">
                          ~ {item.key}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="border border-green-500 rounded-lg p-4 bg-green-500/10">
                <div className="flex items-center gap-2 font-medium text-green-600 dark:text-green-400 mb-3">
                  <CheckCircle className="w-4 h-4" />
                  <span>Import Successful</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div>Created: {importResult.created}</div>
                  <div>Updated: {importResult.updated}</div>
                  <div>Skipped: {importResult.skipped}</div>
                  {importResult.errors.length > 0 && (
                    <div className="text-red-600 dark:text-red-400">
                      Errors: {importResult.errors.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500 rounded-lg text-green-600 dark:text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {mode === "import" && (
            <>
              <Button
                variant="secondary"
                onClick={handleDryRun}
                disabled={loading || !content}
                className="flex-1"
              >
                Preview Changes
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={loading || !content}
                loading={loading}
                icon={<Upload className="w-4 h-4" />}
                className="flex-1"
              >
                {loading ? "Importing..." : "Import"}
              </Button>
            </>
          )}
          {mode === "export" && (
            <Button
              variant="primary"
              onClick={handleExport}
              disabled={loading}
              loading={loading}
              icon={<Download className="w-4 h-4" />}
              className="w-full"
            >
              {loading ? "Exporting..." : "Export"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
