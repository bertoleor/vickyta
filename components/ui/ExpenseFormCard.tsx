"use client";

import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Calendar,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { addTransaction } from "@/lib/actions/transactions";
import { getCategories, getAccounts } from "@/lib/actions";
import { formatCurrency, TRAFFIC_LIGHT_CONFIG } from "@/lib/constants";
import type { Category, Account, PaymentMethod, TransactionType, TrafficLight } from "@/types/database";

interface ExpenseFormCardProps {
  readonly onSuccess?: () => void;
}

type Step = 'amount' | 'category' | 'subcategory' | 'details';

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
 * Smart Expense Form Card
 * Multi-step form in a card format
 * 
 * Steps:
 * 1. Amount & Date
 * 2. Macro Category
 * 3. Sub Category
 * 4. Details (payment method, tag, etc.)
 */
export function ExpenseFormCard({ onSuccess }: ExpenseFormCardProps) {
  // State
  const [step, setStep] = useState<Step>('amount');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Form fields
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState("");
  const [selectedMacroCategory, setSelectedMacroCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<string | null>(null);
  const [tag, setTag] = useState<TrafficLight | null>(null);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(1);
  
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
  const subCategories = selectedMacroCategory 
    ? categories.filter(c => c.parent_id === selectedMacroCategory)
    : [];

  // Smart category suggestion based on description
  const findSuggestedCategory = (desc: string) => {
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
  };

  useEffect(() => {
    if (description && !selectedSubCategory) {
      const found = findSuggestedCategory(description);
      if (found) {
        if (found.parent_id) {
          setSelectedMacroCategory(found.parent_id);
          setSelectedSubCategory(found.id);
        } else {
          setSelectedMacroCategory(found.id);
        }
      }
    }
  }, [description, categories, selectedSubCategory]);

  // Reset subcategory when macro changes
  useEffect(() => {
    setSelectedSubCategory(null);
  }, [selectedMacroCategory]);

  // Handle payment method changes
  useEffect(() => {
    if (paymentMethod === 'efectivo') {
      const cashAccount = accounts.find(a => a.type === 'efectivo');
      if (cashAccount) setSelectedAccount(cashAccount.id);
      setIsInstallment(false);
    }
    
    if (paymentMethod !== 'credito') {
      setIsInstallment(false);
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

  // Navigation
  const goNext = () => {
    const steps: Step[] = ['amount', 'category', 'subcategory', 'details'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const goBack = () => {
    const steps: Step[] = ['amount', 'category', 'subcategory', 'details'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // Validation per step
  const canProceed = () => {
    switch (step) {
      case 'amount':
        return Number.parseFloat(amount) > 0;
      case 'category':
        return selectedMacroCategory !== null;
      case 'subcategory':
        return true;
      case 'details':
        return true;
      default:
        return false;
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Ingresa un monto valido");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await addTransaction({
        user_id: '',
        account_id: selectedAccount || '',
        destination_account_id: transactionType === 'transferencia_interna' ? destinationAccount : null,
        category_id: selectedSubCategory || selectedMacroCategory || null,
        amount: Number.parseFloat(amount),
        date,
        description,
        type: transactionType,
        method: paymentMethod,
        is_installment: isInstallment && paymentMethod === 'credito',
        current_installment: isInstallment ? 1 : null,
        total_installments: isInstallment ? totalInstallments : null,
        tag,
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setAmount("");
        setDescription("");
        setSelectedMacroCategory(null);
        setSelectedSubCategory(null);
        setTag(null);
        setIsInstallment(false);
        setStep('amount');
        onSuccess?.();
      }
    } catch {
      setError("Error al guardar el gasto");
    } finally {
      setIsLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = ['amount', 'category', 'subcategory', 'details'];
    const currentIndex = steps.indexOf(step);
    
    return (
      <div className="flex items-center justify-center gap-2 mb-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                i <= currentIndex 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-primary-100 text-text-muted'
              }`}
            >
              {i < currentIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${i < currentIndex ? 'bg-primary-500' : 'bg-primary-100'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Step 1: Amount & Date
  const renderAmountStep = () => (
    <div className="space-y-4">
      {/* Transaction Type */}
      <div className="flex gap-2">
        <button
          onClick={() => setTransactionType('gasto')}
          className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
            transactionType === 'gasto'
              ? 'bg-primary-500 text-white'
              : 'bg-white/50 text-text-secondary hover:bg-white/70'
          }`}
        >
          <TrendingDown className="h-4 w-4 mx-auto mb-1" />
          Gasto
        </button>
        <button
          onClick={() => setTransactionType('ingreso')}
          className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
            transactionType === 'ingreso'
              ? 'bg-primary-500 text-white'
              : 'bg-white/50 text-text-secondary hover:bg-white/70'
          }`}
        >
          <TrendingUp className="h-4 w-4 mx-auto mb-1" />
          Ingreso
        </button>
        <button
          onClick={() => setTransactionType('transferencia_interna')}
          className={`flex-1 p-3 rounded-xl text-sm font-medium transition-all ${
            transactionType === 'transferencia_interna'
              ? 'bg-primary-500 text-white'
              : 'bg-white/50 text-text-secondary hover:bg-white/70'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4 mx-auto mb-1" />
          Transferir
        </button>
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount-input" className="text-sm text-text-secondary mb-1 block">Monto</label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            id="amount-input"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            title="Monto del movimiento"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-14 pl-10 pr-4 text-2xl font-bold text-center bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            autoFocus
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date-input" className="text-sm text-text-secondary mb-1 block">Fecha</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            id="date-input"
            type="date"
            title="Fecha del movimiento"
            placeholder="DD/MM/AAAA"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description-input" className="text-sm text-text-secondary mb-1 block">Descripcion (opcional)</label>
        <input
          id="description-input"
          type="text"
          title="Descripción del movimiento"
          placeholder="Que compraste?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full h-12 px-4 bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
    </div>
  );

  // Step 2: Macro Category
  const renderCategoryStep = () => (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary text-center">Selecciona una categoria</p>
      <div className="grid grid-cols-2 gap-2">
        {macroCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedMacroCategory(cat.id)}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedMacroCategory === cat.id
                ? 'bg-primary-500 text-white'
                : 'bg-white/50 text-text-primary hover:bg-white/70'
            }`}
          >
            <span className="font-medium text-sm">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Sub Category
  const renderSubcategoryStep = () => (
    <div className="space-y-3">
      <p className="text-sm text-text-secondary text-center">
        {subCategories.length > 0 ? 'Subcategoria (opcional)' : 'No hay subcategorias disponibles'}
      </p>
      {subCategories.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {subCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedSubCategory(cat.id)}
              className={`w-full p-3 rounded-xl text-left transition-all ${
                selectedSubCategory === cat.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/50 text-text-primary hover:bg-white/70'
              }`}
            >
              <span className="text-sm">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => goNext()}
        className="w-full p-2 text-sm text-text-muted hover:text-text-primary"
      >
        {subCategories.length > 0 ? 'Omitir' : 'Continuar'}
      </button>
    </div>
  );

  // Step 4: Details
  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Payment Method */}
      {transactionType !== 'transferencia_interna' && (
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Metodo de pago</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod('efectivo')}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                paymentMethod === 'efectivo'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/50 text-text-secondary hover:bg-white/70'
              }`}
            >
              <Banknote className="h-4 w-4 mx-auto mb-1" />
              Efectivo
            </button>
            <button
              onClick={() => setPaymentMethod('debito')}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                paymentMethod === 'debito'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/50 text-text-secondary hover:bg-white/70'
              }`}
            >
              <CreditCard className="h-4 w-4 mx-auto mb-1" />
              Debito
            </button>
            <button
              onClick={() => setPaymentMethod('credito')}
              className={`p-3 rounded-xl text-sm font-medium transition-all ${
                paymentMethod === 'credito'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/50 text-text-secondary hover:bg-white/70'
              }`}
            >
              <CreditCard className="h-4 w-4 mx-auto mb-1" />
              Credito
            </button>
          </div>
        </div>
      )}

      {/* Account Selection (if not efectivo) */}
      {paymentMethod !== 'efectivo' && transactionType !== 'transferencia_interna' && (
        <div>
          <label htmlFor="account-select" className="text-sm text-text-secondary mb-2 block">Cuenta</label>
          <select
            id="account-select"
            title="Seleccionar cuenta de origen"
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full h-12 px-4 bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            {accounts
              .filter(a => a.type === 'banco' || a.type === 'billetera_virtual')
              .map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Transfer accounts */}
      {transactionType === 'transferencia_interna' && (
        <div className="space-y-3">
          <div>
            <label htmlFor="origin-account" className="text-sm text-text-secondary mb-2 block">Desde</label>
            <select
              id="origin-account"
              title="Seleccionar cuenta de origen"
              value={selectedAccount || ''}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full h-12 px-4 bg-white/60 rounded-xl border border-primary-200"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="destination-account" className="text-sm text-text-secondary mb-2 block">Hacia</label>
            <select
              id="destination-account"
              title="Seleccionar cuenta de destino"
              value={destinationAccount || ''}
              onChange={(e) => setDestinationAccount(e.target.value)}
              className="w-full h-12 px-4 bg-white/60 rounded-xl border border-primary-200"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Installments (only for credito) */}
      {paymentMethod === 'credito' && (
        <div className="p-3 rounded-xl bg-white/50">
          <label className="flex items-center gap-2 cursor-pointer" htmlFor="installment-checkbox">
            <input
              id="installment-checkbox"
              type="checkbox"
              title="Marcar si es un pago en cuotas"
              checked={isInstallment}
              onChange={(e) => setIsInstallment(e.target.checked)}
              className="w-4 h-4 rounded border-primary-300"
            />
            <span className="text-sm text-text-primary">Es en cuotas</span>
          </label>
          {isInstallment && (
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="installments-select" className="text-sm text-text-secondary">Cuota 1 de</label>
              <select
                id="installments-select"
                title="Cantidad de cuotas"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(Number.parseInt(e.target.value, 10))}
                className="h-8 px-2 bg-white rounded-lg border border-primary-200"
              >
                {[2, 3, 6, 9, 12, 18, 24].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Traffic Light Tag */}
      {transactionType === 'gasto' && (
        <div>
          <label className="text-sm text-text-secondary mb-2 block">Etiqueta (opcional)</label>
          <div className="flex gap-2">
            {Object.entries(TRAFFIC_LIGHT_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setTag(tag === key ? null : key as TrafficLight)}
                className={`flex-1 p-2 rounded-xl text-xs font-medium transition-all ${
                  tag === key
                    ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-current`
                    : 'bg-white/50 text-text-muted hover:bg-white/70'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const getCardTitle = () => {
    if (transactionType === 'transferencia_interna') return 'Transferir';
    if (transactionType === 'ingreso') return 'Nuevo Ingreso';
    return 'Nuevo Gasto';
  };

  return (
    <GlassCard variant="lavender" className="w-full max-w-md mx-auto">
      <GlassCardHeader>
        <GlassCardTitle className="text-center text-lg">
          {getCardTitle()}
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        {renderStepIndicator()}
        
        {step === 'amount' && renderAmountStep()}
        {step === 'category' && renderCategoryStep()}
        {step === 'subcategory' && renderSubcategoryStep()}
        {step === 'details' && renderDetailsStep()}

        {error && (
          <p className="text-sm text-red-500 text-center mt-4">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mt-6">
          {step === 'amount' ? null : (
            <Button variant="ghost" onClick={goBack} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Atras
            </Button>
          )}
          
          {step === 'details' ? (
            <Button 
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          ) : (
            <Button 
              onClick={goNext} 
              disabled={!canProceed()}
              className="flex-1"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
