import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { 
  Wallet, 
  Plus,
  TrendingUp
} from "lucide-react";
import { getTransactions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";

/**
 * Ingresos Page - Server Component
 * Connected to Supabase for real data
 */
export default async function IngresosPage() {
  // Get current user
  const user = await getCurrentUser();

  // Get income transactions
  const transactionsResult = await getTransactions(user?.id || "", {
    type: "ingreso",
    limit: 50,
  });
  const incomes = transactionsResult.data || [];

  // Calculate totals
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  // Group by month
  const groupByMonth = (items: typeof incomes) => {
    const groups: { [key: string]: typeof incomes } = {};
    items.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(item);
    });
    return groups;
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const groupedByMonth = groupByMonth(incomes);
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-delicate text-2xl font-semibold text-text-primary">
          Ingresos
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Cargar ingresos por trabajo
        </p>
      </div>

      {/* Summary Card */}
      <GlassCard variant="elevated" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary-300/30 to-primary-300/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <GlassCardContent className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-secondary-100">
              <TrendingUp className="h-5 w-5 text-secondary-600" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Total Ingresos</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-text-primary tracking-tight">
              {formatCurrency(totalIncome)}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            {incomes.length} ingresos registrados
          </p>
        </GlassCardContent>
      </GlassCard>

      {/* Add Income */}
      <GlassCard variant="lavender">
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary-200">
              <Plus className="h-4 w-4 text-primary-700" />
            </div>
            Agregar Ingreso
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Descripción (ej: Colegio San Martín)"
              className="flex-1 h-10 px-3 text-sm bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="text"
              placeholder="$0"
              className="w-28 h-10 px-3 text-sm bg-white/60 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300 text-right"
            />
            <Button size="sm" className="h-10 px-4">
              Agregar
            </Button>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Income by Month */}
      {sortedMonths.map((monthKey) => {
        const monthIncomes = groupedByMonth[monthKey];
        const monthTotal = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

        return (
          <GlassCard key={monthKey} variant="default">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center justify-between text-base capitalize">
                <span>{formatMonth(monthKey)}</span>
                <span className="text-sm font-normal text-secondary-600">
                  +{formatCurrency(monthTotal)}
                </span>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              {monthIncomes.map((income) => (
                <div 
                  key={income.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {income.description || "Ingreso"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(income.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="text-sm font-semibold text-secondary-600">
                    +{formatCurrency(income.amount)}
                  </div>
                </div>
              ))}
            </GlassCardContent>
          </GlassCard>
        );
      })}

      {/* Empty State */}
      {incomes.length === 0 && (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <Wallet className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No hay ingresos registrados.</p>
            <p className="text-text-muted text-sm mt-1">
              Registra tus ingresos para llevar un control.
            </p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
