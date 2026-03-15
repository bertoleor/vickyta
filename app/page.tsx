import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Greeting } from "@/components/ui/Greeting";
import { ExpenseFormCard } from "@/components/ui/ExpenseFormCard";
import { CategoryPieChart } from "@/components/ui/CategoryPieChart";
import { WeeklyBarChart } from "@/components/ui/WeeklyBarChart";
import Link from "next/link";
import { 
  Wallet, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight,
  MessageCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight
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
  // Get current user first
  const user = await getCurrentUser();
  const userId = user?.id || "";
  const displayName = user?.displayName || "Vicky";

  // Today and range calculations
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const startDate = weekAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  // Parallel Data Fetching for better performance
  const [
    accountsResult,
    recentTransactionsResult,
    summaryResult,
    monthlyTransactionsResult
  ] = await Promise.all([
    getAccountSummary(userId),
    getRecentTransactions(userId, 5),
    getTransactionSummary(userId, startDate, endDate),
    getRecentTransactions(userId, 100)
  ]);

  const accountSummary = accountsResult.data;
  const recentTransactions = recentTransactionsResult.data || [];
  const summary = summaryResult.data;
  const allTransactions = monthlyTransactionsResult.data || [];

  // Background check for categories - non-blocking but helpful
  ensureDefaultCategories().catch(console.error);

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
    if (type === 'ingreso') return 'text-emerald-600';
    if (type === 'gasto') return 'text-amber-600'; // Changed from red to amber
    return 'text-blue-500';
  };

  const getTransactionTypeSign = (type: string) => {
    return type === 'ingreso' ? '+' : '-';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header - Greeting */}
      <div className="text-center pt-4 pb-2">
        <Greeting name={displayName} />
        <p className="text-text-secondary mt-1 text-sm capitalize font-medium">
          {formattedDate}
        </p>
      </div>

      {/* Balance Card - Refined Minimal Design with Brand Color */}
      <GlassCard variant="elevated" className="relative overflow-hidden border-none shadow-soft-lg bg-[var(--accent-color,#8B5CF6)] text-white">
        <GlassCardContent className="p-6">
          <div className="flex items-center gap-2 mb-4 opacity-90">
            <div className="p-2 rounded-xl bg-white/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold">Saldo Disponible</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-8">
            <span className="text-5xl font-extrabold tracking-tight">
              {formatCurrency(totalBalance)}
            </span>
          </div>

          {/* Income/Expense mini cards - Elegant & Simple on Primary Background */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/5">
              <div className="p-2 rounded-lg bg-white/20">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Ingresos</p>
                <p className="text-sm font-bold text-white">+{formatCurrency(totalIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 border border-white/5">
              <div className="p-2 rounded-lg bg-white/20">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Gastos</p>
                <p className="text-sm font-bold text-white">-{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Quick Actions - Minimal Grid */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/gastos" className="group flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-neutral-100 shadow-soft hover:shadow-md transition-all active:scale-95">
          <div className="p-2.5 rounded-2xl bg-amber-50 group-hover:bg-amber-100 transition-colors mb-2">
            <ArrowDownLeft className="h-6 w-6 text-amber-600" />
          </div>
          <span className="text-xs font-bold text-text-secondary">Gasto</span>
        </Link>
        <Link href="/ingresos" className="group flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-neutral-100 shadow-soft hover:shadow-md transition-all active:scale-95">
          <div className="p-2.5 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 transition-colors mb-2">
            <ArrowUpRight className="h-6 w-6 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-text-secondary">Ingreso</span>
        </Link>
        <Link href="/banco" className="group flex flex-col items-center justify-center p-5 rounded-3xl bg-white border border-neutral-100 shadow-soft hover:shadow-md transition-all active:scale-95">
          <div className="p-2.5 rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-colors mb-2">
            <ArrowLeftRight className="h-6 w-6 text-blue-600" />
          </div>
          <span className="text-xs font-bold text-text-secondary">Cuentas</span>
        </Link>
      </div>

      {/* Charts Section */}
      {pieChartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="border border-neutral-100/50">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-sm font-bold">
                <div className="p-1.5 rounded-lg bg-neutral-100">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                Gastos por Categoría
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent>
              <CategoryPieChart data={pieChartData} />
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="border border-neutral-100/50">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-sm font-bold">
                <div className="p-1.5 rounded-lg bg-neutral-100">
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
        <GlassCard className="border border-neutral-100/50">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="p-1.5 rounded-lg bg-neutral-100">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              Movimientos Recientes
              <span className="ml-auto text-[10px] font-bold text-text-tertiary bg-neutral-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {recentTransactions.length}
              </span>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors cursor-pointer group border border-transparent hover:border-neutral-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-text-primary">
                    {tx.description || tx.category?.name || "Sin descripción"}
                  </p>
                  <p className="text-[11px] text-text-tertiary font-bold uppercase tracking-tight">
                    {formatCurrency(tx.amount)} • {new Date(tx.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div className={`text-sm font-black ${getTransactionTypeColor(tx.type)}`}>
                  {getTransactionTypeSign(tx.type)}{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
            
            <Link href="/historial" className="block w-full">
              <Button variant="ghost" className="w-full mt-2 text-primary font-bold hover:bg-primary/5 rounded-2xl h-12">
                Ver todos los movimientos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Smart Expense Form */}
      <ExpenseFormCard />

      {/* Weekly Summary */}
      {weeklySummary.length > 0 && (
        <GlassCard className="border border-neutral-100/50">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-sm font-bold">
              <div className="p-1.5 rounded-lg bg-neutral-100">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Resumen por Categoría
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-4">
            {weeklySummary.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-text-secondary">{item.category}</span>
                  <span className="text-text-tertiary">{item.percentage}%</span>
                </div>
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-700 wp-${Math.min(100, Math.max(0, Math.round(item.percentage)))}`}
                  />
                </div>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Empty State */}
      {recentTransactions.length === 0 && (
        <GlassCard className="text-center py-10 border border-neutral-100/50">
          <GlassCardContent>
            <p className="text-sm text-text-secondary font-bold">No hay movimientos registrados aún.</p>
            <p className="text-xs text-text-tertiary mt-1">Los gastos que registres aparecerán aquí.</p>
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
