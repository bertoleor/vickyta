"use client";

import { useState, useEffect } from "react";

interface WelcomeScreenProps {
  message: string;
  onComplete: () => void;
  typingSpeed?: number;
  delay?: number;
}

/**
 * WelcomeScreen Component
 * Aurora Pastel Color Palette
 * 
 * Displays a welcome message with a typewriter effect
 * Uses Garet font for elegant, modern style
 * Aurora background is now global via layout.tsx
 */
export function WelcomeScreen({
  message,
  onComplete,
  typingSpeed = 80,
  delay = 500,
}: WelcomeScreenProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Start typing after delay
  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [delay]);

  // Typewriter effect
  useEffect(() => {
    if (!isStarted) return;

    if (currentIndex < message.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + message[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === message.length && !isComplete) {
      setIsComplete(true);
      // Wait 10 seconds before navigating to dashboard
      const completeTimeout = setTimeout(() => {
        onComplete();
      }, 10000);

      return () => clearTimeout(completeTimeout);
    }
  }, [currentIndex, isStarted, message, typingSpeed, onComplete, isComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Welcome message */}
      <div className="relative text-center animate-fade-in z-10">
        <h1 className="font-sans text-5xl md:text-6xl lg:text-7xl font-semibold text-text-primary tracking-wide drop-shadow-sm">
          {displayedText}
          {!isComplete && (
            <span className="inline-block w-0.5 h-8 md:h-10 lg:h-12 bg-primary-600 ml-1 animate-blink" />
          )}
        </h1>
      </div>
    </div>
  );
}
