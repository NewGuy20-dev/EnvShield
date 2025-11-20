"use client";

import { useState } from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

interface DeleteServiceAccountModalProps {
    projectSlug: string;
    serviceAccount: {
        id: string;
        name: string;
        tokens: any[];
    };
    onClose: () => void;
    onSuccess: () => void;
}

export function DeleteServiceAccountModal({
    projectSlug,
    serviceAccount,
    onClose,
    onSuccess,
}: DeleteServiceAccountModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmText, setConfirmText] = useState("");

    const handleDelete = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                `/api/v1/projects/${projectSlug}/service-accounts/${serviceAccount.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to delete service account");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const isConfirmed = confirmText === serviceAccount.name;

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-glass-light-border dark:border-glass-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-danger" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                            Delete Service Account
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-glass-light dark:hover:bg-glass-dark rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                </div>

                {/* Warning Message */}
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                        <p className="text-sm text-danger font-medium mb-2">
                            This action cannot be undone
                        </p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            Deleting this service account will:
                        </p>
                        <ul className="list-disc list-inside text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2 space-y-1">
                            <li>Permanently delete the service account</li>
                            <li>Revoke all {serviceAccount.tokens.length} associated API {serviceAccount.tokens.length === 1 ? 'token' : 'tokens'}</li>
                            <li>Break any CI/CD pipelines using these tokens</li>
                        </ul>
                    </div>

                    {/* Service Account Info */}
                    <div className="p-4 rounded-xl bg-glass-light/50 dark:bg-glass-dark/50 border border-glass-light-border dark:border-glass-dark-border">
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                            Service Account
                        </p>
                        <p className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {serviceAccount.name}
                        </p>
                        {serviceAccount.tokens.length > 0 && (
                            <p className="text-sm text-danger mt-2">
                                {serviceAccount.tokens.length} active {serviceAccount.tokens.length === 1 ? 'token' : 'tokens'} will be revoked
                            </p>
                        )}
                    </div>

                    {/* Confirmation Input */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Type <span className="font-mono font-bold">{serviceAccount.name}</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder={serviceAccount.name}
                            className="w-full px-4 py-3 rounded-xl bg-glass-light dark:bg-glass-dark border border-glass-light-border dark:border-glass-dark-border text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-danger/50"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            loading={loading}
                            disabled={!isConfirmed}
                            icon={<Trash2 className="w-4 h-4" />}
                        >
                            Delete Service Account
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
