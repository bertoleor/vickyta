"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, ExternalLink, Loader2 } from "lucide-react";

interface NotificationSettingsProps {
  // In the future, this could receive initial state from server
}

/**
 * Client Component for Telegram notification settings
 * 
 * Allows user to:
 * - Link their Telegram account
 * - Configure notification preferences
 */
export function NotificationSettings({}: NotificationSettingsProps) {
  const [telegramUsername, setTelegramUsername] = useState("");
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkTelegram = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLinked(true);
    setIsLoading(false);
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLinked(false);
    setTelegramUsername("");
    setIsLoading(false);
  };

  if (isLinked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
          <div className="p-2 rounded-lg bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Telegram vinculado</p>
            <p className="text-xs text-green-600">@{telegramUsername}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={handleUnlink}
            disabled={isLoading}
            className="flex-1"
          >
            Desvincular
          </Button>
          <a 
            href="https://t.me/tu_bot" 
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
        />
        <Button 
          onClick={handleLinkTelegram}
          disabled={!telegramUsername || isLoading}
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
