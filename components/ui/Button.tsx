import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

/**
 * Button Component - iOS Style
 * 
 * Features:
 * - Rounded-xl corners (iOS default style for buttons)
 * - Solid System Blue for primary actions
 * - Subtle active state (scale down)
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
      "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]";

    const variants = {
      primary: [
        "rounded-xl",
        "bg-primary",
        "text-white",
        "hover:bg-primary-600",
        "shadow-soft",
      ].join(" "),
      secondary: [
        "rounded-xl",
        "bg-background-secondary",
        "text-primary",
        "hover:bg-background-tertiary",
      ].join(" "),
      danger: [
        "rounded-xl",
        "bg-danger",
        "text-white",
        "hover:opacity-90",
      ].join(" "),
      ghost: [
        "rounded-xl",
        "bg-transparent",
        "text-text-secondary",
        "hover:bg-background-secondary",
        "hover:text-text-primary",
      ].join(" "),
      link: [
        "bg-transparent",
        "text-primary",
        "p-0 h-auto font-bold hover:opacity-80",
      ].join(" "),
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
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
