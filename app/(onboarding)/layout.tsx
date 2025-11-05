'use client';

import { SessionProvider } from "@/components/providers/SessionProvider";
import { AnimatedBackground } from "@/components/shared/animated-background";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider requireAuth>
      <div className="min-h-screen relative bg-background-light dark:bg-background-dark">
        <AnimatedBackground />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
