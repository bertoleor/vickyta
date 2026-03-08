"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ThemeMode, AccentColor } from "@/types/database";

interface PreferencesData {
  theme: ThemeMode;
  accent_color: AccentColor;
  notify_daily_reminder: boolean;
  notify_budget_alert: boolean;
  notify_unusual_expense: boolean;
  telegram_chat_id: number | null;
  telegram_notifications_enabled: boolean;
}

interface PreferencesResult {
  success: boolean;
  error?: string;
  data?: PreferencesData;
}

/**
 * Get user preferences from database
 */
export async function getUserPreferences(): Promise<PreferencesResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const result = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const data = result.data as unknown as {
    theme: string;
    accent_color: string;
    notify_daily_reminder: boolean;
    notify_budget_alert: boolean;
    notify_unusual_expense: boolean;
    telegram_chat_id: number | null;
    telegram_notifications_enabled: boolean;
  } | null;

  if (result.error) {
    console.error("Error getting preferences:", result.error);
    // If no preferences exist (PGRST116 = no rows returned), return defaults
    if (result.error.code === "PGRST116") {
      return {
        success: true,
        data: {
          theme: "system",
          accent_color: "azul",
          notify_daily_reminder: true,
          notify_budget_alert: true,
          notify_unusual_expense: false,
          telegram_chat_id: null,
          telegram_notifications_enabled: false,
        },
      };
    }
    return { success: false, error: "Error al obtener preferencias" };
  }

  if (!data) {
    return {
      success: true,
      data: {
        theme: "system",
        accent_color: "azul",
        notify_daily_reminder: true,
        notify_budget_alert: true,
        notify_unusual_expense: false,
        telegram_chat_id: null,
        telegram_notifications_enabled: false,
      },
    };
  }

  return {
    success: true,
    data: {
      theme: (data.theme as ThemeMode) || "system",
      accent_color: (data.accent_color as AccentColor) || "azul",
      notify_daily_reminder: data.notify_daily_reminder ?? true,
      notify_budget_alert: data.notify_budget_alert ?? true,
      notify_unusual_expense: data.notify_unusual_expense ?? false,
      telegram_chat_id: data.telegram_chat_id,
      telegram_notifications_enabled: data.telegram_notifications_enabled ?? false,
    },
  };
}

/**
 * Update appearance preferences (theme, accent color)
 */
export async function updateAppearancePreferences(
  theme: ThemeMode,
  accentColor: string
): Promise<PreferencesResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const { error } = await supabase
    .from("user_preferences")
    .update({
      theme,
      accent_color: accentColor,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating appearance:", error);
    return { success: false, error: "Error al guardar preferencias de apariencia" };
  }

  revalidatePath("/configuracion/apariencia");
  revalidatePath("/configuracion");
  
  return { success: true };
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  notifyDailyReminder: boolean,
  notifyBudgetAlert: boolean,
  notifyUnusualExpense: boolean
): Promise<PreferencesResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const { error } = await supabase
    .from("user_preferences")
    .update({
      notify_daily_reminder: notifyDailyReminder,
      notify_budget_alert: notifyBudgetAlert,
      notify_unusual_expense: notifyUnusualExpense,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating notifications:", error);
    return { success: false, error: "Error al guardar preferencias de notificaciones" };
  }

  revalidatePath("/configuracion/notificaciones");
  revalidatePath("/configuracion");
  
  return { success: true };
}

/**
 * Update Telegram integration preferences
 */
export async function updateTelegramPreferences(
  chatId: number,
  enabled: boolean
): Promise<PreferencesResult> {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "No autenticado" };
  }

  const { error } = await supabase
    .from("user_preferences")
    .update({
      telegram_chat_id: chatId,
      telegram_notifications_enabled: enabled,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating telegram preferences:", error);
    return { success: false, error: "Error al guardar preferencias de Telegram" };
  }

  revalidatePath("/configuracion/notificaciones");
  revalidatePath("/configuracion");
  
  return { success: true };
}
