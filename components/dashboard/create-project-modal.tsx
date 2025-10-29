"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ name: "", description: "" });
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to create project");
      }
    } catch (err) {
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: "", description: "" });
      setError("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="md">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          <Input
            label="Project Name"
            placeholder="My Awesome Project"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What is this project for?"
              className="w-full px-4 py-2 rounded-lg glass-input bg-glass-light-input dark:bg-glass-dark-input border border-glass-light-border dark:border-glass-dark-border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              <strong className="text-primary">Note:</strong> A project organizes your environment variables across different environments (development, staging, production, etc.).
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
