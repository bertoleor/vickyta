import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ExpenseFormCard } from "@/components/ui/ExpenseFormCard";
import { 
  ChevronRight,
  Package
} from "lucide-react";
import { getCategories, getTransactions } from "@/lib/actions";
import { getCurrentUser } from "@/lib/auth/actions";
import { formatCurrency, getCategoryIcon } from "@/lib/constants";
import type { Category, Transaction } from "@/types/database";

/**
 * Manejo de Gastos Page - Server Component
 * Connected to Supabase for real data
 */
export default async function GastosPage() {
  // Get current user
  const user = await getCurrentUser();

  // Get categories
  const categoriesResult = await getCategories();
  const categories = categoriesResult.data || [];

  // Get expenses (gastos only)
  const transactionsResult = await getTransactions(user?.id || "", {
    type: "gasto",
    limit: 50,
  });
  const expenses = transactionsResult.data || [];

  // Separate pending (no category) and categorized
  const pendingExpenses = expenses.filter(e => !e.category_id);
  const categorizedExpenses = expenses.filter(e => e.category_id);

  // Group expenses by category
  const expensesByCategory = new Map<string, Transaction[]>();
  categorizedExpenses.forEach(expense => {
    const catId = expense.category_id || "uncategorized";
    if (!expensesByCategory.has(catId)) {
      expensesByCategory.set(catId, []);
    }
    expensesByCategory.get(catId)!.push(expense);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="font-delicate text-2xl font-semibold text-text-primary">
          Manejo de Gastos
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Categoriza y gestiona tus gastos
        </p>
      </div>

      {/* Smart Expense Form */}
      <ExpenseFormCard />

      {/* Pending Telegram Messages */}
      {pendingExpenses.length > 0 && (
        <GlassCard variant="rose">
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-accent-200">
                <Package className="h-4 w-4 text-accent-700" />
              </div>
              Pendientes de Categorizar
              <span className="ml-auto text-xs font-normal text-text-muted bg-accent-100 px-2 py-0.5 rounded-full">
                {pendingExpenses.length}
              </span>
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent className="space-y-2">
            {pendingExpenses.map((expense) => (
              <div 
                key={expense.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white/70 transition-colors cursor-pointer"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {expense.description || "Sin descripción"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatCurrency(expense.amount)} • {new Date(expense.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="text-accent-600">
                  Categorizar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            ))}
          </GlassCardContent>
        </GlassCard>
      )}

      {/* Categories with expenses */}
      {categories.filter(c => c.parent_id === null).map((parentCategory) => {
        const Icon = getCategoryIcon(parentCategory.icon_slug);
        const categoryExpenses = expensesByCategory.get(parentCategory.id) || [];
        
        // Also check child categories
        const childCategories = categories.filter(c => c.parent_id === parentCategory.id);
        childCategories.forEach(child => {
          const childExpenses = expensesByCategory.get(child.id) || [];
          categoryExpenses.push(...childExpenses);
        });

        if (categoryExpenses.length === 0) return null;

        const totalAmount = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);

        return (
          <GlassCard key={parentCategory.id} variant="default">
            <GlassCardHeader>
              <GlassCardTitle className="flex items-center gap-2 text-base">
                <div className="p-1.5 rounded-lg bg-primary-100">
                  <Icon className="h-4 w-4 text-primary-600" />
                </div>
                {parentCategory.name}
                <span className="ml-auto text-xs font-normal text-text-muted bg-primary-100 px-2 py-0.5 rounded-full">
                  {categoryExpenses.length}
                </span>
              </GlassCardTitle>
            </GlassCardHeader>
            <GlassCardContent className="space-y-2">
              {categoryExpenses.slice(0, 5).map((expense) => (
                <div 
                  key={expense.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-primary-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {expense.description || "Sin descripción"}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatCurrency(expense.amount)} • {new Date(expense.date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              ))}
              {categoryExpenses.length > 5 && (
                <Button variant="ghost" className="w-full text-primary-600">
                  Ver {categoryExpenses.length - 5} más
                </Button>
              )}
              <div className="pt-2 border-t border-primary-100">
                <p className="text-sm text-text-muted">
                  Total: <span className="font-semibold text-text-primary">{formatCurrency(totalAmount)}</span>
                </p>
              </div>
            </GlassCardContent>
          </GlassCard>
        );
      })}

      {/* Empty State */}
      {expenses.length === 0 && (
        <GlassCard variant="default" className="text-center py-8">
          <GlassCardContent>
            <p className="text-text-secondary">No hay gastos registrados.</p>
            <p className="text-text-muted text-sm mt-1">
              Los gastos que registres aparecerán aquí.
            </p>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
