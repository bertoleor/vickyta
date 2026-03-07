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
          "relative flex flex-col min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              `
              [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
              [--aurora:repeating-linear-gradient(100deg,var(--blue)_10%,var(--indigo)_15%,var(--blue)_20%,var(--violet)_25%,var(--blue)_30%)]
              [--dark-gradient:repeating-linear-gradient(100deg,var(--blue-dark)_10%,var(--indigo-dark)_15%,var(--blue-dark)_20%,var(--violet-dark)_25%,var(--blue-dark)_30%)]
              [background-image:var(--white-gradient),var(--aurora)]
              dark:[background-image:var(--dark-gradient),var(--aurora)]
              [background-size:300%,_200%]
              [background-position:50%_50%,50%_50%]
              filter blur-[100px] invert dark:invert-0
              after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)] 
              after:dark:[background-image:var(--dark-gradient),var(--aurora)]
              after:[background-size:200%,_100%] 
              after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
              pointer-events-none
              absolute -inset-[10px] opacity-50 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
            style={{
              "--blue": "#66a3ff",
              "--indigo": "#a29bfe",
              "--violet": "#d6a2f7",
              "--blue-dark": "#1e3a8a",
              "--indigo-dark": "#3c0d68",
              "--violet-dark": "#4c1d95",
              "--white": "#ffffff",
              "--transparent": "transparent",
            } as React.CSSProperties}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};
