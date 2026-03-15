"use client";

import { WelcomeTour, useWelcomeTour } from "@/components/ui/WelcomeTour";

/**
 * Wrapper component that shows welcome tour for new users
 */
export function DashboardWithTour({ children }: Readonly<{ children: React.ReactNode }>) {
  const { shouldShowTour, completeTour } = useWelcomeTour();

  return (
    <>
      {children}
      {shouldShowTour && <WelcomeTour onComplete={completeTour} />}
    </>
  );
}
