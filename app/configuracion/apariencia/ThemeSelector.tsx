"use client";

import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Loader2 } from "lucide-react";
import { updateAppearancePreferences, getUserPreferences } from "@/lib/actions/preferences";
import type { ThemeMode } from "@/types/database";

type Theme = ThemeMode;

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
 * Saves preference to Supabase and applies via CSS class.
 */
export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Try to load from database first
    async function loadPreferences() {
      try {
        const result = await getUserPreferences();
        if (result.success && result.data) {
          setSelectedTheme(result.data.theme);
          applyTheme(result.data.theme);
        } else {
          // Fallback to localStorage
          const savedTheme = localStorage.getItem("theme") as Theme | null;
          if (savedTheme) {
            setSelectedTheme(savedTheme);
            applyTheme(savedTheme);
          }
        }
      } catch {
        // Fallback to localStorage
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
          setSelectedTheme(savedTheme);
          applyTheme(savedTheme);
        }
      }
    }
    
    loadPreferences();
  }, []);

  // Apply theme to document
  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    
    if (theme === "system") {
      root.classList.remove("dark", "light");
      const isDark = globalThis.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(isDark ? "dark" : "light");
    } else {
      root.classList.remove("dark", "light");
      root.classList.add(theme);
    }
    
    localStorage.setItem("theme", theme);
  };

  const handleSelectTheme = async (theme: Theme) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    
    // Save to database
    setIsSaving(true);
    try {
      await updateAppearancePreferences(theme, "azul");
    } catch (error) {
      console.error("Error saving theme:", error);
    } finally {
      setIsSaving(false);
    }
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
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedTheme === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleSelectTheme(option.value)}
              disabled={isSaving}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                isSelected
                  ? "bg-primary text-white shadow-soft"
                  : "bg-neutral-50 text-text-primary hover:bg-neutral-100"
              }`}
              aria-label={`Seleccionar tema ${option.label}`}
            >
              {isSaving && isSelected ? (
                <Loader2 className="h-6 w-6 mb-2 animate-spin" />
              ) : (
                <Icon className={`h-6 w-6 mb-2 ${
                  isSelected ? "text-white" : "text-primary"
                }`} />
              )}
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
      
      {/* Saving indicator */}
      {isSaving && (
        <p className="text-center text-sm text-text-muted">
          <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
          Guardando...
        </p>
      )}
    </div>
  );
}
