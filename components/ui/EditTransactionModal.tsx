"use client";

import { useState } from "react";
import { X, Calendar, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateTransaction, deleteTransaction } from "@/lib/actions";
import { formatCurrency } from "@/lib/constants";
import type { Transaction, Category, Account, PaymentMethod, TransactionType, TrafficLight } from "@/types/database";

interface EditTransactionModalProps {
  readonly transaction: Transaction;
  readonly categories: Category[];
  readonly accounts: Account[];
  readonly userId: string;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

const METHOD_LABELS: Partial<Record<PaymentMethod, string>> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  transferencia: "Transferencia",
  qr: "QR",
  debito_automatico: "Débito automático",
  descubierto: "Descubierto",
  fiado_adrian: "Fiado Adrián",
};

const TYPE_LABELS: Partial<Record<TransactionType, string>> = {
  gasto: "Gasto",
  ingreso: "Ingreso",
  transferencia_interna: "Transferencia",
};

/**
 * EditTransactionModal — permite editar o eliminar un movimiento.
 * Botones grandes, voseo (usuaria mayor).
 */
export function EditTransactionModal({
  transaction,
  categories,
  accounts,
  userId,
  onClose,
  onSaved,
}: EditTransactionModalProps) {
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date.split("T")[0]);
  const [description, setDescription] = useState(transaction.description || "");
  const [categoryId, setCategoryId] = useState(transaction.category_id || "");
  const [accountId, setAccountId] = useState(transaction.account_id || "");
  const [method, setMethod] = useState<PaymentMethod>(transaction.method);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [isInstallment, setIsInstallment] = useState(transaction.is_installment);
  const [currentInstallment, setCurrentInstallment] = useState(transaction.current_installment || 1);
  const [totalInstallments, setTotalInstallments] = useState(transaction.total_installments || 1);
  const [tag, setTag] = useState<TrafficLight | null>(transaction.tag);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parentCategories = categories.filter(c => c.parent_id === null);
  const subCategories = categoryId
    ? categories.filter(c => c.parent_id === categoryId)
    : [];

  const handleSave = async () => {
    const parsedAmount = Number.parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Poné un monto mayor a 0.");
      return;
    }
    if (isInstallment) {
      if (!totalInstallments || totalInstallments < 1 || !currentInstallment || currentInstallment < 1 || currentInstallment > totalInstallments) {
        setError("Revisá el número de cuota (ej: cuota 2 de 6).");
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await updateTransaction(transaction.id, userId, {
        amount: parsedAmount,
        date,
        description: description || null,
        category_id: categoryId || null,
        account_id: accountId || undefined,
        method,
        type,
        is_installment: isInstallment,
        current_installment: isInstallment ? currentInstallment : null,
        total_installments: isInstallment ? totalInstallments : null,
        tag,
      });
      if (result.error) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      onSaved();
    } catch {
      setError("No se pudo guardar el cambio.");
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteTransaction(transaction.id, userId);
      if (result.error) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      onSaved();
    } catch {
      setError("No se pudo eliminar el movimiento.");
      setIsDeleting(false);
    }
  };

  const renderAccount = () => {
    // For efectivo, allow choosing the cash account
    return (
      <div>
        <label htmlFor="edit-account" className="text-xs text-text-muted mb-1 block">Cuenta</label>
        <select
          id="edit-account"
          title="Cuenta del movimiento"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full h-12 px-3 bg-background-secondary/50 rounded-xl border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Sin cuenta</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} — {formatCurrency(acc.balance)}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Editar Movimiento</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Monto */}
          <div>
            <label htmlFor="edit-amount" className="text-xs text-text-muted mb-1 block">Monto</label>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-right font-medium"
            />
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="edit-date" className="text-xs text-text-muted mb-1 block">
              <Calendar className="inline h-3 w-3 mr-1" />Fecha
            </label>
            <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="edit-desc" className="text-xs text-text-muted mb-1 block">Descripción</label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué fue?"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="edit-type" className="text-xs text-text-muted mb-1 block">Tipo</label>
            <select
              id="edit-type"
              title="Tipo de movimiento"
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full h-12 px-3 bg-background-secondary/50 rounded-xl border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(TYPE_LABELS) as TransactionType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Método */}
          <div>
            <label htmlFor="edit-method" className="text-xs text-text-muted mb-1 block">Método de pago</label>
            <select
              id="edit-method"
              title="Método de pago"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full h-12 px-3 bg-background-secondary/50 rounded-xl border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                <option key={m} value={m}>{METHOD_LABELS[m]}</option>
              ))}
            </select>
          </div>

          {/* Cuenta */}
          {renderAccount()}

          {/* Categoría */}
          <div>
            <label htmlFor="edit-category" className="text-xs text-text-muted mb-1 block">Categoría</label>
            <select
              id="edit-category"
              title="Categoría"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 px-3 bg-background-secondary/50 rounded-xl border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin categoría</option>
              {parentCategories.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  <option value={cat.id}>{cat.name}</option>
                  {categories.filter(c => c.parent_id === cat.id).map(child => (
                    <option key={child.id} value={child.id}>{cat.name} / {child.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Cuotas */}
          <div className="p-3 bg-background-secondary rounded-xl space-y-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="h-5 w-5 accent-primary"
              />
              Es en cuotas
            </label>
            {isInstallment && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="edit-current" className="text-xs text-text-muted mb-1 block">Cuota n°</label>
                  <Input
                    id="edit-current"
                    type="number"
                    min={1}
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label htmlFor="edit-total" className="text-xs text-text-muted mb-1 block">Cuotas totales</label>
                  <Input
                    id="edit-total"
                    type="number"
                    min={1}
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Semaforo / tag */}
          <div>
            <label htmlFor="edit-tag" className="text-xs text-text-muted mb-1 block">Etiqueta</label>
            <select
              id="edit-tag"
              title="Etiqueta del gasto"
              value={tag || ""}
              onChange={(e) => setTag((e.target.value || null) as TrafficLight | null)}
              className="w-full h-12 px-3 bg-background-secondary/50 rounded-xl border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin etiqueta</option>
              <option value="inevitable">Inevitable</option>
              <option value="optimizable">Optimizable</option>
              <option value="evitable">Evitable</option>
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger/10 text-danger rounded-xl text-sm font-medium">{error}</div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1 py-4 text-base" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar cambios"}
            </Button>
            <Button
              variant={confirmDelete ? "danger" : "ghost"}
              className={confirmDelete ? "flex-1 py-4 text-base" : "px-4"}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : confirmDelete ? (
                "¿Borrar?" 
              ) : (
                <Trash2 className="h-5 w-5 text-danger" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}