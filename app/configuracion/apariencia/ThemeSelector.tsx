"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

interface ThemeOption {
  value: Theme;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}

const themeOptions: ThemeOption[] = [
  { 
    value: "light", 
    icon: Sun, 
    label: "Claro", 
    description: "Tema claro siempre" 
  },
  { 
    value: "dark", 
    icon: Moon, 
    label: "Oscuro", 
    description: "Tema oscuro siempre" 
  },
  { 
    value: "system", 
    icon: Monitor, 
    label: "Sistema", 
    description: "Seguir preferencia del sistema" 
  },
];

/**
 * Theme Selector Component
 * 
 * Allows user to select between light, dark, and system themes.
 * Stores preference in localStorage and applies via CSS class.
 */
export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    if (selectedTheme === "system") {
      // Remove explicit theme class and let system preference take over
      root.classList.remove("dark", "light");
      
      // Apply system preference
      const isDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.remove("dark", "light");
      root.classList.add(selectedTheme);
    }

    // Save to localStorage
    localStorage.setItem("theme", selectedTheme);
  }, [selectedTheme, mounted]);

  const handleSelectTheme = (theme: Theme) => {
    setSelectedTheme(theme);
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((option) => (
          <div 
            key={option.value}
            className="h-20 rounded-xl bg-neutral-50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedTheme === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => handleSelectTheme(option.value)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
              isSelected
                ? "bg-primary text-white shadow-soft"
                : "bg-neutral-50 text-text-primary hover:bg-neutral-100"
            }`}
            aria-label={`Seleccionar tema ${option.label}`}
          >
            <Icon className={`h-6 w-6 mb-2 ${
              isSelected ? "text-white" : "text-primary"
            }`} />
            <span className="text-sm font-medium">{option.label}</span>
            <span className={`text-xs mt-0.5 ${
              isSelected ? "text-white/80" : "text-text-muted"
            }`}>
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
