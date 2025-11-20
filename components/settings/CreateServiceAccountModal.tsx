"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface CreateServiceAccountModalProps {
    projectSlug: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateServiceAccountModal({
    projectSlug,
    onClose,
    onSuccess,
}: CreateServiceAccountModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`/api/v1/projects/${projectSlug}/service-accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to create service account");
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="bg-glass-light dark:bg-glass-dark backdrop-blur-xl rounded-2xl p-6 w-full max-w-md border border-glass-light-border dark:border-glass-dark-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                        Create Service Account
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-glass-light dark:hover:bg-glass-dark rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Name *
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="CI/CD Bot"
                            required
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Used for automated deployments..."
                            maxLength={500}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-glass-light dark:bg-glass-dark border border-glass-light-border dark:border-glass-dark-border text-text-primary-light dark:text-text-primary-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" loading={loading}>
                            Create Service Account
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
