import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "floating" | "lavender" | "cyan" | "rose";
  blur?: "sm" | "md" | "lg" | "xl";
  noHover?: boolean;
}

/**
 * GlassCard Component - Glassmorphism effect card
 * Aurora Pastel Color Palette
 * 
 * Features:
 * - Semi-transparent background with blur
 * - Works with Aurora Background for stunning visual effect
 * - Noise texture for depth
 * 
 * Variants:
 * - default: Standard glass effect with white transparency
 * - elevated: Higher opacity with stronger shadow
 * - floating: Maximum blur and shadow for floating elements
 * - lavender: Tinted glass with Lavanda (#D9C2EA)
 * - cyan: Tinted glass with Cian Pastel (#C2E3EA) - Aurora effect
 * - rose: Tinted glass with Rosa Viejo (#EAC2D2)
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", blur = "lg", noHover = false, children, ...props }, ref) => {
    const variants = {
      default: [
        "bg-white/70",
        "border-white/40",
        "shadow-glass",
      ],
      elevated: [
        "bg-white/80",
        "border-white/50",
        "shadow-glass-lg",
      ],
      floating: [
        "bg-white/85",
        "border-white/60",
        "shadow-glass-lg",
      ],
      lavender: [
        "bg-primary-100/50",
        "border-primary-200/40",
        "shadow-aurora",
      ],
      cyan: [
        "bg-secondary-100/50",
        "border-secondary-200/40",
        "shadow-aurora",
      ],
      rose: [
        "bg-accent-100/50",
        "border-accent-200/40",
        "shadow-aurora",
      ],
    };

    const blurValues = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border p-5 relative overflow-hidden",
          "backdrop-blur-xl",
          "transition-all duration-300 ease-out",
          !noHover && "hover:shadow-aurora hover:-translate-y-0.5 hover:border-primary-300/50",
          ...variants[variant],
          blurValues[blur],
          className
        )}
        style={{
          WebkitBackdropFilter: `blur(${blur === "sm" ? 8 : blur === "md" ? 16 : blur === "lg" ? 20 : 32}px)`,
        }}
        {...props}
      >
        {/* Noise texture overlay for depth */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Glass reflection effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.15]"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, transparent 100%)",
          }}
        />
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
