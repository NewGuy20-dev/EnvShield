"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Plus, Sparkles, Rocket, Shield, Zap, ChevronRight } from "lucide-react";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

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
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [nameError, setNameError] = useState("");

  const slugPreview = useMemo(() => {
    const base = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    return base || "your-project";
  }, [formData.name]);

  const steps = ["Project details", "Review & create"] as const;
  const isLastStep = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  // Character limits
  const NAME_MAX_LENGTH = 60;
  const DESCRIPTION_MAX_LENGTH = 200;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Project name is required");
      return;
    }

    if (!isLastStep) {
      setStep(1);
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
        setStep(0);
        onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to create project");
      }
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: "", description: "" });
      setStep(0);
      setError("");
      setNameError("");
      onClose();
    }
  };

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError("Project name is required");
      return false;
    }
    if (name.length < 3) {
      setNameError("Name must be at least 3 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Enhanced Progress Bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-glass-light dark:bg-glass-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-500 ease-out shadow-glow-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {/* Modern Step Indicator */}
          <div className="flex items-center justify-between gap-2">
            {steps.map((label, index) => {
              const active = index === step;
              const completed = index < step;
              return (
                <div key={label} className="flex-1 flex items-center gap-2">
                  <div
                    className={clsx(
                      "flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-300 w-full",
                      "group relative overflow-hidden",
                      {
                        "border-primary bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 text-primary shadow-glow-primary/20 scale-105": active,
                        "border-success bg-success/10 text-success shadow-sm": completed,
                        "border-glass-light-border dark:border-glass-dark-border text-text-muted-light dark:text-text-muted-dark bg-glass-light/30 dark:bg-glass-dark/30": !active && !completed,
                      }
                    )}
                  >
                    {/* Animated background shimmer for active step */}
                    {active && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
                    )}
                    
                    <div className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 relative z-10",
                      {
                        "bg-primary text-white shadow-lg shadow-primary/30": active,
                        "bg-success text-white": completed,
                        "border-2 border-current": !active && !completed,
                      }
                    )}>
                      {completed ? (
                        <Check className="w-4 h-4 animate-scale-in" />
                      ) : active ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className={clsx(
                      "text-sm font-semibold tracking-tight relative z-10 transition-all duration-300",
                      active && "text-shadow"
                    )}>
                      {label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className={clsx(
                      "w-4 h-4 flex-shrink-0 transition-all duration-300",
                      completed ? "text-success" : "text-text-muted-light dark:text-text-muted-dark"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {step === 0 && (
            <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr] animate-fade-in">
              <div className="space-y-6">
                {/* Name Input with Character Counter */}
                <div className="space-y-2">
                  <Input
                    label="Project name"
                    placeholder="My Awesome Project"
                    value={formData.name}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, NAME_MAX_LENGTH);
                      setFormData({ ...formData, name: value });
                      if (value.trim()) validateName(value);
                    }}
                    onBlur={() => formData.name && validateName(formData.name)}
                    required
                    autoFocus
                    spellCheck={false}
                    error={nameError}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={clsx(
                      "transition-colors duration-200",
                      nameError ? "text-error" : "text-text-muted-light dark:text-text-muted-dark"
                    )}>
                      {nameError || "Choose a memorable name for your project"}
                    </span>
                    <span className={clsx(
                      "font-medium transition-colors duration-200",
                      formData.name.length >= NAME_MAX_LENGTH * 0.9 ? "text-warning" : "text-text-muted-light dark:text-text-muted-dark"
                    )}>
                      {formData.name.length}/{NAME_MAX_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Description with Character Counter */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    Description <span className="text-text-muted-light dark:text-text-muted-dark font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={formData.description}
                      onChange={(e) => {
                        const value = e.target.value.slice(0, DESCRIPTION_MAX_LENGTH);
                        setFormData({ ...formData, description: value });
                      }}
                      placeholder="Describe how this project will be used..."
                      className={clsx(
                        "w-full px-4 py-3 rounded-xl glass-input bg-glass-light-input dark:bg-glass-dark-input",
                        "border border-glass-light-border dark:border-glass-dark-border",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                        "hover:border-primary/40 transition-all duration-300",
                        "resize-none min-h-[120px] text-sm text-text-primary-light dark:text-text-primary-dark",
                        "placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark"
                      )}
                    />
                    <div className="absolute bottom-3 right-3 text-xs font-medium text-text-muted-light dark:text-text-muted-dark">
                      {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Help your team understand the purpose of this project
                  </p>
                </div>

                {error && (
                  <div className="p-4 border border-error/20 bg-error/10 rounded-xl text-sm text-error flex items-center gap-2 animate-shake">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </div>

              <Card className="p-6 h-full space-y-5 border-2 border-primary/20 shadow-glow-primary/10 hover:shadow-glow-primary/20 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">
                      Live preview
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-glass-light to-glass-light/50 dark:from-glass-dark dark:to-glass-dark/50 border border-primary/30">
                    <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                      {formData.name || <span className="text-text-muted-light dark:text-text-muted-dark italic">Project name</span>}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      <span>Slug:</span>
                      <code className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {slugPreview}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-4 group hover:border-success/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-4 h-4 text-success" />
                      <p className="text-sm font-semibold text-success">
                        Launch ready defaults
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-text-secondary-light dark:text-text-secondary-dark">
                      We create development, staging, and production environments after setup so you can secure secrets immediately.
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4 group hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold text-primary">
                        Pro Tip
                      </p>
                    </div>
                    <p className="text-xs text-primary/90 leading-relaxed">
                      Use a short memorable name. You can add advanced settings once the project is created.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr] animate-fade-in">
              <Card className="p-6 space-y-5 border-2 border-success/30 shadow-glow-success/10">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-success/20 to-success/10">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark font-bold">
                      Project overview
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-glass-light to-glass-light/50 dark:from-glass-dark dark:to-glass-dark/50 border border-success/30">
                    <h3 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                      {formData.name}
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      {formData.description || <span className="italic text-text-muted-light dark:text-text-muted-dark">No description provided.</span>}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 hover:border-primary/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">
                        Project slug
                      </p>
                    </div>
                    <code className="block text-lg font-bold font-mono text-primary bg-primary/10 px-3 py-2 rounded-lg mb-2">
                      {slugPreview}
                    </code>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                      This unique identifier powers CLI syncs and dashboard URLs.
                    </p>
                  </div>
                  <div className="rounded-xl border border-success/30 bg-gradient-to-br from-success/10 to-success/5 p-4 hover:border-success/50 transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-4 h-4 text-success" />
                      <p className="text-sm font-semibold text-success">
                        Next steps
                      </p>
                    </div>
                    <ul className="space-y-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                        <span>Invite your team from the Members tab</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                        <span>Connect CI using an API token</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                        <span>Push local secrets securely with the CLI</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col gap-4">
                {error && (
                  <div className="p-4 border border-error/20 bg-error/10 rounded-xl text-sm text-error flex items-center gap-2 animate-shake">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <Card className="p-6 space-y-5 border-2 border-primary/20 shadow-glow-primary/10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/10">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                      Ready to Launch
                    </h4>
                  </div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                    You are about to create a new secure workspace. We will assign you as the owner and prepare environment shells so you can sync variables instantly.
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold text-primary">Quick Setup</p>
                      </div>
                      <p className="text-xs text-primary/90 leading-relaxed">
                        Creating a project is instant and you can rename or archive it later in settings.
                      </p>
                    </div>
                    <div className="rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-secondary" />
                        <p className="text-sm font-semibold text-secondary">Secure by Default</p>
                      </div>
                      <p className="text-xs text-secondary/90 leading-relaxed">
                        All secrets are encrypted with AES-256-GCM before storage.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        <ModalFooter className="justify-between items-center border-t border-glass-light-border dark:border-glass-dark-border pt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              {Array.from({ length: steps.length }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    "h-2 rounded-full transition-all duration-300",
                    i === step 
                      ? "w-8 bg-primary shadow-glow-primary/30" 
                      : i < step 
                        ? "w-2 bg-success" 
                        : "w-2 bg-glass-light-border dark:bg-glass-dark-border"
                  )}
                />
              ))}
            </div>
            <span className="text-text-muted-light dark:text-text-muted-dark font-medium ml-2">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={step === 0 ? handleClose : () => setStep(step - 1)}
              disabled={loading}
              size="md"
            >
              {step === 0 ? "Cancel" : "Back"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={isLastStep ? <Rocket className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              disabled={loading || (step === 0 && !!nameError)}
              size="md"
            >
              {loading ? "Creating..." : isLastStep ? "Create Project" : "Continue"}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
