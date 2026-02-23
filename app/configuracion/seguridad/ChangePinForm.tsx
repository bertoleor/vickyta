"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Loader2, Eye, EyeOff } from "lucide-react";
import { changePin } from "./actions";

/**
 * Client Component for changing PIN
 */
export function ChangePinForm() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);

    // Client-side validation
    if (newPin !== confirmPin) {
      setError("Los PINes no coinciden");
      return;
    }

    if (newPin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }

    startTransition(async () => {
      const result = await changePin(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPin" className="block text-sm font-medium text-text-secondary mb-1">
          PIN actual
        </label>
        <div className="relative">
          <Input
            id="currentPin"
            name="currentPin"
            type={showPins ? "text" : "password"}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="••••"
            className="w-full pr-10"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            aria-label={showPins ? "Ocultar PIN" : "Mostrar PIN"}
          >
            {showPins ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="newPin" className="block text-sm font-medium text-text-secondary mb-1">
          Nuevo PIN
        </label>
        <Input
          id="newPin"
          name="newPin"
          type={showPins ? "text" : "password"}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          placeholder="••••"
          className="w-full"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      <div>
        <label htmlFor="confirmPin" className="block text-sm font-medium text-text-secondary mb-1">
          Confirmar nuevo PIN
        </label>
        <Input
          id="confirmPin"
          name="confirmPin"
          type={showPins ? "text" : "password"}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          placeholder="••••"
          className="w-full"
          maxLength={6}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      {error && (
        <p className="text-sm text-accent-600">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" />
          PIN actualizado correctamente
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending || !currentPin || !newPin || !confirmPin}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Actualizando...
          </>
        ) : (
          "Cambiar PIN"
        )}
      </Button>
    </form>
  );
}
