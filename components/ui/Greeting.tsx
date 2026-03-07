"use client";

import { useState, useEffect } from "react";

interface GreetingProps {
  readonly name: string;
  readonly className?: string;
}

/**
 * Greeting component with typewriter effect
 * Uses Garet font for a clean, modern look
 */
export function Greeting({ name, className = "" }: GreetingProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const fullText = `¡Hola, ${name}!`;

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 80); // 80ms per character for smooth effect

    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <h1 className={`text-3xl font-semibold text-text-primary tracking-tight ${className}`}>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-0.5 h-7 ml-1 bg-primary animate-blink" />
      )}
    </h1>
  );
}
