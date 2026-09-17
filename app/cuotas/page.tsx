"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { CreditCard, Repeat, Wallet } from "lucide-react";
import { getTransactions, getAccounts, getCategories } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency, getAccountTypeConfig } from "@/lib/constants";
import type { Transaction, Account, Category } from "@/types/database";

/**
 * Gastos recursivos y en cuotas.
 * Muestra cuotas de tarjeta (n° cuota, de qué cuenta es) y gastos recurrentes.
 */
export default function RecurrentesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro: cuotas / recurrentes / todo
  const [filter, setFilter] = useState<"cuotas" | "recursivos" | "todo">("cuotas");

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user?.id) {
        const [tx, acc, cat] = await Promise.all([
          getTransactions(user.id, { limit: 1000 }),
          getAccounts(user.id),
          getCategories(),
        ]);
        setTransactions(tx.data || []);
        setAccounts(acc.data || []);
        setCategories(cat.data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const accountName = (id: string | null) => accounts.find(a => a.id === id)?.name || "Sin cuenta";

  const categoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "Sin categoría";

  const cuotas = useMemo(
    () => transactions.filter(t => t.is_installment && !t.is_recurring),
    [transactions]
  );

  const recursivos = useMemo(
    () => transactions.filter(t => t.is_recurring),
    [transactions]
  );

  const todo = useMemo(
    () => [...cuotas, ...recursivos].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [cuotas, recursivos]
  );

  const shown = filter === "cuotas" ? cuotas : filter === "recursivos" ? recursivos : todo;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <div className="h-8 w-48 bg-neutral-100 rounded mx-auto animate-pulse" />
        </div>
        <div className="h-48 bg-neutral-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const TabButton = ({ value, label, icon: Icon, count }: {
    value: typeof filter; label: string; icon: React.ComponentType<{ className?: string }>; count: number;
  }) => (
    <button
      onClick={() => setFilter(value)}
      className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
        filter === value ? "bg-primary text-white shadow-sm" : "bg-background-secondary text-text-secondary"
      }`}
    >
      <Icon className="h-4 w-4" /> {label} {count > 0 && <span className="text-xs opacity-80">({count})</span>}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-bold text-text-primary">Cuotas y recurrentes</h1>
        <p className="text-text-secondary mt-1 text-sm">Tus gastos en cuotas y los que vuelven todos los meses</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-background-secondary rounded-xl">
        <TabButton value="cuotas" label="Cuotas" icon={CreditCard} count={cuotas.length} />
        <TabButton value="recursivos" label="Recurrentes" icon={Repeat} count={recursivos.length} />
        <TabButton value="todo" label="Todo" icon={Wallet} count={shown.length} />
      </div>

      {shown.length === 0 ? (
        <GlassCard className="text-center py-10">
          <GlassCardContent>
            <CreditCard className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              {filter === "cuotas" && "No tenés gastos en cuotas."}
              {filter === "recursivos" && "No tenés gastos recurrentes."}
              {filter === "todo" && "No hay cuotas ni recurrentes todavía."}
            </p>
            <p className="text-text-muted text-sm mt-1">Cuando cargues una compra en cuotas o un servicio mensual, aparecerá acá.</p>
          </GlassCardContent>
        </GlassCard>
      ) : (
        shown.map((t) => {
          const acc = accounts.find(a => a.id === t.account_id);
          const accConfig = getAccountTypeConfig(acc?.type || "");
          const AccIcon = accConfig.icon;
          const remaining = t.is_installment && t.current_installment && t.total_installments
            ? t.total_installments - t.current_installment
            : 0;

          return (
            <GlassCard key={t.id} variant={t.is_recurring ? "default" : "default"}>
              <GlassCardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background-secondary">
                      {t.is_recurring
                        ? <Repeat className="h-4 w-4 text-primary" />
                        : <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-semibold text-text-primary">{t.description || categoryName(t.category_id)}</p>
                      <p className="text-xs text-text-muted">
                        {t.is_recurring && "Recurrente"} 
                        {t.is_recurring && t.is_installment && " · "}
                        {t.is_installment && `Cuota ${t.current_installment} de ${t.total_installments}`}
                        {remaining > 0 && ` (faltan ${remaining})`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-text-primary">{formatCurrency(t.amount)}</p>
                    <p className="text-xs text-text-muted">{new Date(t.date).toLocaleDateString("es-AR")}</p>
                  </div>
                </div>

                {/* De qué cuenta es */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-secondary/50">
                  <AccIcon className={`h-4 w-4 ${accConfig.color}`} />
                  <span className="text-sm text-text-secondary">{accountName(t.account_id)}</span>
                  <span className="ml-auto text-xs text-text-muted capitalize">{t.category_id ? categoryName(t.category_id) : "Sin categoría"}</span>
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })
      )}
    </div>
  );
}