import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "cyan";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * Button Component - iOS-style pill buttons
 * Aurora Pastel Color Palette
 * 
 * Features:
 * - Fully rounded (pill) borders
 * - Soft gradient backgrounds for primary actions
 * - Smooth press animations
 * - Loading states with spinner
 * 
 * Variants:
 * - primary: Gradient Lavanda background
 * - secondary: Outlined with Lavanda border
 * - accent: Rosa Viejo for warm accents
 * - danger: Soft rose for destructive actions
 * - ghost: Text only with hover background
 * - cyan: Cian Pastel for secondary actions
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 press-effect";

    const variants = {
      primary: [
        "rounded-full",
        "bg-gradient-to-r from-primary-400 to-primary-500",
        "text-white",
        "hover:from-primary-500 hover:to-primary-600",
        "active:from-primary-600 active:to-primary-700",
        "shadow-soft",
      ].join(" "),
      secondary: [
        "rounded-full",
        "bg-transparent",
        "border-2 border-primary-400",
        "text-primary-700",
        "hover:bg-primary-50",
        "active:bg-primary-100",
      ].join(" "),
      accent: [
        "rounded-full",
        "bg-gradient-to-r from-accent-400 to-accent-500",
        "text-white",
        "hover:from-accent-500 hover:to-accent-600",
        "active:from-accent-600 active:to-accent-700",
        "shadow-soft",
      ].join(" "),
      danger: [
        "rounded-full",
        "bg-danger",
        "text-text-primary",
        "hover:bg-accent-400",
        "active:bg-accent-500",
        "shadow-soft",
      ].join(" "),
      ghost: [
        "rounded-full",
        "bg-transparent",
        "text-text-secondary",
        "hover:bg-primary-100",
        "hover:text-text-primary",
      ].join(" "),
      cyan: [
        "rounded-full",
        "bg-gradient-to-r from-secondary-400 to-secondary-500",
        "text-white",
        "hover:from-secondary-500 hover:to-secondary-600",
        "active:from-secondary-600 active:to-secondary-700",
        "shadow-soft",
      ].join(" "),
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-sm",
      lg: "h-13 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
