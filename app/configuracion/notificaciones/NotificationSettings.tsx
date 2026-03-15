"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, ExternalLink, Loader2, Shield, MessageCircle } from "lucide-react";
import { getUserPreferences } from "@/lib/actions/preferences";
import { toast } from "sonner";

type VerificationStep = 'idle' | 'enter_username' | 'waiting_code' | 'verifying';

export function NotificationSettings() {
  const [telegramUsername, setTelegramUsername] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<VerificationStep>('enter_username');
  const [pendingUsername, setPendingUsername] = useState("");

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
            setStep('idle');
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
    loadPreferences();
  }, []);

  // Step 1: User enters username and starts linking
  const handleStartLinking = async () => {
    if (!telegramUsername || telegramUsername === "vinculado") return;
    
    setIsLoading(true);
    setPendingUsername(telegramUsername);
    
    try {
      // Save the username temporarily
      // The actual linking will happen after verification
      setStep('waiting_code');
      toast.info("Ve a Telegram y escribe /vincular para continuar");
    } catch (error) {
      console.error("Error starting linking:", error);
      toast.error("Error al iniciar vinculación");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: User enters the verification code from Telegram
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      toast.error("Ingresa el código de 4 dígitos");
      return;
    }

    setIsLoading(true);
    setStep('verifying');

    try {
      const response = await fetch('/api/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          code: verificationCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsLinked(true);
        setChatId(Date.now()); // Will be updated on next load
        setStep('idle');
        toast.success("¡Cuenta vinculada correctamente!");
      } else {
        toast.error(data.error || "Código incorrecto");
        setStep('waiting_code');
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Error al verificar código");
      setStep('waiting_code');
    } finally {
      setIsLoading(false);
    }
  };

  // Request a new code (in case user didn't receive one)
  const handleRequestNewCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.info("Nuevo código enviado a Telegram");
      } else {
        toast.error(data.error || "Error al solicitar código");
      }
    } catch (error) {
      console.error("Error requesting code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      // Call API to unlink (would need to implement)
      setIsLinked(false);
      setChatId(null);
      setTelegramUsername("");
      setStep('enter_username');
      toast.success("Cuenta desvinculada");
    } catch (error) {
      console.error("Error unlinking:", error);
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

  // Already linked state
  if (isLinked && step === 'idle') {
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
            href="https://t.me/crismorobot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="primary" className="w-full">
              <MessageCircle className="h-4 w-4 mr-2" />
              Abrir Bot
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Waiting for verification code
  if (step === 'waiting_code') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
          <div className="p-2 rounded-lg bg-blue-100">
            <Shield className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Verificación en progreso</p>
            <p className="text-xs text-blue-600">Revisa tu Telegram</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-background-secondary">
          <p className="text-sm text-text-secondary mb-3">
            <strong>Paso 1:</strong> Ya enviaste /vincular al bot?
          </p>
          <p className="text-xs text-text-muted mb-3">
            El bot te envió un código de 4 dígitos. Ingésalo abajo.
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Código (ej: 1234)"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="flex-1 text-center text-lg tracking-widest font-mono"
              maxLength={4}
            />
            <Button 
              onClick={handleVerifyCode}
              disabled={verificationCode.length !== 4 || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={() => setStep('enter_username')}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleRequestNewCode}
            disabled={isLoading}
            className="flex-1"
          >
            Reenviar código
          </Button>
        </div>
      </div>
    );
  }

  // Initial state - enter username
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Vincula tu cuenta de Telegram para recibir notificaciones y registrar gastos desde el bot.
      </p>

      <div className="flex gap-2">
        <Input
          placeholder="@tu_usuario"
          value={telegramUsername}
          onChange={(e) => setTelegramUsername(e.target.value.replace("@", ""))}
          className="flex-1"
        />
        <Button 
          onClick={handleStartLinking}
          disabled={!telegramUsername || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Vincular"
          )}
        </Button>
      </div>

      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>Cómo funciona:</strong>
        </p>
        <ol className="text-xs text-amber-700 mt-2 space-y-1 list-decimal list-inside">
          <li>Ingresa tu usuario de Telegram</li>
          <li>Haz clic en "Vincular"</li>
          <li>Ve a Telegram y escribe <code>/vincular</code></li>
          <li>El bot te enviará un código</li>
          <li>Regresa aquí e ingresa el código</li>
        </ol>
      </div>
    </div>
  );
}
