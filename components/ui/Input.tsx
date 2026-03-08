import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: "default" | "filled" | "glass";
}

/**
 * Input Component - iOS-style inputs
 * Aurora Pastel Color Palette
 * 
 * Features:
 * - Rounded corners (16px)
 * - Subtle background color
 * - Large touch targets (48px)
 * - Icon support
 * - PIN input with numeric keyboard
 * - Error states with subtle styling
 * 
 * Variants:
 * - default: White background with Lavanda border
 * - filled: Light Lavanda background without border
 * - glass: Glassmorphism effect
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, variant = "default", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replaceAll(/\s+/g, "-");

    const variants = {
      default: [
        "bg-background-secondary/50",
        "border border-border-light",
        "focus:bg-white focus:ring-primary/20 focus:border-primary/30",
      ].join(" "),
      filled: [
        "bg-background-secondary",
        "border-transparent",
        "focus:bg-white focus:ring-primary/20",
      ].join(" "),
      glass: [
        "bg-white/70 backdrop-blur-md",
        "border border-border-light/50",
        "focus:bg-white focus:ring-primary/20",
      ].join(" "),
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-bold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              {icon}
            </div>
          )}
          {/* NOSONAR */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-12 px-4 py-3 text-base rounded-xl",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-background-secondary",
              "transition-all duration-200",
              variants[variant],
              icon && "pl-12",
              error && "border-danger focus:ring-danger/20",
              className
            )}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-danger font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/**
 * PIN Input Component
 * Specialized input for PIN entry with numeric keyboard on mobile
 */
export interface PINInputProps extends Omit<InputProps, "type"> {
  length?: number;
}

const PINInput = forwardRef<HTMLInputElement, PINInputProps>(
  ({ className, length = 6, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="password"
        inputMode="numeric"
        pattern={`[0-9]*`}
        maxLength={length}
        className={cn("text-center tracking-widest", className)}
        {...props}
      />
    );
  }
);

PINInput.displayName = "PINInput";

export { Input, PINInput };
