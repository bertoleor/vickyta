"use server";

import { supabase } from "@/lib/supabase/client";
import type { Budget, BudgetWithCategory, BudgetPeriod } from "@/types/database";

export async function getBudgets(userId: string): Promise<{ data: BudgetWithCategory[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching budgets:", error);
    return { data: null, error: "Error al cargar presupuestos" };
  }

  return { data: data as BudgetWithCategory[], error: null };
}

export async function getBudgetsByPeriod(
  userId: string, 
  period: BudgetPeriod
): Promise<{ data: BudgetWithCategory[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("user_id", userId)
    .eq("period", period)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching budgets:", error);
    return { data: null, error: "Error al cargar presupuestos" };
  }

  return { data: data as BudgetWithCategory[], error: null };
}

export async function createBudget(
  userId: string,
  categoryId: string | null,
  amount: number,
  period: BudgetPeriod
): Promise<{ data: Budget | null; error: string | null }> {
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: userId,
      category_id: categoryId,
      amount,
      period,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating budget:", error);
    return { data: null, error: "Error al crear presupuesto" };
  }

  return { data: data as Budget, error: null };
}

export async function updateBudget(
  budgetId: string,
  amount: number,
  period: BudgetPeriod
): Promise<{ data: Budget | null; error: string | null }> {
  const { data, error } = await supabase
    .from("budgets")
    .update({
      amount,
      period,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId)
    .select()
    .single();

  if (error) {
    console.error("Error updating budget:", error);
    return { data: null, error: "Error al actualizar presupuesto" };
  }

  return { data: data as Budget, error: null };
}

export async function deleteBudget(budgetId: string): Promise<{ data: null; error: string | null }> {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId);

  if (error) {
    console.error("Error deleting budget:", error);
    return { data: null, error: "Error al eliminar presupuesto" };
  }

  return { data: null, error: null };
}

export async function getBudgetSpending(
  userId: string,
  categoryId: string | null,
  period: BudgetPeriod
): Promise<number> {
  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case "weekly":
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  let query = supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("type", "gasto")
    .gte("date", startDate.toISOString().split("T")[0]);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching spending:", error);
    return 0;
  }

  return (data || []).reduce((sum: number, tx: { amount: number }) => sum + Number(tx.amount), 0);
}
