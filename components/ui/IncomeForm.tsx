"use client";

import { useState, useEffect } from "react";
import { Plus, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addTransaction } from "@/lib/actions/transactions";
import { getAccounts } from "@/lib/actions";
import { formatCurrency } from "@/lib/constants";
import type { Account, PaymentMethod } from "@/types/database";

interface IncomeFormProps {
  readonly onSuccess?: () => void;
}

export function IncomeForm({ onSuccess }: IncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAccountSelect, setShowAccountSelect] = useState(false);

  // Load accounts on mount
  useEffect(() => {
    async function loadAccounts() {
      const result = await getAccounts("");
      if (result.data) {
        setAccounts(result.data);
        // Set default account (first cash or bank account)
        const defaultAccount = result.data.find(a => 
          a.type === 'efectivo' || a.type === 'banco'
        );
        if (defaultAccount) {
          setAccountId(defaultAccount.id);
        }
      }
    }
    loadAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }

    if (!accountId) {
      setError("Selecciona una cuenta para recibir el ingreso");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await addTransaction({
        user_id: '', // Server will get from session
        account_id: accountId,
        amount: Number.parseFloat(amount),
        date,
        description: description || "Ingreso",
        type: "ingreso",
        method: "efectivo" as PaymentMethod,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setAmount("");
        setDescription("");
        setDate(new Date().toISOString().split('T')[0]);
        onSuccess?.();
      }
    } catch {
      setError("Error al guardar el ingreso");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Description */}
      <div>
        <input
          type="text"
          placeholder="Descripción (ej: Colegio San Martín, Salario)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-10 px-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Amount and Date row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Monto"
            title="Monto del ingreso"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20 text-right font-medium"
          />
        </div>
        <div className="relative w-32">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="date"
            title="Fecha del ingreso"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Account Selection Toggle */}
      <button
        type="button"
        onClick={() => setShowAccountSelect(!showAccountSelect)}
        className="text-xs text-text-muted hover:text-primary transition-colors"
      >
        {showAccountSelect ? "Ocultar cuentas" : "Seleccionar cuenta de destino"}
      </button>

      {/* Account Select */}
      {showAccountSelect && accounts.length > 0 && (
        <select
          title="Cuenta de destino"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full h-10 px-3 text-sm bg-background-secondary/50 rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Seleccionar cuenta...</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} - {formatCurrency(acc.balance)}
            </option>
          ))}
        </select>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? "Guardando..." : "Agregar Ingreso"}
      </Button>
    </form>
  );
}
