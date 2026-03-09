"use client";

import { useEffect } from "react";

/**
 * Theme Provider Component
 * 
 * Loads saved theme and accent color from localStorage on mount.
 * This ensures the user's preference is applied immediately when they visit the site.
 */
export function ThemeProvider() {
  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      const root = document.documentElement;
      
      if (savedTheme === "system") {
        root.classList.remove("dark", "light");
        const isDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.add(isDark ? "dark" : "light");
      } else {
        root.classList.remove("dark", "light");
        root.classList.add(savedTheme);
      }
    }

    // Apply saved accent color
    const savedAccentColor = localStorage.getItem("accent_color");
    if (savedAccentColor) {
      const accentColors: Record<string, string> = {
        "azul": "#8B5CF6",
        "rojo": "#EF4444",
        "indigo": "#6366F1",
        "verde": "#10B981",
        "naranja": "#F97316",
      };
      
      if (accentColors[savedAccentColor]) {
        document.documentElement.style.setProperty("--accent-color", accentColors[savedAccentColor]);
      }
    }

    // Listen for system theme changes
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme");
      if (currentTheme === "system") {
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return null;
}
