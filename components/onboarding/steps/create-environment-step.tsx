'use client';

import { useState, useEffect } from "react";
import { Database, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { OnboardingStepProps } from "../onboarding-wizard";

const PRESET_ENVIRONMENTS = [
  { name: "Development", slug: "development", description: "Local development environment" },
  { name: "Staging", slug: "staging", description: "Pre-production testing" },
  { name: "Production", slug: "production", description: "Live production environment" },
];

export function CreateEnvironmentStep({ onNext, onBack, stepData }: OnboardingStepProps) {
  const currentData = stepData?.['create-environment'] || {};
  const projectData = stepData?.['create-project'] || {};
  
  const [name, setName] = useState(currentData?.envName || "");
  const [description, setDescription] = useState(currentData?.envDescription || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [existingEnvironments, setExistingEnvironments] = useState<any[]>([]);
  const [checkingEnvironments, setCheckingEnvironments] = useState(true);

  // Get projectSlug from previous step data
  const projectSlug = projectData?.projectSlug;

  // Check for existing environments
  useEffect(() => {
    if (projectSlug) {
      checkExistingEnvironments();
    }
  }, [projectSlug]);

  const checkExistingEnvironments = async () => {
    try {
      const response = await fetch(`/api/v1/projects/${projectSlug}/environments`);
      if (response.ok) {
        const data = await response.json();
        setExistingEnvironments(data.environments || []);
      }
    } catch (error) {
      console.error('Failed to check existing environments:', error);
    } finally {
      setCheckingEnvironments(false);
    }
  };

  // Show error if project data is missing
  if (!projectSlug) {
    return (
      <Card className="p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-error/10">
            <AlertCircle className="w-12 h-12 text-error" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">
          Missing Project Information
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center">
          We couldn't find your project information. Please go back and create a project first.
        </p>

        <div className="p-4 rounded-lg bg-error/5 border border-error/20 mb-6">
          <p className="text-sm text-error">
            <strong>Debug Info:</strong> Project slug is missing from step data.
            <br />
            <code className="text-xs mt-2 block">
              {JSON.stringify(stepData, null, 2)}
            </code>
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={onBack}
          className="w-full"
        >
          Go Back to Project Creation
        </Button>
      </Card>
    );
  }

  const handlePresetSelect = (preset: typeof PRESET_ENVIRONMENTS[0]) => {
    setName(preset.name);
    setDescription(preset.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/projects/${projectSlug}/environments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create environment");
      }

      const environment = await response.json();
      onNext({ 
        envId: environment.id, 
        envSlug: environment.slug,
        envName: name,
        envDescription: description 
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If environments already exist, show them and allow skipping
  if (existingEnvironments.length > 0 && !checkingEnvironments) {
    return (
      <Card className="p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">
          Environments Already Created!
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center">
          Your project comes with {existingEnvironments.length} pre-configured environments.
        </p>

        {/* Show existing environments */}
        <div className="space-y-3 mb-8">
          {existingEnvironments.map((env) => (
            <div key={env.id} className="p-4 rounded-lg glass border border-success/20">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {env.name}
                  </h3>
                  {env.description && (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {env.description}
                    </p>
                  )}
                  <span className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 block">
                    /{env.slug}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-8">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <strong className="text-text-primary-light dark:text-text-primary-dark">💡 Good news!</strong> 
            {" "}These environments were automatically created for you. You can add more environments later from your project dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onNext({ 
              envId: existingEnvironments[0].id,
              envSlug: existingEnvironments[0].slug,
              envName: existingEnvironments[0].name,
              existingEnvironments: existingEnvironments.length
            })}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 md:p-12">
      <div className="flex justify-center mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <Database className="w-12 h-12 text-primary" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">
        Create Your First Environment
      </h2>
      <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center">
        Environments let you manage different sets of variables for dev, staging, and production.
      </p>

      {/* Preset Options */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PRESET_ENVIRONMENTS.map((preset) => (
          <button
            key={preset.slug}
            type="button"
            onClick={() => handlePresetSelect(preset)}
            className={`p-4 rounded-lg border-2 transition-all hover:border-primary/50 text-left ${
              name === preset.name
                ? "border-primary bg-primary/5"
                : "border-glass-light-border dark:border-glass-dark-border"
            }`}
            disabled={loading}
          >
            <div className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
              {preset.name}
            </div>
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {preset.description}
            </div>
          </button>
        ))}
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-glass-light-border dark:border-glass-dark-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background-light dark:bg-background-dark text-text-muted-light dark:text-text-muted-dark">
            or customize
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Environment Name"
          placeholder="Development"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Description (Optional)
          </label>
          <textarea
            placeholder="Brief description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={2}
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
            {loading ? "Creating..." : "Create Environment"}
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <strong className="text-text-primary-light dark:text-text-primary-dark">💡 Tip:</strong> 
          {" "}You can add more environments later (staging, production, etc.)
        </p>
      </div>
    </Card>
  );
}
