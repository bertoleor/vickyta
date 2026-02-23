"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Loader2 } from "lucide-react";
import { updateProfile } from "./actions";

interface UpdateProfileFormProps {
  displayName: string;
  email: string;
}

/**
 * Client Component for updating profile
 */
export function UpdateProfileForm({ displayName, email }: UpdateProfileFormProps) {
  const [name, setName] = useState(displayName);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setSuccess(false);
    
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-text-secondary mb-1">
          Nombre para mostrar
        </label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full"
        />
      </div>

      <input type="hidden" name="email" value={email} />

      {error && (
        <p className="text-sm text-accent-600">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="h-4 w-4" />
          Perfil actualizado
        </p>
      )}

      <Button 
        type="submit" 
        disabled={isPending || name === displayName}
        className="w-full"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar Cambios"
        )}
      </Button>
    </form>
  );
}
