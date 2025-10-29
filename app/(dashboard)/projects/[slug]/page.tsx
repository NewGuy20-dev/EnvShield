"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Users, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  environmentsCount: number;
  membersCount: number;
  variablesCount: number;
  createdAt: string;
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${params.slug}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Project not found
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {project.description}
              </p>
            )}
          </div>
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}>
            Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-1">Environments</p>
              <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {project.environmentsCount}
              </p>
            </div>
            <FileText className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-1">Variables</p>
              <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {project.variablesCount}
              </p>
            </div>
            <Plus className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover-lift">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted-light dark:text-text-muted-dark mb-1">Team Members</p>
              <p className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {project.membersCount}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative">
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
              Environments
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Manage dev, staging, and production environments
            </p>
            <Link href={`/projects/${params.slug}/environments`}>
              <Button variant="primary" size="sm">
                Manage Environments
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent" />
          <div className="relative">
            <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
              Team
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Invite team members and manage permissions
            </p>
            <Link href={`/projects/${params.slug}/members`}>
              <Button variant="primary" size="sm">
                Manage Team
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
