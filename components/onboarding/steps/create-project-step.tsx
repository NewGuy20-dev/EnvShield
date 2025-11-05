'use client';

import { useState } from "react";
import { FolderPlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OnboardingStepProps } from "../onboarding-wizard";

export function CreateProjectStep({ onNext, onBack, stepData }: OnboardingStepProps) {
  const currentData = stepData?.['create-project'] || {};
  const [name, setName] = useState(currentData?.name || "");
  const [description, setDescription] = useState(currentData?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create project");
      }

      const responseData = await response.json();
      
      // API returns { message: "...", project: { id, slug, ... } }
      const project = responseData.project || responseData;
      
      onNext({ 
        projectId: project.id, 
        projectSlug: project.slug, 
        name: project.name || name, 
        description: project.description || description 
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 md:p-12">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <FolderPlus className="w-12 h-12 text-primary" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">
        Create Your First Project
      </h2>
      <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center">
        Projects help you organize your environment variables by application or service.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <Input
            label="Project Name"
            placeholder="My Awesome App"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
          <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            A descriptive name for your project
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Description (Optional)
          </label>
          <textarea
            placeholder="A brief description of your project..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            className="w-full px-4 py-3 rounded-lg glass border border-glass-light-border dark:border-glass-dark-border 
                     focus:outline-none focus:ring-2 focus:ring-primary/50 
                     text-text-primary-light dark:text-text-primary-dark
                     placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={loading}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!name.trim() || loading}
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <strong className="text-text-primary-light dark:text-text-primary-dark">💡 Tip:</strong> 
          {" "}You can create more projects later from your dashboard.
        </p>
      </div>
    </Card>
  );
}
