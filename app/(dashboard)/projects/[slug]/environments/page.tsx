"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Lock, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface Environment {
  id: string;
  name: string;
  slug: string;
  description?: string;
  variablesCount: number;
}

export default function EnvironmentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${slug}/environments`);
        if (response.ok) {
          const data = await response.json();
          setEnvironments(data.environments || []);
        }
      } catch (error) {
        console.error("Failed to fetch environments:", error);
        addToast({
          type: "error",
          title: "Failed to load environments",
          message: "Please try again or check your connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, [slug]);

  const filteredEnvironments = environments.filter((env) =>
    env.name.toLowerCase().includes(search.toLowerCase()) ||
    env.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Environments"
        description="Manage dev, staging, and production environments"
        actions={
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
          >
            New Environment
          </Button>
        }
      />

      {/* Environments Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : environments.length === 0 ? (
        <EmptyState
          icon={<Lock className="w-12 h-12" />}
          title="No environments yet"
          description="Create your first environment to get started"
          action={{
            label: "Create Environment",
            onClick: () => {},
          }}
        />
      ) : (
        <div className="space-y-6 animate-slide-up">
          <div className="max-w-md">
            <Input
              type="search"
              placeholder="Search environments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          {filteredEnvironments.length === 0 ? (
            <EmptyState
              icon={<Lock className="w-12 h-12" />}
              title="No environments match your search"
              description="Try adjusting your search terms."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnvironments.map((env) => (
                <Link key={env.id} href={`/projects/${slug}/environments/${env.slug}`}>
                  <Card variant="interactive" className="p-6 h-full">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {env.name}
                        </h3>
                        {env.description && (
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            {env.description}
                          </p>
                        )}
                      </div>
                      <Zap className="w-5 h-5 text-secondary" />
                    </div>

                    <Badge variant="primary" size="sm" icon={<Lock className="w-3 h-3" />}>
                      {env.variablesCount} variables
                    </Badge>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
