"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";

interface Environment {
  id: string;
  name: string;
  slug: string;
  description?: string;
  variablesCount: number;
}

export default function EnvironmentsPage({ params }: { params: { slug: string } }) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnvironments = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${params.slug}/environments`);
        if (response.ok) {
          const data = await response.json();
          setEnvironments(data.environments || []);
        }
      } catch (error) {
        console.error("Failed to fetch environments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvironments();
  }, [params.slug]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
            Environments
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Manage dev, staging, and production environments
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
        >
          New Environment
        </Button>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {environments.map((env) => (
            <Link key={env.id} href={`/projects/${params.slug}/environments/${env.slug}`}>
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

                <Badge variant="secondary" size="sm" icon={<Lock className="w-3 h-3" />}>
                  {env.variablesCount} variables
                </Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
