"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FolderOpen, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingCard } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/components/ui/toast";
import { CreateProjectModal } from "@/components/dashboard/create-project-modal";

interface Project {
  id: string;
  name: string;
  description?: string;
  slug: string;
  environmentsCount: number;
  variablesCount: number;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      addToast({
        type: "error",
        title: "Failed to load projects",
        message: "Please try again or check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Projects"
        description="Manage your projects and their environments"
        actions={
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Project
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-8 max-w-xl animate-slide-in animation-delay-100">
        <Input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="w-16 h-16" />}
          title={search ? "No projects found" : "No projects yet"}
          description={
            search
              ? "Try adjusting your search terms"
              : "Create your first project to get started"
          }
          action={
            <Button
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <Link key={project.id} href={`/projects/${project.slug}`}>
              <Card
                variant="interactive"
                className="p-6 h-full animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FolderOpen className="w-6 h-6 text-primary" />
                  </div>
                  <Lock className="w-5 h-5 text-text-muted-light dark:text-text-muted-dark" />
                </div>

                <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                  {project.name}
                </h3>

                {project.description && (
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="flex gap-2 mb-4 flex-wrap">
                  <Badge variant="primary" size="sm">
                    {project.environmentsCount} environments
                  </Badge>
                  <Badge variant="primary" size="sm">
                    {project.variablesCount} variables
                  </Badge>
                </div>

                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
