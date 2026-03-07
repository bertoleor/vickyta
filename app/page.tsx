import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Greeting } from "@/components/ui/Greeting";
import { ExpenseFormCard } from "@/components/ui/ExpenseFormCard";
import { 
  Wallet, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight,
  MessageCircle
} from "lucide-react";
import { getAccountSummary } from "@/lib/actions";
import { getRecentTransactions, getTransactionSummary } from "@/lib/actions/transactions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency } from "@/lib/constants";

/**
 * Dashboard page - Main financial overview
 * Connected to Supabase for real data
 */
export default async function DashboardPage() {
  // Get current user
  const user = await getCurrentUser();
  const displayName = user?.displayName || "Vicky";

  // Get account summary
  const accountsResult = await getAccountSummary(user?.id || "");
  const accountSummary = accountsResult.data;

  // Get recent transactions
  const transactionsResult = await getRecentTransactions(user?.id || "", 5);
  const recentTransactions = transactionsResult.data || [];

  // Get weekly summary
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const summaryResult = await getTransactionSummary(
    user?.id || "",
    weekAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  );
  const summary = summaryResult.data;

  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formattedDate = today.toLocaleDateString('es-AR', dateOptions);

  // Calculate balance
  const totalBalance = accountSummary?.total_balance || 0;
  const totalIncome = summary?.total_income || 0;
  const totalExpenses = summary?.total_expenses || 0;

  // Prepare weekly summary for chart
  const weeklySummaryData = summary?.by_category?.slice(0, 4) || [];
  const totalCategoryAmount = weeklySummaryData.reduce((sum, cat) => sum + cat.total, 0);
  
  const weeklySummary = weeklySummaryData.map(cat => ({
    category: cat.category_name,
    percentage: totalCategoryAmount > 0 ? Math.round((cat.total / totalCategoryAmount) * 100) : 0,
    color: getCategoryColor(cat.category_name),
  }));

  const getTransactionTypeColor = (type: string) => {
    if (type === 'ingreso') return 'text-green-600';
    if (type === 'gasto') return 'text-red-600';
    return 'text-blue-600';
  };

  const getTransactionTypeSign = (type: string) => {
    return type === 'ingreso' ? '+' : '-';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header - Greeting with typewriter effect */}
      <div className="text-center pt-4 pb-2">
        <Greeting name={displayName} />
        <p className="text-text-secondary mt-1 text-sm capitalize">
          {formattedDate}
        </p>
      </div>

      {/* Balance Card */}
      <GlassCard variant="elevated" className="relative overflow-hidden">
        <GlassCardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-primary-100">
              <Wallet className="h-5 w-5 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-text-secondary">Saldo Disponible</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold text-text-primary tracking-tight">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          {/* Income/Expense mini cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-100/60">
              <div className="p-1.5 rounded-lg bg-secondary-200">
                <TrendingUp className="h-4 w-4 text-secondary-700" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Ingresos</p>
                <p className="text-sm font-semibold text-text-primary">+{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-100/60">
              <div className="p-1.5 rounded-lg bg-accent-200">
                <TrendingDown className="h-4 w-4 text-accent-700" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Gastos</p>
                <p className="text-sm font-semibold text-text-primary">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <GlassCard variant="default">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary-100">
                <MessageCircle className="h-4 w-4 text-primary-600" />
              </div>
              Movimientos Recientes
              <span className="ml-auto text-xs font-normal text-text-muted bg-primary-100 px-2 py-0.5 rounded-full">
                {recentTransactions.length}
              </span>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-primary-50 transition-colors cursor-pointer group"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {tx.description || tx.category?.name || "Sin descripción"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(tx.amount)} • {new Date(tx.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className={`text-sm font-medium ${getTransactionTypeColor(tx.type)}`}>
                  {getTransactionTypeSign(tx.type)}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
            
            <Button variant="ghost" className="w-full mt-2 text-primary-600 hover:text-primary-700">
              Ver todos los movimientos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Smart Expense Form */}
      <ExpenseFormCard />

      {/* Weekly Summary */}
      {weeklySummary.length > 0 && (
        <GlassCard variant="cyan">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-secondary-200">
                <Sparkles className="h-4 w-4 text-secondary-700" />
              </div>
              Esta Semana
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-3">
            {weeklySummary.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.category}</span>
                  <span className="text-text-muted">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                  <div // NOSONAR
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Empty State */}
      {recentTransactions.length === 0 && (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <p className="text-text-secondary">No hay movimientos registrados aún.</p>
            <p className="text-text-muted text-sm mt-1">Los gastos que registres aparecerán aquí.</p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

// Helper function to get category colors
function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    'Súper & Alimentos': 'bg-primary-400',
    'Trabajo & Transporte': 'bg-secondary-400',
    'Casa & Servicios': 'bg-accent-400',
    'Extras & Hormiga': 'bg-primary-300',
    'Deudas & Bancos': 'bg-secondary-300',
  };
  
  // Check for partial matches
  for (const [key, color] of Object.entries(colors)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return color;
    }
  }
  
  return 'bg-primary-300';
}
