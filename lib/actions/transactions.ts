'use server';

/**
 * Server Actions for Transactions
 * Handles all transaction-related database operations
 */

import { supabase } from '@/lib/supabase/client';
import { getUser } from '@/lib/supabase/server';
import { updateAccountBalance } from './accounts';
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionWithRelations,
  TransactionType,
  ApiResponse,
} from '@/types/database';

/**
 * Get the current user ID from the session
 * Returns the user ID or null if not authenticated
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const user = await getUser();
    if (!user) {
      return null;
    }
    return user.id;
  } catch (err) {
    console.error('Unexpected error getting user:', err);
    return null;
  }
}

/**
 * Get all transactions for a user
 * @param userId - The user's ID
 * @param options - Optional filters (limit, offset, date range)
 * @returns Array of transactions or error
 */
export async function getTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    accountId?: string;
    categoryId?: string;
    type?: TransactionType;
  }
): Promise<ApiResponse<Transaction[]>> {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }

    if (options?.accountId) {
      query = query.eq('account_id', options.accountId);
    }

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Transaction[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getTransactions:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las transacciones',
      success: false,
    };
  }
}

/**
 * Get transactions with related entities (account, category)
 * @param userId - The user's ID
 * @param options - Optional filters
 * @returns Array of transactions with relations or error
 */
export async function getTransactionsWithRelations(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<ApiResponse<TransactionWithRelations[]>> {
  try {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts!transactions_account_id_fkey (*),
        destination_account:accounts!transactions_destination_account_id_fkey (*),
        category:categories (*)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }

    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions with relations:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as TransactionWithRelations[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getTransactionsWithRelations:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las transacciones',
      success: false,
    };
  }
}

/**
 * Get a single transaction by ID
 * @param transactionId - The transaction's ID
 * @param userId - The user's ID (for security check)
 * @returns Single transaction or error
 */
export async function getTransactionById(
  transactionId: string,
  userId: string
): Promise<ApiResponse<Transaction>> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Transaction,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getTransactionById:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener la transacción',
      success: false,
    };
  }
}

/**
 * Add a new transaction
 * IMPORTANT: Handles internal transfers by updating both accounts
 * If user_id is not provided in transactionData, it will be obtained from the session
 * @param transactionData - The transaction data to insert
 * @returns Created transaction or error
 */
export async function addTransaction(
  transactionData: TransactionInsert
): Promise<ApiResponse<Transaction>> {
  try {
    // Validate required fields
    let userId = transactionData.user_id;
    
    // If user_id is not provided, try to get from session
    if (!userId) {
      const resolvedUserId = await getCurrentUserId();
      if (!resolvedUserId) {
        return {
          data: null,
          error: 'Usuario no especificado',
          success: false,
        };
      }
      userId = resolvedUserId;
    }

    if (!transactionData.account_id && transactionData.method !== 'efectivo') {
      return {
        data: null,
        error: 'Cuenta no especificada',
        success: false,
      };
    }

    if (!transactionData.amount || transactionData.amount <= 0) {
      return {
        data: null,
        error: 'El monto debe ser mayor a 0',
        success: false,
      };
    }

    // Create transaction data with user_id
    const transactionWithUser = {
      ...transactionData,
      user_id: userId,
    };

    // Handle internal transfer
    if (transactionData.type === 'transferencia_interna') {
      return await handleInternalTransfer(transactionWithUser);
    }

    // Insert the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionWithUser)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Update account balance based on transaction type
    // Skip if payment method is efectivo (no bank account involved)
    if (transactionData.account_id && transactionData.method !== 'efectivo') {
      let balanceChange = transactionData.amount;
      
      if (transactionData.type === 'gasto') {
        // Expense: subtract from account
        balanceChange = -transactionData.amount;
      }
      // For 'ingreso', balanceChange is already positive

      await updateAccountBalance(transactionData.account_id, balanceChange);
    }

    return {
      data: data as Transaction,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in addTransaction:', err);
    return {
      data: null,
      error: 'Error inesperado al crear la transacción',
      success: false,
    };
  }
}

/**
 * Handle internal transfer between accounts
 * Creates transaction and updates both account balances
 * @param transactionData - The transfer transaction data
 * @returns Created transaction or error
 */
async function handleInternalTransfer(
  transactionData: TransactionInsert
): Promise<ApiResponse<Transaction>> {
  try {
    // Validate destination account
    if (!transactionData.destination_account_id) {
      return {
        data: null,
        error: 'Cuenta destino no especificada para transferencia',
        success: false,
      };
    }

    if (transactionData.account_id === transactionData.destination_account_id) {
      return {
        data: null,
        error: 'La cuenta origen y destino no pueden ser la misma',
        success: false,
      };
    }

    // Insert the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating transfer transaction:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Update source account (subtract)
    const sourceResult = await updateAccountBalance(
      transactionData.account_id,
      -transactionData.amount
    );

    if (!sourceResult.success) {
      // Attempt to rollback the transaction
      await supabase
        .from('transactions')
        .delete()
        .eq('id', data.id);
      
      return {
        data: null,
        error: `Error al actualizar cuenta origen: ${sourceResult.error}`,
        success: false,
      };
    }

    // Update destination account (add)
    const destResult = await updateAccountBalance(
      transactionData.destination_account_id,
      transactionData.amount
    );

    if (!destResult.success) {
      // Attempt to rollback both the transaction and source account update
      await supabase
        .from('transactions')
        .delete()
        .eq('id', data.id);
      
      await updateAccountBalance(
        transactionData.account_id,
        transactionData.amount // Reverse the subtraction
      );
      
      return {
        data: null,
        error: `Error al actualizar cuenta destino: ${destResult.error}`,
        success: false,
      };
    }

    return {
      data: data as Transaction,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in handleInternalTransfer:', err);
    return {
      data: null,
      error: 'Error inesperado al procesar la transferencia',
      success: false,
    };
  }
}

/**
 * Update a transaction
 * @param transactionId - The transaction's ID
 * @param userId - The user's ID (for security check)
 * @param updates - The fields to update
 * @returns Updated transaction or error
 */
export async function updateTransaction(
  transactionId: string,
  userId: string,
  updates: TransactionUpdate
): Promise<ApiResponse<Transaction>> {
  try {
    // Get the original transaction to handle balance changes
    const { data: original, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !original) {
      return {
        data: null,
        error: 'Transacción no encontrada',
        success: false,
      };
    }

    // Update the transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Handle balance adjustments if amount or account changed
    // This is complex - for now, we'll just update without balance adjustment
    // In a real app, you'd want to reverse the old transaction's effect
    // and apply the new one

    return {
      data: data as Transaction,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in updateTransaction:', err);
    return {
      data: null,
      error: 'Error inesperado al actualizar la transacción',
      success: false,
    };
  }
}

/**
 * Delete a transaction
 * @param transactionId - The transaction's ID
 * @param userId - The user's ID (for security check)
 * @returns Success status
 */
export async function deleteTransaction(
  transactionId: string,
  userId: string
): Promise<ApiResponse<null>> {
  try {
    // Get the transaction to reverse balance changes
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !transaction) {
      return {
        data: null,
        error: 'Transacción no encontrada',
        success: false,
      };
    }

    // Delete the transaction
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting transaction:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Reverse the balance changes
    if (transaction.type === 'transferencia_interna') {
      // Reverse transfer: add back to source, subtract from destination
      if (transaction.destination_account_id) {
        await updateAccountBalance(transaction.account_id, transaction.amount);
        await updateAccountBalance(transaction.destination_account_id, -transaction.amount);
      }
    } else if (transaction.type === 'gasto') {
      // Reverse expense: add back to account
      await updateAccountBalance(transaction.account_id, transaction.amount);
    } else if (transaction.type === 'ingreso') {
      // Reverse income: subtract from account
      await updateAccountBalance(transaction.account_id, -transaction.amount);
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in deleteTransaction:', err);
    return {
      data: null,
      error: 'Error inesperado al eliminar la transacción',
      success: false,
    };
  }
}

/**
 * Get transaction summary for a date range
 * @param userId - The user's ID
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Summary with totals by type and category
 */
export async function getTransactionSummary(
  userId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<{
  total_income: number;
  total_expenses: number;
  total_transfers: number;
  by_category: Array<{ category_id: string; category_name: string; total: number }>;
  by_traffic_light: Array<{ tag: string; total: number }>;
}>> {
  try {
    // Get all transactions in range
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories (name)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error fetching transaction summary:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    // Calculate totals
    let total_income = 0;
    let total_expenses = 0;
    let total_transfers = 0;
    const categoryTotals = new Map<string, { name: string; total: number }>();
    const trafficLightTotals = new Map<string, number>();

    transactions.forEach((t: any) => {
      if (t.type === 'ingreso') {
        total_income += t.amount;
      } else if (t.type === 'gasto') {
        total_expenses += t.amount;
        
        // Category totals (only for expenses)
        if (t.category_id) {
          const existing = categoryTotals.get(t.category_id) || {
            name: t.category?.name || 'Sin categoría',
            total: 0,
          };
          existing.total += t.amount;
          categoryTotals.set(t.category_id, existing);
        }

        // Traffic light totals
        if (t.tag) {
          trafficLightTotals.set(t.tag, (trafficLightTotals.get(t.tag) || 0) + t.amount);
        }
      } else if (t.type === 'transferencia_interna') {
        total_transfers += t.amount;
      }
    });

    // Convert maps to arrays
    const by_category = Array.from(categoryTotals.entries()).map(([id, data]) => ({
      category_id: id,
      category_name: data.name,
      total: data.total,
    }));

    const by_traffic_light = Array.from(trafficLightTotals.entries()).map(([tag, total]) => ({
      tag,
      total,
    }));

    return {
      data: {
        total_income,
        total_expenses,
        total_transfers,
        by_category,
        by_traffic_light,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getTransactionSummary:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener el resumen',
      success: false,
    };
  }
}

/**
 * Get recent transactions for dashboard
 * @param userId - The user's ID
 * @param limit - Number of transactions to return (default: 10)
 * @returns Array of recent transactions with relations
 */
export async function getRecentTransactions(
  userId: string,
  limit: number = 10
): Promise<ApiResponse<TransactionWithRelations[]>> {
  return getTransactionsWithRelations(userId, { limit });
}
