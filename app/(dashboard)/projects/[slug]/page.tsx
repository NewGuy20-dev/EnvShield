"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, Users, Trash2, Edit, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface ProjectDetails {
  id: string;
  name: string;
  description?: string;
  environmentsCount: number;
  membersCount: number;
  variablesCount: number;
  createdAt: string;
  role?: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/v1/projects/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data.project);
          setEditForm({
            name: data.project.name,
            description: data.project.description || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [slug]);

  const handleEdit = async () => {
    try {
      setEditLoading(true);
      const response = await fetch(`/api/v1/projects/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const data = await response.json();
        setProject((prev) => prev ? { ...prev, ...data.project } : null);
        setShowEditModal(false);
        
        // If slug changed, redirect to new URL
        if (data.project.slug !== slug) {
          router.push(`/projects/${data.project.slug}`);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      alert("Failed to update project");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/v1/projects/${slug}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/projects");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete project");
        setDeleteLoading(false);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      alert("Failed to delete project");
      setDeleteLoading(false);
    }
  };

  const canEdit = project?.role === "OWNER" || project?.role === "ADMIN";
  const canDelete = project?.role === "OWNER";

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
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
                onClick={() => setShowEditModal(true)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            )}
          </div>
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
            <Link href={`/projects/${slug}/environments`}>
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
            <Link href={`/projects/${slug}/members`}>
              <Button variant="primary" size="sm">
                Manage Team
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My Project"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Description (optional)
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Enter project description..."
              className="w-full px-4 py-2 rounded-lg glass-input bg-glass-light-input dark:bg-glass-dark-input border border-glass-light-border dark:border-glass-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              rows={4}
            />
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEdit}
              disabled={editLoading || !editForm.name}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-danger/10 rounded-lg border border-danger/20">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-danger mb-1">Warning: This action cannot be undone</p>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Deleting this project will permanently remove:
              </p>
              <ul className="text-sm text-text-secondary-light dark:text-text-secondary-dark list-disc list-inside mt-2 space-y-1">
                <li>All environments ({project.environmentsCount})</li>
                <li>All variables ({project.variablesCount})</li>
                <li>All team members ({project.membersCount})</li>
                <li>All audit logs</li>
              </ul>
            </div>
          </div>
          <div className="bg-glass-light dark:bg-glass-dark p-4 rounded-lg border border-glass-light-border dark:border-glass-dark-border">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Project to delete:
            </p>
            <p className="font-mono font-semibold text-text-primary-light dark:text-text-primary-dark">
              {project.name}
            </p>
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Project"}
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
