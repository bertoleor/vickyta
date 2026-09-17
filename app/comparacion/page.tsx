"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import { getTransactions, getCategories } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";
import type { Transaction, Category } from "@/types/database";

/** Trae todos los movimientos y arma la comparación mes a mes. */
export default function ComparacionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser();
      if (user?.id) {
        const [tx, cat] = await Promise.all([
          getTransactions(user.id, { limit: 1000 }),
          getCategories(),
        ]);
        setTransactions(tx.data || []);
        setCategories(cat.data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Agrupar por mes (YYYY-MM)
  const months = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      if (t.type === "transferencia_interna") continue;
      const key = t.date.slice(0, 7);
      const entry = map.get(key) || { income: 0, expense: 0 };
      if (t.type === "ingreso") entry.income += t.amount;
      else entry.expense += t.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [transactions]);

  // Agrupar por categoría según mes elegido
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (months.length > 0 && !months.some(([k]) => k === selectedMonth)) {
      setSelectedMonth(months[0][0]);
    }
  }, [months, selectedMonth]);

  const categorySummary = useMemo(() => {
    if (!selectedMonth) return [];
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "gasto" || !t.date.startsWith(selectedMonth)) continue;
      const name = categories.find(c => c.id === t.category_id)?.name || "Sin categoría";
      map.set(name, (map.get(name) || 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories, selectedMonth]);

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

  const monthIndex = months.findIndex(([k]) => k === selectedMonth);
  const current = monthIndex >= 0 ? months[monthIndex][1] : null;
  const previous = monthIndex >= 0 && months[monthIndex + 1] ? months[monthIndex + 1][1] : null;

  const fmtMonth = (key: string) => {
    const [y, m] = key.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  };

  const maxTotal = Math.max(1, ...months.map(([, v]) => Math.max(v.income, v.expense)));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-bold text-text-primary">Compará tus meses</h1>
        <p className="text-text-secondary mt-1 text-sm">Ingresos y gastos mes a mes</p>
      </div>

      {months.length === 0 ? (
        <GlassCard className="text-center py-10">
          <GlassCardContent>
            <BarChart3 className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Todavía no hay movimientos para comparar.</p>
            <Link href="/ingresos" className="inline-block mt-4">
              <span className="text-primary font-bold">Sumá tus ingresos</span>
            </Link>
          </GlassCardContent>
        </GlassCard>
      ) : (
        <>
          {/* Gráfico de barras de los últimos meses */}
          <GlassCard variant="default">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" /> Evolución mensual
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="flex items-end gap-2 h-40">
                {months.slice(0, 6).map(([key, v]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMonth(key)}
                    className={`flex-1 flex flex-col items-center justify-end gap-1 rounded-t-xl p-1 transition-all ${
                      selectedMonth === key ? "bg-primary/10" : "hover:bg-neutral-50"
                    }`}
                    title={fmtMonth(key)}
                  >
                    <div className="w-full space-y-1">
                      <div
                        className="w-full rounded-md bg-emerald-400"
                        style={{ height: `${Math.max(4, (v.income / maxTotal) * 80)}px` }}
                      />
                      <div
                        className="w-full rounded-md bg-red-400"
                        style={{ height: `${Math.max(4, (v.expense / maxTotal) * 80)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted font-medium">{fmtMonth(key).slice(0, 3)}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-text-muted">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-400" /> Ingresos</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-400" /> Gastos</span>
              </div>
            </GlassCardContent>
          </GlassCard>

          {/* Comparación mes actual vs anterior */}
          {current && (
            <GlassCard variant="elevated">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-5 w-5 text-primary" /> {fmtMonth(selectedMonth)}
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 mb-1">
                      <TrendingUp className="h-4 w-4" /> Ingresos
                    </div>
                    <p className="text-xl font-bold text-emerald-600">+{formatCurrency(current.income)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50">
                    <div className="flex items-center gap-2 text-xs text-red-700 mb-1">
                      <TrendingDown className="h-4 w-4" /> Gastos
                    </div>
                    <p className="text-xl font-bold text-red-500">-{formatCurrency(current.expense)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  {previous && (
                    <>
                      <div className="p-3 rounded-xl bg-background-secondary">
                        <p className="text-xs text-text-muted">Gastos del mes anterior ({fmtMonth(months[monthIndex + 1][0]).slice(0, 3)})</p>
                        <p className="font-bold text-text-primary">{formatCurrency(previous.expense)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background-secondary">
                        <p className="text-xs text-text-muted">Diferencia</p>
                        <p className={`font-bold ${current.expense - previous.expense <= 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {current.expense - previous.expense <= 0 ? "▼" : "▲"} {formatCurrency(Math.abs(current.expense - previous.expense))}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-4 pt-1">
                  {monthIndex < months.length - 1 && (
                    <button
                      onClick={() => setSelectedMonth(months[monthIndex + 1][0])}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-background-secondary text-sm font-bold text-text-primary"
                    >
                      <ChevronLeft className="h-4 w-4" /> Mes anterior
                    </button>
                  )}
                  {monthIndex > 0 && (
                    <button
                      onClick={() => setSelectedMonth(months[monthIndex - 1][0])}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-background-secondary text-sm font-bold text-text-primary"
                    >
                      Mes siguiente <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          )}

          {/* Resumen por categoría del mes */}
          {categorySummary.length > 0 && (
            <GlassCard variant="default">
              <GlassCardHeader>
                <GlassCardTitle className="flex items-center gap-2 text-base">
                  <PieChart className="h-5 w-5 text-primary" /> Gastos por categoría
                </GlassCardTitle>
              </GlassCardHeader>
              <GlassCardContent className="space-y-3">
                {categorySummary.map((c) => {
                  const pct = current && current.expense > 0 ? (c.total / current.expense) * 100 : 0;
                  return (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-primary font-medium">{c.name}</span>
                        <span className="text-text-secondary font-bold">{formatCurrency(c.total)}</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </GlassCardContent>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}