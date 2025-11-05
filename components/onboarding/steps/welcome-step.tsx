'use client';

import { Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OnboardingStepProps } from "../onboarding-wizard";
import { useSession } from "@/lib/auth-client";

export function WelcomeStep({ onNext }: OnboardingStepProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name || "there";

  return (
    <Card className="p-8 md:p-12 text-center">
      <div className="flex justify-center mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 animate-glow-pulse">
          <Shield className="w-16 h-16 text-primary" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
        Welcome to EnvShield, {userName}! 👋
      </h1>

      <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-8 max-w-xl mx-auto">
        Let's get you set up in just a few steps. We'll help you create your first project 
        and environment to start securely managing your secrets.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
        <div className="p-4 rounded-lg glass">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
          </div>
          <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
            Secure
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            AES-256-GCM encryption
          </p>
        </div>

        <div className="p-4 rounded-lg glass">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">⚡</span>
            </div>
          </div>
          <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
            Fast
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Git-like CLI workflow
          </p>
        </div>

        <div className="p-4 rounded-lg glass">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
          </div>
          <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
            Team-Ready
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Collaborate securely
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8 text-sm text-primary">
        <Sparkles className="w-4 h-4" />
        <span>Takes less than 2 minutes</span>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => onNext()}
        className="min-w-[200px]"
      >
        Let's Get Started
      </Button>
    </Card>
  );
}
