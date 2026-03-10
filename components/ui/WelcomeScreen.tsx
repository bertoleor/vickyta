"use client";

import { useEffect } from "react";

interface WelcomeScreenProps {
  readonly message: string;
  readonly onComplete: () => void;
  readonly delay?: number;
}

/**
 * WelcomeScreen Component - iOS Style
 * 
 * Displays a welcome message with a clean, centered layout.
 * Removes AI typewriter tropes for a more standard premium feel.
 */
export function WelcomeScreen({
  message,
  onComplete,
  delay = 500,
}: WelcomeScreenProps) {
  // Navigation auto-complete
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete();
    }, delay + 5000); // Wait 5 seconds after delay

    return () => clearTimeout(timeout);
  }, [delay, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="relative text-center animate-fade-in px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
          {message}
        </h1>
        <p className="mt-4 text-text-secondary animate-fade-in [animation-delay:400ms]">
          Tu asistente financiero personal
        </p>
      </div>
    </div>
  );
}
