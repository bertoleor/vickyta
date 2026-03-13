"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Check, 
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addTransaction } from "@/lib/actions/transactions";
import { getCategories, getAccounts } from "@/lib/actions";
import { formatCurrency } from "@/lib/constants";
import type { Category, Account, PaymentMethod, TransactionType, TrafficLight } from "@/types/database";

interface ExpenseFormCardProps {
  readonly onSuccess?: () => void;
}

// Keyword matching for smart category suggestion
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'supermercado': ['coto', 'carrefour', 'jumbo', 'dia', 'walmart', 'supermercado', 'super'],
  'almacen': ['almacen', 'almacén', 'kiosco', 'maxikiosco'],
  'carniceria': ['carniceria', 'carnicería', 'carne', 'asado'],
  'verduleria': ['verduleria', 'verdulería', 'verdura', 'fruta'],
  'farmacia': ['farmacia', 'farmacity', 'medicamento', 'remedio'],
  'transporte': ['sube', 'colectivo', 'subte', 'tren', 'transporte', 'viatico'],
  'nafta': ['nafta', 'gasolina', 'ypf', 'shell', 'axion', 'combustible', 'estacion'],
  'streaming': ['netflix', 'spotify', 'disney', 'amazon prime', 'youtube', 'hbo'],
  'almuerzo': ['almuerzo', 'comida', 'restaurant', 'restaurante'],
};

/**
 * Simplified Expense Form Card
 * Single view, fast input
 */
export function ExpenseFormCard({ onSuccess }: ExpenseFormCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<string | null>(null);
  const [tag, setTag] = useState<TrafficLight | null>(null);
  
  // Transaction type
  const [transactionType, setTransactionType] = useState<TransactionType>('gasto');

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [catResult, accResult] = await Promise.all([
        getCategories(),
        getAccounts(""), 
      ]);
       
      if (catResult.data) setCategories(catResult.data);
      if (accResult.data) setAccounts(accResult.data);
       
      // Set default account (first cash account if available)
      const cashAccount = accResult.data?.find(a => a.type === 'efectivo');
      if (cashAccount) setSelectedAccount(cashAccount.id);
    }
    loadData();
  }, []);

  // Get parent categories (macro)
  const macroCategories = categories.filter(c => c.parent_id === null);

  // Get subcategories for selected macro
  const subCategories = selectedCategory 
    ? categories.filter(c => c.parent_id === selectedCategory)
    : [];

  // Smart category suggestion based on description
  const findSuggestedCategory = useCallback((desc: string) => {
    const lowercaseDesc = desc.toLowerCase();
    for (const [catSlug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lowercaseDesc.includes(kw))) {
        return categories.find(c => 
          c.name.toLowerCase().includes(catSlug) ||
          catSlug.includes(c.name.toLowerCase().replace(' ', ''))
        );
      }
    }
    return null;
  }, [categories]);

  // Auto-suggest category when typing description
  useEffect(() => {
    if (description && !selectedCategory) {
      const found = findSuggestedCategory(description);
      if (found) {
        setSelectedCategory(found.id);
      }
    }
  }, [description, selectedCategory, findSuggestedCategory]);

  // Handle payment method changes
  useEffect(() => {
    if (paymentMethod === 'efectivo') {
      const cashAccount = accounts.find(a => a.type === 'efectivo');
      if (cashAccount) setSelectedAccount(cashAccount.id);
    } else {
      // For cards, suggest first bank account
      const bankAccount = accounts.find(a => a.type === 'banco');
      if (bankAccount) setSelectedAccount(bankAccount.id);
    }
  }, [paymentMethod, accounts]);

  // Handle transaction type changes
  useEffect(() => {
    if (transactionType === 'transferencia_interna') {
      const bankAccount = accounts.find(a => a.type === 'banco');
      const cashAccount = accounts.find(a => a.type === 'efectivo');
      if (bankAccount) setSelectedAccount(bankAccount.id);
      if (cashAccount) setDestinationAccount(cashAccount.id);
    }
  }, [transactionType, accounts]);

  // Submit
  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await addTransaction({
        user_id: '',
        account_id: selectedAccount || '',
        destination_account_id: transactionType === 'transferencia_interna' ? destinationAccount : null,
        category_id: selectedCategory,
        amount: Number.parseFloat(amount),
        date,
        description,
        type: transactionType,
        method: paymentMethod,
        is_installment: false,
        current_installment: null,
        total_installments: null,
        is_recurring: false,
        recurring_frequency: null,
        tag,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setAmount("");
        setDescription("");
        setSelectedCategory(null);
        setTag(null);
        setShowDetails(false);
        setTransactionType('gasto');
        onSuccess?.();
      }
    } catch {
      setError("Error al guardar");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Agregar Movimiento</h3>
        {amount && Number(amount) > 0 && (
          <span className="text-2xl font-bold text-[var(--accent-color,#8B5CF6)]">
            ${Number(amount).toLocaleString('es-AR')}
          </span>
        )}
      </div>

      {/* Transaction Type Tabs */}
      <div className="flex gap-1 p-1 bg-background-secondary rounded-xl">
        <button
          onClick={() => setTransactionType('gasto')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
            transactionType === 'gasto'
              ? 'bg-danger text-white shadow-sm'
              : 'text-text-secondary hover:bg-background-tertiary'
          }`}
        >
          <TrendingDown className="h-4 w-4" />
          Gasto
        </button>
        <button
          onClick={() => setTransactionType('ingreso')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
            transactionType === 'ingreso'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'text-text-secondary hover:bg-background-tertiary'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Ingreso
        </button>
        <button
          onClick={() => setTransactionType('transferencia_interna')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
            transactionType === 'transferencia_interna'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-text-secondary hover:bg-background-tertiary'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Transferir
        </button>
      </div>

      {/* Amount Input - Large and prominent */}
      <div className="relative">
        <div className="flex items-center justify-center bg-background-secondary rounded-2xl py-4">
          <DollarSign className="h-8 w-8 text-text-muted mr-2" />
          <input
            id="amount-input"
            type="number"
            inputMode="decimal"
            placeholder="0"
            title="Monto del movimiento"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-4xl font-bold text-center bg-transparent w-32 focus:outline-none"
            autoFocus
          />
        </div>
      </div>

      {/* Category Grid - Main action */}
      <div>
        <p className="text-sm text-text-secondary mb-2">Categoría</p>
        <div className="grid grid-cols-2 gap-2">
          {macroCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-xl text-sm font-medium text-left transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[var(--accent-color,#8B5CF6)] text-white ring-2 ring-[var(--accent-color,#8B5CF6)] ring-offset-2'
                  : 'bg-background-secondary hover:bg-background-tertiary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories - Show if parent selected */}
      {subCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-background-secondary text-text-secondary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Quick Options Row */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 py-2 px-3 rounded-xl bg-background-secondary text-sm font-medium text-text-secondary hover:bg-background-tertiary transition-colors"
        >
          {showDetails ? 'Menos opciones' : 'Más opciones'}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="space-y-4 p-4 bg-background-secondary rounded-xl">
          {/* Description */}
          <div>
            <label htmlFor="description-input" className="text-xs text-text-muted mb-1 block">Descripción</label>
            <input
              id="description-input"
              type="text"
              placeholder="¿Qué compraste?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-white rounded-lg border border-border-light text-sm"
            />
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date-input" className="text-xs text-text-muted mb-1 block">Fecha</label>
            <input
              id="date-input"
              type="date"
              title="Fecha del movimiento"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-10 px-3 bg-white rounded-lg border border-border-light text-sm"
            />
          </div>

          {/* Payment Method */}
          <fieldset>
            <legend id="payment-method-label" className="text-xs text-text-muted mb-2 block">Método de pago</legend>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('efectivo')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  paymentMethod === 'efectivo'
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary border border-border-light'
                }`}
              >
                <Banknote className="h-4 w-4" />
                Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('debito')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  paymentMethod === 'debito'
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary border border-border-light'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Débito
              </button>
              <button
                onClick={() => setPaymentMethod('credito')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                  paymentMethod === 'credito'
                    ? 'bg-primary text-white'
                    : 'bg-white text-text-secondary border border-border-light'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Crédito
              </button>
            </div>
          </fieldset>

          {/* Account Selection */}
          {paymentMethod !== 'efectivo' && transactionType !== 'transferencia_interna' && (
            <fieldset>
              <legend id="account-selection-label" className="text-xs text-text-muted mb-2 block">Cuenta</legend>
              <div className="grid grid-cols-2 gap-2">
                {accounts
                  .filter(a => a.type === 'banco' || a.type === 'billetera_virtual')
                  .map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`p-2 rounded-lg text-left text-sm transition-all ${
                        selectedAccount === acc.id
                          ? 'bg-primary text-white'
                          : 'bg-white text-text-secondary border border-border-light'
                      }`}
                    >
                      <div className="font-medium">{acc.name}</div>
                      <div className="text-xs opacity-70">{formatCurrency(acc.balance)}</div>
                    </button>
                  ))}
              </div>
            </fieldset>
          )}

          {/* Transfer accounts */}
          {transactionType === 'transferencia_interna' && (
            <div className="space-y-2">
              <div>
                <label htmlFor="source-account-select" className="text-xs text-text-muted mb-1 block">Desde</label>
                <select
                  id="source-account-select"
                  title="Cuenta de origen"
                  value={selectedAccount || ''}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full h-10 px-3 bg-white rounded-lg border border-border-light text-sm"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dest-account-select" className="text-xs text-text-muted mb-1 block">Hacia</label>
                <select
                  id="dest-account-select"
                  title="Cuenta de destino"
                  value={destinationAccount || ''}
                  onChange={(e) => setDestinationAccount(e.target.value)}
                  className="w-full h-10 px-3 bg-white rounded-lg border border-border-light text-sm"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-danger/10 text-danger rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!amount || isLoading}
        className="w-full py-4 text-lg font-bold bg-[var(--accent-color,#8B5CF6)]"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            Guardar {transactionType === 'gasto' ? 'Gasto' : ''}
            {transactionType === 'ingreso' ? 'Ingreso' : ''}
            {transactionType === 'transferencia_interna' ? 'Transferencia' : ''}
          </>
        )}
      </Button>
    </div>
  );
}
