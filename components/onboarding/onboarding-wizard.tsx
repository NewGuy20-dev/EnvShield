'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<OnboardingStepProps>;
}

export interface OnboardingStepProps {
  onNext: (data?: any) => void;
  onSkip: () => void;
  onBack: () => void;
  stepData: any;
}

interface OnboardingWizardProps {
  steps: OnboardingStep[];
  onComplete: (data: any) => void;
  onSkip?: () => void;
}

export function OnboardingWizard({ steps, onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [direction, setDirection] = useState(1);

  const currentStep = steps[currentStepIndex];
  const StepComponent = currentStep.component;

  const handleNext = (data?: any) => {
    if (data) {
      setStepData(prev => ({ ...prev, [currentStep.id]: data }));
    }

    if (currentStepIndex < steps.length - 1) {
      setDirection(1);
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete({ ...stepData, [currentStep.id]: data });
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleNext();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Steps */}
      <div className="w-full py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-glass-light-border dark:bg-glass-dark-border">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step Indicators */}
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-white"
                        : isCurrent
                        ? "bg-background-light dark:bg-background-dark border-primary text-primary"
                        : "bg-background-light dark:bg-background-dark border-glass-light-border dark:border-glass-dark-border text-text-muted-light dark:text-text-muted-dark"
                    }`}
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </motion.div>
                  <span className={`mt-2 text-xs font-medium hidden sm:block ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                      ? "text-text-primary-light dark:text-text-primary-dark"
                      : "text-text-muted-light dark:text-text-muted-dark"
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStepIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              <StepComponent
                onNext={handleNext}
                onSkip={handleSkip}
                onBack={handleBack}
                stepData={stepData}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Helpers */}
      <div className="pb-8 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-sm text-text-muted-light dark:text-text-muted-dark">
          <span>
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          {onSkip && (
            <button
              onClick={onSkip}
              className="hover:text-primary transition-colors"
            >
              Skip onboarding →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
