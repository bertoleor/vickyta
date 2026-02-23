'use server';

/**
 * Server Actions for Accounts
 * Handles all account-related database operations
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Account,
  AccountInsert,
  AccountUpdate,
  AccountSummary,
  AccountType,
  ApiResponse,
} from '@/types/database';

/**
 * Get all accounts for a user
 * @param userId - The user's ID
 * @returns Array of accounts or error
 */
export async function getAccounts(userId: string): Promise<ApiResponse<Account[]>> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Account[],
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getAccounts:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener las cuentas',
      success: false,
    };
  }
}

/**
 * Get account summary with total balance and breakdown by type
 * @param userId - The user's ID
 * @returns Account summary with totals
 */
export async function getAccountSummary(userId: string): Promise<ApiResponse<AccountSummary>> {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching account summary:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    const typedAccounts = accounts as Account[];
    
    // Calculate total balance
    const totalBalance = typedAccounts.reduce((sum, account) => {
      // For debt accounts, balance represents debt (negative for display)
      if (account.type === 'deuda_fiado' || account.type === 'tarjeta_credito') {
        return sum - account.balance;
      }
      return sum + account.balance;
    }, 0);

    // Group by type
    const byType = typedAccounts.reduce((acc, account) => {
      const type = account.type as AccountType;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += account.balance;
      return acc;
    }, {} as Record<AccountType, number>);

    return {
      data: {
        total_balance: totalBalance,
        accounts: typedAccounts,
        by_type: byType,
      },
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getAccountSummary:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener el resumen de cuentas',
      success: false,
    };
  }
}

/**
 * Get a single account by ID
 * @param accountId - The account's ID
 * @param userId - The user's ID (for security check)
 * @returns Single account or error
 */
export async function getAccountById(
  accountId: string,
  userId: string
): Promise<ApiResponse<Account>> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching account:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Account,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in getAccountById:', err);
    return {
      data: null,
      error: 'Error inesperado al obtener la cuenta',
      success: false,
    };
  }
}

/**
 * Create a new account
 * @param accountData - The account data to insert
 * @returns Created account or error
 */
export async function createAccount(
  accountData: AccountInsert
): Promise<ApiResponse<Account>> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Account,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in createAccount:', err);
    return {
      data: null,
      error: 'Error inesperado al crear la cuenta',
      success: false,
    };
  }
}

/**
 * Update an account
 * @param accountId - The account's ID
 * @param userId - The user's ID (for security check)
 * @param updates - The fields to update
 * @returns Updated account or error
 */
export async function updateAccount(
  accountId: string,
  userId: string,
  updates: AccountUpdate
): Promise<ApiResponse<Account>> {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', accountId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: data as Account,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in updateAccount:', err);
    return {
      data: null,
      error: 'Error inesperado al actualizar la cuenta',
      success: false,
    };
  }
}

/**
 * Update account balance (internal function for transactions)
 * @param accountId - The account's ID
 * @param amount - Amount to add (positive) or subtract (negative)
 * @returns Success status
 */
export async function updateAccountBalance(
  accountId: string,
  amount: number
): Promise<ApiResponse<null>> {
  try {
    // First get current balance
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (fetchError || !account) {
      return {
        data: null,
        error: 'Cuenta no encontrada',
        success: false,
      };
    }

    const newBalance = account.balance + amount;

    const { error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance })
      .eq('id', accountId);

    if (updateError) {
      console.error('Error updating account balance:', updateError);
      return {
        data: null,
        error: updateError.message,
        success: false,
      };
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in updateAccountBalance:', err);
    return {
      data: null,
      error: 'Error inesperado al actualizar el saldo',
      success: false,
    };
  }
}

/**
 * Delete an account
 * @param accountId - The account's ID
 * @param userId - The user's ID (for security check)
 * @returns Success status
 */
export async function deleteAccount(
  accountId: string,
  userId: string
): Promise<ApiResponse<null>> {
  try {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting account:', error);
      return {
        data: null,
        error: error.message,
        success: false,
      };
    }

    return {
      data: null,
      error: null,
      success: true,
    };
  } catch (err) {
    console.error('Unexpected error in deleteAccount:', err);
    return {
      data: null,
      error: 'Error inesperado al eliminar la cuenta',
      success: false,
    };
  }
}
