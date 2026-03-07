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
        "bg-white/80",
        "border border-border",
        "focus:border-primary-400 focus:ring-primary-200",
      ].join(" "),
      filled: [
        "bg-primary-50",
        "border-transparent",
        "focus:bg-white focus:border-primary-300 focus:ring-primary-200",
      ].join(" "),
      glass: [
        "bg-white/60 backdrop-blur-sm",
        "border border-primary-200/50",
        "focus:bg-white/80 focus:border-primary-300 focus:ring-primary-200",
      ].join(" "),
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          {/* NOSONAR */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-12 px-4 py-3 text-base rounded-2xl",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-primary-50",
              "transition-all duration-200",
              variants[variant],
              icon && "pl-12",
              error && "border-accent-400 focus:border-accent-500 focus:ring-accent-200",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-sm text-accent-600"
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
