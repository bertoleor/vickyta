import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated";
}

/**
 * GlassCard Component - iOS Style Card
 * 
 * Features:
 * - Clean white background
 * - Soft borders and subtle shadows
 * - Consistent with iOS design principles
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: [
        "bg-white",
        "border-border-light",
        "shadow-soft",
      ],
      elevated: [
        "bg-white",
        "border-border-light",
        "shadow-soft-lg",
      ],
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border p-5 relative overflow-hidden",
          "transition-all duration-300 ease-out",
          ...variants[variant],
          className
        )}
        {...props}
      >
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

/**
 * GlassCard Header component
 */
const GlassCardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mb-3 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
});

GlassCardHeader.displayName = "GlassCardHeader";

/**
 * GlassCard Title component
 */
const GlassCardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-base font-semibold text-text-primary", className)}
      {...props}
    >
      {children}
    </h3>
  );
});

GlassCardTitle.displayName = "GlassCardTitle";

/**
 * GlassCard Content component
 */
const GlassCardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("", className)} {...props}>
      {children}
    </div>
  );
});

GlassCardContent.displayName = "GlassCardContent";

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent };
