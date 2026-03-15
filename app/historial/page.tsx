"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TransactionDetailsModal } from "@/components/ui/TransactionDetailsModal";
import { 
  History, 
  TrendingDown,
  TrendingUp,
  Filter,
  Calendar,
  Download
} from "lucide-react";
import { getTransactions, getCategories, getAccounts } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";
import type { Transaction, Category, Account } from "@/types/database";

/**
 * Historial Page - Client Component
 * Connected to Supabase for real data with filters
 */
export default function HistorialPage() {
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedTransaction, setSelectedTransaction] = useState<typeof transactions[0] | null>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      const userData = await getCurrentUser();
      
      if (userData?.id) {
        const [txResult, catResult, accResult] = await Promise.all([
          getTransactions(userData.id, { limit: 500 }),
          getCategories(),
          getAccounts(userData.id),
        ]);
        
        setTransactions(txResult.data || []);
        setCategories(catResult.data || []);
        setAccounts(accResult.data || []);
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (filterType !== "all" && tx.type !== filterType) return false;
      
      // Category filter
      if (filterCategory !== "all" && tx.category_id !== filterCategory) return false;
      
      // Account filter
      if (filterAccount !== "all" && tx.account_id !== filterAccount) return false;
      
      // Date from filter
      if (filterDateFrom && tx.date < filterDateFrom) return false;
      
      // Date to filter
      if (filterDateTo && tx.date > filterDateTo) return false;
      
      // Search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const description = tx.description?.toLowerCase() || "";
        if (!description.includes(search)) return false;
      }
      
      return true;
    });
  }, [transactions, filterType, filterCategory, filterAccount, filterDateFrom, filterDateTo, searchTerm]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });
    
    // Sort dates descending
    return Object.entries(groups)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .reduce((acc, [date, txs]) => {
        acc[date] = txs;
        return acc;
      }, {} as { [key: string]: Transaction[] });
  }, [filteredTransactions]);

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter(i => i.type === "ingreso")
      .reduce((sum, i) => sum + i.amount, 0);
    const expense = filteredTransactions
      .filter(i => i.type === "gasto")
      .reduce((sum, i) => sum + i.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  // Clear all filters
  const clearFilters = () => {
    setFilterType("all");
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchTerm("");
  };

  // Has active filters
  const hasFilters = filterType !== "all" || filterCategory !== "all" || 
    filterAccount !== "all" || filterDateFrom || filterDateTo || searchTerm;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return "Hoy";
    } else if (dateStr === yesterdayStr) {
      return "Ayer";
    } else {
      return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    if (type === "ingreso") return "Ingreso";
    if (type === "transferencia_interna") return "Transferencia";
    return "Gasto";
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sin categoría";
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Sin categoría";
  };

  const getMethodLabel = (method: string): string => {
    switch (method) {
      case "efectivo": return "Efectivo";
      case "tarjeta_debito": return "Tarjeta de Débito";
      case "tarjeta_credito": return "Tarjeta de Crédito";
      case "transferencia": return "Transferencia";
      case "otro": return "Otro";
      default: return method;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <div className="h-8 w-32 bg-neutral-100 rounded mx-auto animate-pulse" />
        </div>
        <div className="h-64 bg-neutral-50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Historial</h1>
          <p className="text-text-secondary text-sm">{filteredTransactions.length} movimientos</p>
        </div>
        <Button 
          variant={showFilters ? "primary" : "ghost"} 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasFilters && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
              {[filterType !== "all", filterCategory !== "all", filterAccount !== "all", !!filterDateFrom, !!filterDateTo, !!searchTerm].filter(Boolean).length}
            </span>
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            // Export to CSV
            const headers = ["Fecha", "Descripción", "Monto", "Tipo", "Método", "Categoría"];
            const rows = filteredTransactions.map(tx => [
              new Date(tx.date).toLocaleDateString("es-AR"),
              `"${tx.description || "Sin descripción"}"`,
              tx.type === "ingreso" ? formatCurrency(tx.amount) : `-${formatCurrency(tx.amount)}`,
              tx.type === "ingreso" ? "Ingreso" : "Gasto",
              getMethodLabel(tx.method),
              getCategoryName(tx.category_id)
            ]);
            const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `historial-gastos-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <GlassCard variant="default" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-text-primary">Filtros</h3>
            {hasFilters && (
              <button 
                onClick={clearFilters}
                className="text-sm text-danger hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <Input
              placeholder="Buscar en descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="filter-type" className="block text-sm text-text-secondary mb-1">Tipo</label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
            >
              <option value="all">Todos</option>
              <option value="gasto">Gastos</option>
              <option value="ingreso">Ingresos</option>
              <option value="transferencia_interna">Transferencias</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="filter-category" className="block text-sm text-text-secondary mb-1">Categoría</label>
            <select
              id="filter-category"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label htmlFor="filter-account" className="block text-sm text-text-secondary mb-1">Cuenta</label>
            <select
              id="filter-account"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white"
            >
              <option value="all">Todas las cuentas</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Desde
              </label>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                <Calendar className="inline h-3 w-3 mr-1" />
                Hasta
              </label>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="default" className="text-center">
          <GlassCardContent className="py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-text-muted">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-primary">
              +{formatCurrency(totals.income)}
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard variant="default" className="text-center">
          <GlassCardContent className="py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-danger" />
              <span className="text-xs text-text-muted">Gastos</span>
            </div>
            <p className="text-lg font-bold text-danger">
              -{formatCurrency(totals.expense)}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Transaction List */}
      {Object.keys(groupedHistory).length > 0 ? (
        Object.entries(groupedHistory).map(([date, txs]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-medium text-text-muted px-1 capitalize">
              {formatDate(date)}
            </h3>
            <GlassCard variant="default">
              <GlassCardContent className="divide-y divide-border-light">
                {txs.map((item) => (
                  <button 
                    key={item.id}
                    className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors -mx-2 px-2 text-left"
                    onClick={() => setSelectedTransaction(item)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {item.description || "Sin descripción"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-text-muted capitalize">
                          {getTransactionTypeLabel(item.type)}
                        </span>
                        {item.category_id && (
                          <>
                            <span className="text-text-muted">•</span>
                            <span className="text-xs text-text-muted">
                              {getCategoryName(item.category_id)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${item.type === "ingreso" ? "text-emerald-600" : "text-amber-600"}`}>
                      {item.type === "ingreso" ? "+" : "-"}{formatCurrency(item.amount)}
                    </div>
                  </button>
                ))}
              </GlassCardContent>
            </GlassCard>
          </div>
        ))
      ) : (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <History className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">
              {hasFilters ? "No hay movimientos con esos filtros." : "No hay movimientos registrados."}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {hasFilters && "Intenta con otros filtros."}
            </p>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal 
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
