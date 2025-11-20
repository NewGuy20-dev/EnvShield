"use client";

import { use, useEffect, useState } from "react";
import { Plus, Key, Trash2, Calendar, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { CreateServiceAccountModal } from "@/components/settings/CreateServiceAccountModal";
import { GenerateTokenModal } from "@/components/settings/GenerateTokenModal";
import { DeleteServiceAccountModal } from "@/components/settings/DeleteServiceAccountModal";

interface ServiceAccount {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    creator: {
        name: string;
        email: string;
    };
    tokens: {
        id: string;
        name: string | null;
        lastUsedAt: string | null;
        expiresAt: string | null;
        createdAt: string;
    }[];
}

export default function ServiceAccountsPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = use(params);
    const { addToast } = useToast();
    const [serviceAccounts, setServiceAccounts] = useState<ServiceAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<ServiceAccount | null>(null);

    const fetchServiceAccounts = async () => {
        try {
            const response = await fetch(`/api/v1/projects/${slug}/service-accounts`);
            if (response.ok) {
                const data = await response.json();
                setServiceAccounts(data.serviceAccounts || []);
            }
        } catch (error) {
            console.error("Failed to fetch service accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServiceAccounts();
    }, [slug]);

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        fetchServiceAccounts();
        addToast({
            type: "success",
            title: "Service account created",
            message: "You can now generate API tokens for this account.",
        });
    };

    const handleTokenGenerated = () => {
        setShowTokenModal(false);
        fetchServiceAccounts();
        addToast({
            type: "success",
            title: "Token generated",
            message: "Copy and store it securely; it will only be shown once.",
        });
    };

    const handleDeleteSuccess = () => {
        setShowDeleteModal(false);
        setSelectedAccount(null);
        fetchServiceAccounts();
        addToast({
            type: "success",
            title: "Service account deleted",
            message: "All associated tokens for this account have been revoked.",
        });
    };

    const openTokenModal = (account: ServiceAccount) => {
        setSelectedAccount(account);
        setShowTokenModal(true);
    };

    const openDeleteModal = (account: ServiceAccount) => {
        setSelectedAccount(account);
        setShowDeleteModal(true);
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="Service Accounts"
                description="Machine users for CI/CD pipelines and automation"
                actions={
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<Plus className="w-5 h-5" />}
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Service Account
                    </Button>
                }
            />

            {/* Service Accounts List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : serviceAccounts.length === 0 ? (
                <Card className="p-12 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Key className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                            No service accounts yet
                        </h3>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            Create a service account to generate API tokens for CI/CD pipelines
                        </p>
                        <Button
                            variant="primary"
                            icon={<Plus className="w-5 h-5" />}
                            onClick={() => setShowCreateModal(true)}
                        >
                            Create First Service Account
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4 animate-slide-up animation-delay-100">
                    {serviceAccounts.map((account) => (
                        <Card key={account.id} className="p-6 hover-lift">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                                            {account.name}
                                        </h3>
                                        <Badge variant="primary" size="sm">
                                            {account.tokens.length} {account.tokens.length === 1 ? 'token' : 'tokens'}
                                        </Badge>
                                    </div>
                                    {account.description && (
                                        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-3">
                                            {account.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-6 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Created {new Date(account.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            By {account.creator.name}
                                        </div>
                                        {account.tokens.length > 0 && account.tokens.some(t => t.lastUsedAt) && (
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4" />
                                                Last used {new Date(
                                                    account.tokens
                                                        .filter(t => t.lastUsedAt)
                                                        .sort((a, b) =>
                                                            new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime()
                                                        )[0]?.lastUsedAt || ''
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={<Key className="w-4 h-4" />}
                                        onClick={() => openTokenModal(account)}
                                    >
                                        Generate Token
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        icon={<Trash2 className="w-4 h-4" />}
                                        onClick={() => openDeleteModal(account)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {/* Tokens List */}
                            {account.tokens.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-glass-light-border dark:border-glass-dark-border animate-fade-in">
                                    <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                                        Active Tokens
                                    </h4>
                                    <div className="space-y-2">
                                        {account.tokens.map((token) => (
                                            <div
                                                key={token.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-glass-light/50 dark:bg-glass-dark/50"
                                            >
                                                <div>
                                                    <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                                                        {token.name || 'Unnamed token'}
                                                    </span>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                                        <span>Created {new Date(token.createdAt).toLocaleDateString()}</span>
                                                        {token.lastUsedAt && (
                                                            <span>Last used {new Date(token.lastUsedAt).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {token.expiresAt && (
                                                    <Badge
                                                        variant={new Date(token.expiresAt) < new Date() ? "error" : "default"}
                                                        size="sm"
                                                    >
                                                        {new Date(token.expiresAt) < new Date()
                                                            ? 'Expired'
                                                            : `Expires ${new Date(token.expiresAt).toLocaleDateString()}`
                                                        }
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <CreateServiceAccountModal
                    projectSlug={slug}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {showTokenModal && selectedAccount && (
                <GenerateTokenModal
                    projectSlug={slug}
                    serviceAccount={selectedAccount}
                    onClose={() => setShowTokenModal(false)}
                    onSuccess={handleTokenGenerated}
                />
            )}

            {showDeleteModal && selectedAccount && (
                <DeleteServiceAccountModal
                    projectSlug={slug}
                    serviceAccount={selectedAccount}
                    onClose={() => setShowDeleteModal(false)}
                    onSuccess={handleDeleteSuccess}
                />
            )}
        </div>
    );
}
