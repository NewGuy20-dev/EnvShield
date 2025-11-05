'use client';

import { useRouter } from "next/navigation";
import { OnboardingWizard, OnboardingStep } from "@/components/onboarding/onboarding-wizard";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { CreateProjectStep } from "@/components/onboarding/steps/create-project-step";
import { CreateEnvironmentStep } from "@/components/onboarding/steps/create-environment-step";
import { CompleteStep } from "@/components/onboarding/steps/complete-step";

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Get started with EnvShield",
    component: WelcomeStep,
  },
  {
    id: "create-project",
    title: "Project",
    description: "Create your first project",
    component: CreateProjectStep,
  },
  {
    id: "create-environment",
    title: "Environment",
    description: "Set up an environment",
    component: CreateEnvironmentStep,
  },
  {
    id: "complete",
    title: "Complete",
    description: "You're ready to go!",
    component: CompleteStep,
  },
];

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = async (data: any) => {
    console.log("Onboarding completed with data:", data);
    
    // Redirect to the project they just created
    if (data?.projectSlug) {
      router.push(`/projects/${data.projectSlug}`);
    } else {
      router.push("/projects");
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as skipped
    await fetch("/api/v1/user/complete-onboarding", {
      method: "POST",
    });
    
    router.push("/projects");
  };

  return (
    <OnboardingWizard
      steps={ONBOARDING_STEPS}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
