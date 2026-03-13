import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Greeting } from "@/components/ui/Greeting";
import { ExpenseFormCard } from "@/components/ui/ExpenseFormCard";
import { CategoryPieChart } from "@/components/ui/CategoryPieChart";
import { WeeklyBarChart } from "@/components/ui/WeeklyBarChart";
import { 
  Wallet, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight,
  MessageCircle,
  BarChart3
} from "lucide-react";
import { getAccountSummary, ensureDefaultCategories } from "@/lib/actions";
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

  // Ensure default categories exist (including Ernesto)
  await ensureDefaultCategories();

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

  // Get transactions for charts (last 30 days for pie chart)
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  const monthlyTransactionsResult = await getRecentTransactions(user?.id || "", 100);
  const allTransactions = monthlyTransactionsResult.data || [];
  
  // Process data for pie chart - expenses by category
  const expensesByCategory = allTransactions
    .filter(t => t.type === 'gasto')
    .reduce((acc, t) => {
      const categoryName = t.category?.name || 'Sin categoría';
      acc[categoryName] = (acc[categoryName] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
  
  const pieChartData = Object.entries(expensesByCategory).map(([category_name, total]) => ({ category_name, total }));

  // Process data for bar chart - weekly spending
  const weeklyData: { day: string; dayName: string; amount: number; type: 'gasto' | 'ingreso' }[] = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];
    const day = d.getDate().toString();
    
    const dayExpenses = allTransactions
      .filter(t => t.type === 'gasto' && t.date.split('T')[0] === dateKey)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    weeklyData.push({
      day,
      dayName,
      amount: dayExpenses,
      type: 'gasto' as const
    });
  }
  
  const barChartData = weeklyData;

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
      {/* Header - Greeting */}
      <div className="text-center pt-4 pb-2">
        <Greeting name={displayName} />
        <p className="text-text-secondary mt-1 text-sm capitalize">
          {formattedDate}
        </p>
      </div>

      {/* Balance Card */}
      <GlassCard variant="elevated" className="relative overflow-hidden border-none shadow-soft-lg bg-[var(--accent-color,#8B5CF6)]">
        <GlassCardContent>
          <div className="flex items-center gap-2 mb-4 opacity-90">
            <div className="p-2 rounded-xl bg-white/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium">Saldo Disponible</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-bold tracking-tight">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          {/* Income/Expense mini cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15">
              <div className="p-1.5 rounded-lg bg-white/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">Ingresos</p>
                <p className="text-sm font-semibold">+{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15">
              <div className="p-1.5 rounded-lg bg-white/20">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">Gastos</p>
                <p className="text-sm font-semibold">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <a href="/gastos" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-danger text-white hover:opacity-90 transition-opacity">
          <TrendingDown className="h-6 w-6 mb-1" />
          <span className="text-sm font-semibold">Gasto</span>
        </a>
        <a href="/ingresos" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-500 text-white hover:opacity-90 transition-opacity">
          <TrendingUp className="h-6 w-6 mb-1" />
          <span className="text-sm font-semibold">Ingreso</span>
        </a>
        <a href="/banco" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500 text-white hover:opacity-90 transition-opacity">
          <Wallet className="h-6 w-6 mb-1" />
          <span className="text-sm font-semibold">Cuentas</span>
        </a>
      </div>

      {/* Charts Section */}
      {pieChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-background-secondary">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                Gastos por Categoría
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <CategoryPieChart data={pieChartData} />
            </GlassCardContent>
          </GlassCard>

          <GlassCard>
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-background-secondary">
                  <TrendingDown className="h-4 w-4 text-primary" />
                </div>
                Gastos Semanales
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <WeeklyBarChart data={barChartData} />
            </GlassCardContent>
          </GlassCard>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-background-secondary">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              Movimientos Recientes
              <span className="ml-auto text-xs font-normal text-text-tertiary bg-background-secondary px-2 py-0.5 rounded-full">
                {recentTransactions.length}
              </span>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background-secondary/50 hover:bg-background-secondary transition-colors cursor-pointer group"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">
                    {tx.description || tx.category?.name || "Sin descripción"}
                  </p>
                  <p className="text-xs text-text-tertiary font-medium">
                    {formatCurrency(tx.amount)} • {new Date(tx.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className={`text-sm font-bold ${getTransactionTypeColor(tx.type)}`}>
                  {getTransactionTypeSign(tx.type)}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
            
            <Button variant="ghost" className="w-full mt-2 text-primary font-semibold hover:bg-primary/5">
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
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-background-secondary">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Resumen por Categoría
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {weeklySummary.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary font-medium">{item.category}</span>
                  <span className="text-text-tertiary font-bold">{item.percentage}%</span>
                </div>
                <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500 wp-${Math.min(100, Math.max(0, Math.round(item.percentage)))}`}
                  />
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Empty State */}
      {recentTransactions.length === 0 && (
        <GlassCard className="text-center py-8">
          <GlassCardContent>
            <p className="text-text-secondary font-medium">No hay movimientos registrados aún.</p>
            <p className="text-text-tertiary text-sm mt-1">Los gastos que registres aparecerán aquí.</p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}

// Helper function to get category colors
function getCategoryColor(categoryName: string): string {
  const colors: Record<string, string> = {
    'Súper & Alimentos': 'bg-purple-400',
    'Trabajo & Transporte': 'bg-blue-400',
    'Casa & Servicios': 'bg-orange-400',
    'Extras & Hormiga': 'bg-pink-400',
    'Deudas & Bancos': 'bg-red-400',
  };
  
  // Check for partial matches
  for (const [key, color] of Object.entries(colors)) {
    if (categoryName.includes(key) || key.includes(categoryName)) {
      return color;
    }
  }
  
  return 'bg-gray-400';
}
