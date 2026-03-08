"use client";

import { cn } from "@/lib/utils";

interface GreetingProps {
  readonly name: string;
  readonly className?: string;
}

/**
 * Greeting component - iOS Style
 * Static header for immediate feedback
 */
export function Greeting({ name, className = "" }: GreetingProps) {
  return (
    <h1 className={cn(
      "text-3xl font-bold text-text-primary tracking-tight animate-fade-in",
      className
    )}>
      ¡Hola, {name}!
    </h1>
  );
}
