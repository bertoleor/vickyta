"use client";

import { useState, useEffect } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { getBudgets, createBudget, deleteBudget, getBudgetSpending } from "@/lib/actions/budgets";
import { getCategories } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";
import type { BudgetWithCategory, Category, BudgetPeriod } from "@/types/database";

export default function PresupuestosPage() {
  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newPeriod, setNewPeriod] = useState<BudgetPeriod>("monthly");
  const [spending, setSpending] = useState<Record<string, number>>({});

  // Load data
  useEffect(() => {
    async function loadData() {
      const userData = await getCurrentUser();
      
      if (userData?.id) {
        const [budgetsResult, categoriesResult] = await Promise.all([
          getBudgets(userData.id),
          getCategories()
        ]);
        
        setBudgets(budgetsResult.data || []);
        setCategories(categoriesResult.data || []);
        
        // Load spending for each budget
        const spendingData: Record<string, number> = {};
        for (const budget of budgetsResult.data || []) {
          const spent = await getBudgetSpending(
            userData.id,
            budget.category_id,
            budget.period
          );
          spendingData[budget.id] = spent;
        }
        setSpending(spendingData);
      }
      
      setLoading(false);
    }
    
    loadData();
  }, []);

  const handleAddBudget = async () => {
    const userData = await getCurrentUser();
    if (!userData?.id || !newAmount) return;

    const result = await createBudget(
      userData.id,
      newCategory || null,
      Number(newAmount),
      newPeriod
    );

    if (result.data) {
      setBudgets([result.data, ...budgets]);
      setShowAddForm(false);
      setNewAmount("");
      setNewCategory("");
      setNewPeriod("monthly");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const result = await deleteBudget(id);
    if (!result.error) {
      setBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const getProgressColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-orange-500";
    return "bg-primary";
  };

  const getProgressWidth = (spent: number, budget: number) => {
    const percentage = Math.min((spent / budget) * 100, 100);
    return `${percentage}%`;
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <div className="h-8 w-32 bg-neutral-100 rounded mx-auto animate-pulse" />
        </div>
        <div className="h-48 bg-neutral-50 rounded-2xl animate-pulse" />
        <div className="h-48 bg-neutral-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Presupuestos</h1>
          <p className="text-text-secondary text-sm">
            Controla tus gastos por categoría
          </p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo
        </Button>
      </div>

      {/* Add Budget Form */}
      {showAddForm && (
        <GlassCard variant="elevated">
          <GlassCardHeader>
            <GlassCardTitle>Agregar Presupuesto</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Monto
              </label>
              <Input
                type="number"
                placeholder="Ej: 50000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Categoría (opcional)
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border-light bg-background text-text-primary"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="">Total (sin categoría)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Período
              </label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border-light bg-background text-text-primary"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value as BudgetPeriod)}
              >
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" onClick={handleAddBudget}>
                <Check className="h-4 w-4 mr-2" />
                Guardar
              </Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <Wallet className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              No hay presupuestos configurados
            </p>
            <p className="text-text-muted text-sm mt-1">
              Agregá un presupuesto para controlar tus gastos
            </p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = spending[budget.id] || 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const isOverBudget = percentage >= 100;
            const isWarning = percentage >= 80 && percentage < 100;
            
            return (
              <GlassCard 
                key={budget.id} 
                variant={isOverBudget ? "elevated" : "default"}
                className={isOverBudget ? "border-red-200" : ""}
              >
                <GlassCardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-text-primary">
                        {budget.category?.name || "Presupuesto Total"}
                      </p>
                      <p className="text-xs text-text-muted capitalize">
                        {budget.period === "weekly" ? "Semanal" : 
                         budget.period === "monthly" ? "Mensual" : "Anual"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-text-primary">
                        {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                      </p>
                      <p className={`text-xs ${isOverBudget ? "text-red-500" : "text-text-muted"}`}>
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-neutral-100 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all ${getProgressColor(spent, budget.amount)}`}
                      style={{ width: getProgressWidth(spent, budget.amount) }}
                    />
                  </div>

                  {/* Warning/Over budget indicator */}
                  {isOverBudget && (
                    <div className="flex items-center gap-2 text-red-500 text-sm mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Has superado el presupuesto</span>
                    </div>
                  )}
                  {isWarning && !isOverBudget && (
                    <div className="flex items-center gap-2 text-orange-500 text-sm mb-3">
                      <TrendingDown className="h-4 w-4" />
                      <span>Casi llegás al límite (80%)</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
