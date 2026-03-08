"use client";

import { useState } from "react";
import { Plus, Building2, CreditCard, Wallet, PiggyBank, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createAccount } from "@/lib/actions/accounts";
import type { AccountType } from "@/types/database";

interface AddAccountFormProps {
  readonly onSuccess?: () => void;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ElementType }[] = [
  { value: "banco", label: "Banco", icon: Building2 },
  { value: "tarjeta_credito", label: "Tarjeta de Crédito", icon: CreditCard },
  { value: "deuda_fiado", label: "Deuda/Fiado", icon: PiggyBank },
  { value: "billetera_virtual", label: "Billetera Virtual", icon: Smartphone },
  { value: "efectivo", label: "Efectivo", icon: Wallet },
];

export function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("banco");
  const [balance, setBalance] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Ingresa un nombre para la cuenta");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createAccount({
        name: name.trim(),
        type,
        balance: balance ? Number.parseFloat(balance) : 0,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setName("");
        setBalance("");
        setShowForm(false);
        onSuccess?.();
      }
    } catch {
      setError("Error al crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar Cuenta
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-background-secondary/30 rounded-xl">
      <div>
        <label htmlFor="account-name" className="block text-sm font-medium text-text-secondary mb-1">
          Nombre de la cuenta
        </label>
        <input
          id="account-name"
          type="text"
          placeholder="Ej: Banco Santander, Visa"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label htmlFor="account-type" className="block text-sm font-medium text-text-secondary mb-1">
          Tipo de cuenta
        </label>
        <select
          id="account-type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          className="w-full h-10 px-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="account-balance" className="block text-sm font-medium text-text-secondary mb-1">
          Saldo inicial
        </label>
        <input
          id="account-balance"
          type="number"
          inputMode="decimal"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full h-10 px-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-text-muted mt-1">
          Para tarjetas de crédito o deudas, ingresa el monto negativo
        </p>
      </div>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Guardando..." : "Crear Cuenta"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
