"use client";

import { useState } from "react";
import { X, Copy, Check, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface GenerateTokenModalProps {
    projectSlug: string;
    serviceAccount: {
        id: string;
        name: string;
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function GenerateTokenModal({
    projectSlug,
    serviceAccount,
    onClose,
    onSuccess,
}: GenerateTokenModalProps) {
    const [tokenName, setTokenName] = useState("");
    const [expiresInDays, setExpiresInDays] = useState<number | "">(90);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [generatedToken, setGeneratedToken] = useState("");
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `/api/v1/projects/${projectSlug}/service-accounts/${serviceAccount.id}/tokens`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: tokenName || undefined,
                        expiresInDays: expiresInDays || undefined,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to generate token");
            }

            const data = await response.json();
            setGeneratedToken(data.rawToken);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedToken);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        if (generatedToken) {
            onSuccess();
        } else {
            onClose();
        }
    };

    return (
        <Modal onClose={handleClose}>
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl rounded-2xl p-6 w-full max-w-2xl border border-glass-light-border dark:border-glass-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                                Generate API Token
                            </h2>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                for {serviceAccount.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-glass-light dark:hover:bg-glass-dark rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                </div>

                {!generatedToken ? (
                    /* Token Configuration Form */
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Token Name (optional)
                            </label>
                            <Input
                                type="text"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                                placeholder="Production Deploy"
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Expires In (days)
                            </label>
                            <Input
                                type="number"
                                value={expiresInDays}
                                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : "")}
                                placeholder="90"
                                min={1}
                                max={365}
                            />
                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                Leave empty for no expiration. Maximum 365 days.
                            </p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                                <p className="text-sm text-danger">{error}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={handleClose} type="button">
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" loading={loading}>
                                Generate Token
                            </Button>
                        </div>
                    </form>
                ) : (
                    /* Token Display (One-Time Only!) */
                    <div className="space-y-4">
                        {/* Warning */}
                        <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-warning mb-1">Save this token now</p>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                    For security reasons, this token will only be shown once. Copy it and store it securely.
                                </p>
                            </div>
                        </div>

                        {/* Token Display */}
                        <div>
                            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                API Token
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-4 py-3 rounded-xl bg-glass-light dark:bg-glass-dark border border-glass-light-border dark:border-glass-dark-border font-mono text-sm text-text-primary-light dark:text-text-primary-dark overflow-x-auto">
                                    {generatedToken}
                                </div>
                                <Button
                                    variant={copied ? "success" : "secondary"}
                                    size="lg"
                                    icon={copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    onClick={handleCopy}
                                >
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                            </div>
                        </div>

                        {/* Usage Instructions */}
                        <div className="p-4 rounded-xl bg-glass-light/50 dark:bg-glass-dark/50 border border-glass-light-border dark:border-glass-dark-border">
                            <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                                Usage in CLI:
                            </p>
                            <div className="px-3 py-2 rounded-lg bg-black/80 border border-white/10 font-mono text-xs text-green-400 overflow-x-auto">
                                export ENVSHIELD_TOKEN="{generatedToken}"<br />
                                envshield pull --env my-project/production
                            </div>
                            <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2 mt-4">
                                Usage in API:
                            </p>
                            <div className="px-3 py-2 rounded-lg bg-black/80 border border-white/10 font-mono text-xs text-green-400 overflow-x-auto">
                                Authorization: Bearer {generatedToken}
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-4">
                            <Button variant="primary" onClick={handleClose}>
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
