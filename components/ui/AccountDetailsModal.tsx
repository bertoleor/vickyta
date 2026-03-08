"use client";

import { useState } from "react";
import { 
  X, 
  Calendar, 
  Percent, 
  Save, 
  Trash2, 
  CreditCard,
  Building2,
  Wallet,
  AlertTriangle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateAccount, deleteAccount, updateAccountBalance } from "@/lib/actions/accounts";
import type { Account } from "@/types/database";

interface AccountDetailsModalProps {
  readonly account: Account;
  readonly userId: string;
  readonly onClose: () => void;
  readonly onDelete?: () => void;
}

export function AccountDetailsModal({ account, userId, onClose, onDelete }: AccountDetailsModalProps) {
  const [closingDay, setClosingDay] = useState(account.closing_day?.toString() || "");
  const [dueDay, setDueDay] = useState(account.due_day?.toString() || "");
  const [interestRate, setInterestRate] = useState(account.interest_rate?.toString() || "0");
  const [notes, setNotes] = useState(account.notes || "");
  const [balance, setBalance] = useState(account.balance.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saved, setSaved] = useState(false);

  const isCreditCard = account.type === "tarjeta_credito" || account.type === "deuda_fiado";

  const getAccountIcon = () => {
    switch (account.type) {
      case "tarjeta_credito":
        return CreditCard;
      case "banco":
        return Building2;
      default:
        return Wallet;
    }
  };

  const getAccountTypeLabel = (type: string): string => {
    if (type === "tarjeta_credito") return "Tarjeta de Crédito";
    if (type === "banco") return "Cuenta Bancaria";
    return type;
  };

  const getAccountColor = () => {
    if (account.type === "tarjeta_credito" || account.type === "deuda_fiado") {
      return "text-red-500";
    }
    return "text-primary";
  };

  // Calculate days until due
  const getDaysUntilDue = () => {
    if (!dueDay) return null;
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), Number.parseInt(dueDay));
    if (dueDate < today) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if due date is close (within 5 days)
  const isDueSoon = () => {
    const days = getDaysUntilDue();
    return days !== null && days <= 5;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);
    
    try {
      await updateAccount(account.id, userId, {
        closing_day: closingDay ? Number.parseInt(closingDay) : null,
        due_day: dueDay ? Number.parseInt(dueDay) : null,
        interest_rate: interestRate ? Number.parseFloat(interestRate) : 0,
        notes: notes || null,
      });

      // Also update balance if changed
      const newBalance = Number.parseFloat(balance);
      if (newBalance !== account.balance) {
        await updateAccountBalance(account.id, newBalance);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving account:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta cuenta? Se eliminarán todos los movimientos asociados.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount(account.id, userId);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error("Error deleting account:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Cerrar modal"
        type="button"
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-background-secondary ${getAccountColor()}`}>
              {(() => {
                const Icon = getAccountIcon();
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{account.name}</h2>
              <p className="text-xs text-text-muted">
                {getAccountTypeLabel(account.type)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Balance */}
          <div>
            <label htmlFor="account-balance" className="block text-sm font-medium text-text-secondary mb-2">
              Saldo Actual
            </label>
            <Input
              id="account-balance"
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="text-xl font-bold"
              prefix={account.type === "tarjeta_credito" || account.type === "deuda_fiado" ? "-" : ""}
            />
          </div>

          {/* Due Date Alert (for credit cards) */}
          {isCreditCard && dueDay && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              isDueSoon() 
                ? "bg-amber-50 border border-amber-200" 
                : "bg-green-50 border border-green-200"
            }`}>
              <div className={`p-2 rounded-lg ${
                isDueSoon() ? "bg-amber-100" : "bg-green-100"
              }`}>
                {isDueSoon() ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                ) : (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className={`font-medium ${isDueSoon() ? "text-amber-800" : "text-green-800"}`}>
                  {isDueSoon() ? "Vencimiento próximo" : "Pago al día"}
                </p>
                <p className="text-sm text-text-muted">
                  Vence el día {dueDay} ({daysUntilDue} días)
                </p>
              </div>
            </div>
          )}

          {/* Credit Card Details */}
          {isCreditCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Día de Cierre
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    placeholder="Ej: 20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Día de Vencimiento
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    placeholder="Ej: 5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <Percent className="inline h-4 w-4 mr-1" />
                  Tasa de Interés (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="Ej: 3.5"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="account-notes" className="block text-sm font-medium text-text-secondary mb-2">
              Notas
            </label>
            <textarea
              id="account-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar notas sobre esta cuenta..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <Button
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
            className="text-danger hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          
          <div className="flex gap-2">
            {saved && (
              <span className="flex items-center text-green-600 text-sm mr-2">
                <Check className="h-4 w-4 mr-1" />
                Guardado
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
