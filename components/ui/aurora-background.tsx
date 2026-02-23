"use client";

import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-0 overflow-hidden",
            "[--aurora:repeating-linear-gradient(100deg,var(--blue)_10%,var(--indigo)_15%,var(--blue)_20%,var(--violet)_25%,var(--blue)_30%)]",
            "[--dark-gradient:repeating-linear-gradient(100deg,var(--blue-dark)_10%,var(--indigo-dark)_15%,var(--blue-dark)_20%,var(--violet-dark)_25%,var(--blue-dark)_30%)]",
            "after:content-[''] after:absolute after:inset-0 after:[background-image:var(--aurora)] dark:after:[background-image:var(--dark-gradient)]",
            "after:[background-size:300%_200%] after:[background-position:50%_50%]",
            "after:animate-[aurora_60s_linear_infinite] after:mix-blend-difference",
            "after:blur-[60px] after:opacity-60",
            "after:will-change-transform",
            showRadialGradient &&
              "after:[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]"
          )}
          style={{
            "--blue": "#4f46e5",
            "--indigo": "#6366f1",
            "--violet": "#8b5cf6",
            "--blue-dark": "#3b82f6",
            "--indigo-dark": "#6366f1",
            "--violet-dark": "#a855f7",
            "--transparent": "transparent",
          } as React.CSSProperties}
        />
        {children}
      </div>
    </main>
  );
};
