"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { updateTelegramPreferences, getUserPreferences } from "@/lib/actions/preferences";

/**
 * Client Component for Telegram notification settings
 * 
 * Allows user to:
 * - Link their Telegram account
 * - Configure notification preferences
 */
export function NotificationSettings() {
  const [telegramUsername, setTelegramUsername] = useState("");
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    setMounted(true);
    async function loadPreferences() {
      try {
        const result = await getUserPreferences();
        if (result.success && result.data) {
          if (result.data.telegram_chat_id) {
            setChatId(result.data.telegram_chat_id);
            setIsLinked(result.data.telegram_notifications_enabled);
            setTelegramUsername("vinculado");
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
    loadPreferences();
  }, []);

  const handleLinkTelegram = async () => {
    if (!telegramUsername || telegramUsername === "vinculado") return;
    
    setIsLoading(true);
    try {
      // For now, we use the username as a placeholder
      // In a real implementation, the bot would send a verification code
      // and we'd get the chat_id from the bot
      const mockChatId = Date.now(); // Placeholder - in real app would come from bot
      
      await updateTelegramPreferences(mockChatId, true);
      setIsLinked(true);
      setChatId(mockChatId);
    } catch (error) {
      console.error("Error linking Telegram:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      if (chatId) {
        await updateTelegramPreferences(chatId, false);
      }
      setIsLinked(false);
      setChatId(null);
      setTelegramUsername("");
    } catch (error) {
      console.error("Error unlinking Telegram:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-16 rounded-xl bg-neutral-50 animate-pulse" />
        <div className="h-10 rounded-xl bg-neutral-50 animate-pulse" />
      </div>
    );
  }

  if (isLinked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="p-2 rounded-lg bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Telegram vinculado</p>
            <p className="text-xs text-green-600">Notificaciones activas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={handleUnlink}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Desvincular"
            )}
          </Button>
          <a 
            href="https://t.me/vickyta_finance_bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="primary" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Bot
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Vincula tu cuenta de Telegram para recibir notificaciones y registrar gastos desde el bot.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="@username"
          value={telegramUsername}
          onChange={(e) => setTelegramUsername(e.target.value.replace("@", ""))}
          className="flex-1"
          disabled={isLinked}
        />
        <Button 
          onClick={handleLinkTelegram}
          disabled={!telegramUsername || isLoading || isLinked}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Vincular"
          )}
        </Button>
      </div>

      <p className="text-xs text-text-muted">
        Ingresa tu nombre de usuario de Telegram (sin @)
      </p>
    </div>
  );
}
