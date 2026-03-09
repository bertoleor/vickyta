"use server";

import { supabase } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/constants";

export async function exportTransactionsToCSV(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data: string | null; error: string | null }> {
  try {
    let query = supabase
      .from("transactions")
      .select(`
        id,
        date,
        description,
        amount,
        type,
        method,
        category:categories(name),
        account:accounts(name)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching transactions for export:", error);
      return { data: null, error: "Error al obtener transacciones" };
    }

    if (!data || data.length === 0) {
      return { data: null, error: "No hay transacciones para exportar" };
    }

    // Create CSV header
    const headers = ["Fecha", "Descripción", "Monto", "Tipo", "Método", "Categoría", "Cuenta"];

    // Create CSV rows
    const rows = data.map((tx: any) => {
      const date = new Date(tx.date).toLocaleDateString("es-AR");
      const description = tx.description || "Sin descripción";
      const amount = tx.type === "ingreso" 
        ? formatCurrency(tx.amount) 
        : `-${formatCurrency(tx.amount)}`;
      const type = tx.type === "ingreso" ? "Ingreso" : "Gasto";
      const method = getMethodLabel(tx.method);
      const category = tx.category?.name || "Sin categoría";
      const account = tx.account?.name || "Sin cuenta";

      return [date, description, amount, type, method, category, account].join(",");
    });

    // Combine header and rows
    const csv = [headers.join(","), ...rows].join("\n");

    return { data: csv, error: null };
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return { data: null, error: "Error al exportar transacciones" };
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case "efectivo":
      return "Efectivo";
    case "tarjeta_debito":
      return "Tarjeta de Débito";
    case "tarjeta_credito":
      return "Tarjeta de Crédito";
    case "transferencia":
      return "Transferencia";
    case "otro":
      return "Otro";
    default:
      return method;
  }
}
