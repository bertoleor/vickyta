import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  History, 
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { getTransactions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";
import type { Transaction } from "@/types/database";

/**
 * Historial Page - Server Component
 * Connected to Supabase for real data
 */
export default async function HistorialPage() {
  // Get current user
  const user = await getCurrentUser();

  // Get all transactions
  const transactionsResult = await getTransactions(user?.id || "", {
    limit: 100,
  });
  const allTransactions = transactionsResult.data || [];

  // Group by date
  const groupByDate = (items: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};
    items.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });
    return groups;
  };

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

  const groupedHistory = groupByDate(allTransactions);

  // Calculate totals
  const totalIncome = allTransactions.filter(i => i.type === "ingreso").reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = allTransactions.filter(i => i.type === "gasto").reduce((sum, i) => sum + i.amount, 0);

  // Sort dates descending
  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-delicate text-2xl font-semibold text-text-primary">
          Historial
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Todos tus movimientos
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard variant="cyan" className="text-center">
          <GlassCardContent className="py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-secondary-600" />
              <span className="text-xs text-text-muted">Ingresos</span>
            </div>
            <p className="text-lg font-bold text-secondary-600">
              +{formatCurrency(totalIncome)}
            </p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard variant="rose" className="text-center">
          <GlassCardContent className="py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-accent-600" />
              <span className="text-xs text-text-muted">Gastos</span>
            </div>
            <p className="text-lg font-bold text-accent-600">
              -{formatCurrency(totalExpense)}
            </p>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Transaction List */}
      {sortedDates.map((date) => (
        <div key={date} className="space-y-2">
          <h3 className="text-sm font-medium text-text-muted px-1 capitalize">
            {formatDate(date)}
          </h3>
          <GlassCard variant="default">
            <GlassCardContent className="divide-y divide-primary-100">
              {groupedHistory[date].map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {item.description || "Sin descripción"}
                    </p>
                    <p className="text-xs text-text-muted capitalize">
                      {item.type === "ingreso" ? "Ingreso" : 
                       item.type === "transferencia_interna" ? "Transferencia" : "Gasto"}
                    </p>
                  </div>
                  <div className={`text-sm font-semibold ${
                    item.type === "ingreso" ? "text-green-600" : 
                    item.type === "transferencia_interna" ? "text-blue-600" : "text-red-600"
                  }`}>
                    {item.type === "ingreso" ? "+" : "-"}{formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        </div>
      ))}

      {/* Empty State */}
      {allTransactions.length === 0 && (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <History className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No hay movimientos registrados.</p>
            <p className="text-text-muted text-sm mt-1">
              Los movimientos que registres aparecerán aquí.
            </p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
