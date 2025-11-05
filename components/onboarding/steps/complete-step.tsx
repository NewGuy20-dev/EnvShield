'use client';

import { useState } from "react";
import { CheckCircle, Terminal, ArrowRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingStepProps } from "../onboarding-wizard";

export function CompleteStep({ onNext, stepData }: OnboardingStepProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectData = stepData?.['create-project'] || {};
  const envData = stepData?.['create-environment'] || {};
  
  const projectSlug = projectData?.projectSlug;
  const envSlug = envData?.envSlug;

  const cliCommands = [
    `npm install -g @envshield/cli`,
    `envshield login`,
    `envshield init ${projectSlug}`,
    `envshield pull ${envSlug}`,
  ];

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Mark onboarding as complete
      await fetch("/api/v1/user/complete-onboarding", {
        method: "POST",
      });
      
      onNext();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      // Continue anyway
      onNext();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cliCommands.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-8 md:p-12">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-full bg-success/10 animate-glow-pulse">
          <CheckCircle className="w-16 h-16 text-success" />
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3 text-center">
        You're All Set! 🎉
      </h2>
      <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center max-w-xl mx-auto">
        Your project and environment are ready. Now you can start adding environment variables!
      </p>

      {/* Quick Stats */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-lg glass text-center">
          <div className="text-3xl font-bold text-primary mb-1">
            {projectData?.name || "Project"}
          </div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Your first project
          </div>
        </div>
        <div className="p-4 rounded-lg glass text-center">
          <div className="text-3xl font-bold text-secondary mb-1">
            {envData?.envName || "Environment"}
          </div>
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            First environment created
          </div>
        </div>
      </div>

      {/* CLI Setup (Optional) */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Optional: Install CLI
          </h3>
        </div>
        
        <div className="relative">
          <div className="p-4 rounded-lg bg-black/90 dark:bg-black/50 font-mono text-sm text-green-400 overflow-x-auto">
            {cliCommands.map((cmd, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="text-gray-500">$ </span>
                {cmd}
              </div>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 p-2 rounded hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2">
          You can also manage everything from the web dashboard
        </p>
      </div>

      {/* Next Steps */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-8">
        <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
          What's next?
        </h4>
        <ul className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Add environment variables to your {envData?.envName || "environment"}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Invite team members to collaborate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Create additional environments (staging, production)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Set up the CLI for git-like workflow</span>
          </li>
        </ul>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={handleComplete}
        loading={loading}
        icon={<ArrowRight className="w-5 h-5" />}
        className="w-full"
      >
        {loading ? "Finishing up..." : "Go to Dashboard"}
      </Button>
    </Card>
  );
}
