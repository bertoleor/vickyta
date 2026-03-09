"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { updateAppearancePreferences, getUserPreferences } from "@/lib/actions/preferences";

const colors = [
  { name: "Azul Sistema", value: "azul", color: "bg-primary", hex: "#8B5CF6" },
  { name: "Rojo", value: "rojo", color: "bg-danger", hex: "#EF4444" },
  { name: "Índigo", value: "indigo", color: "bg-indigo-500", hex: "#6366F1" },
  { name: "Verde", value: "verde", color: "bg-emerald-500", hex: "#10B981" },
  { name: "Naranja", value: "naranja", color: "bg-orange-500", hex: "#F97316" },
];

/**
 * Accent Color Selector Component
 * 
 * Allows user to select an accent color.
 * Saves preference to Supabase and applies via CSS variables.
 */
export function AccentColorSelector() {
  const [selectedColor, setSelectedColor] = useState<string>("azul");
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved color on mount
  useEffect(() => {
    setMounted(true);
    
    async function loadPreferences() {
      try {
        const result = await getUserPreferences();
        if (result.success && result.data?.accent_color) {
          setSelectedColor(result.data.accent_color);
          applyAccentColor(result.data.accent_color);
        }
      } catch {
        // Fallback to localStorage
        const savedColor = localStorage.getItem("accent_color");
        if (savedColor) {
          setSelectedColor(savedColor);
          applyAccentColor(savedColor);
        }
      }
    }
    
    loadPreferences();
  }, []);

  // Apply accent color to CSS variables
  const applyAccentColor = (color: string) => {
    const colorObj = colors.find(c => c.value === color);
    if (colorObj) {
      document.documentElement.style.setProperty('--accent-color', colorObj.hex);
      localStorage.setItem("accent_color", color);
    }
  };

  const handleSelectColor = async (colorValue: string) => {
    setSelectedColor(colorValue);
    applyAccentColor(colorValue);
    
    // Save to database
    setIsSaving(true);
    try {
      // Get current theme from localStorage or use default
      const currentTheme = localStorage.getItem("theme") || "system";
      await updateAppearancePreferences(currentTheme as any, colorValue);
    } catch (error) {
      console.error("Error saving accent color:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <div 
            key={color.value}
            className={`h-10 w-10 rounded-full ${color.color} animate-pulse`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => handleSelectColor(color.value)}
            disabled={isSaving}
            className={`h-10 w-10 rounded-full ${color.color} transition-transform hover:scale-110 focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 ${
              selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
            }`}
            aria-label={`Seleccionar color ${color.name}`}
            title={color.name}
          />
        ))}
      </div>
      
      {isSaving && (
        <p className="text-center text-sm text-text-muted">
          <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
          Guardando...
        </p>
      )}
    </div>
  );
}
