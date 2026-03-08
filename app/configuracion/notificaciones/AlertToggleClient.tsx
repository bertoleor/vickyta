"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { updateNotificationPreferences, getUserPreferences } from "@/lib/actions/preferences";

interface AlertToggleClientProps {
  icon: ReactNode;
  title: string;
  description: string;
  preferenceKey: 'notify_daily_reminder' | 'notify_budget_alert' | 'notify_unusual_expense';
  defaultChecked: boolean;
}

export function AlertToggleClient({ 
  icon, 
  title, 
  description, 
  preferenceKey,
  defaultChecked 
}: Readonly<AlertToggleClientProps>) {
  const [isChecked, setIsChecked] = useState(defaultChecked);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toggleId = `toggle-${preferenceKey}`;

  // Load initial state
  useEffect(() => {
    setMounted(true);
    async function loadPreferences() {
      try {
        const result = await getUserPreferences();
        if (result.success && result.data) {
          setIsChecked(result.data[preferenceKey] ?? defaultChecked);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreferences();
  }, [preferenceKey, defaultChecked]);

  const handleToggle = async () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    setIsSaving(true);

    try {
      // Get current values
      const prefsResult = await getUserPreferences();
      if (prefsResult.success && prefsResult.data) {
        const current = prefsResult.data;
        
        // Update only the changed preference
        await updateNotificationPreferences(
          preferenceKey === 'notify_daily_reminder' ? newValue : current.notify_daily_reminder,
          preferenceKey === 'notify_budget_alert' ? newValue : current.notify_budget_alert,
          preferenceKey === 'notify_unusual_expense' ? newValue : current.notify_unusual_expense
        );
      }
    } catch (error) {
      console.error("Error saving preference:", error);
      setIsChecked(!newValue); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !mounted) {
    return (
      <div className="flex items-center justify-between py-2 opacity-50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background-secondary animate-pulse h-8 w-8" />
          <div>
            <div className="h-4 w-32 bg-neutral-100 rounded mb-1" />
            <div className="h-3 w-24 bg-neutral-50 rounded" />
          </div>
        </div>
        <div className="h-6 w-11 bg-neutral-100 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background-secondary">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer" htmlFor={toggleId}>
        <span className="sr-only">{title}</span>
        <input 
          type="checkbox" 
          id={toggleId}
          className="sr-only peer" 
          checked={isChecked}
          onChange={handleToggle}
          disabled={isSaving}
        />
        <div className="w-11 h-6 bg-border-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary">
          {isSaving && (
            <Loader2 className="absolute top-0.5 left-0.5 h-5 w-5 text-primary animate-spin" />
          )}
        </div>
      </label>
    </div>
  );
}
