/**
 * TypeScript types for Supabase database
 * These types mirror the SQL schema defined in the database
 */

// ============================================
// ENUMS
// ============================================

/**
 * Payment method enum
 * Matches PostgreSQL enum: payment_method
 */
export type PaymentMethod =
  | 'transferencia'
  | 'qr'
  | 'debito'
  | 'debito_automatico'
  | 'credito'
  | 'descubierto'
  | 'efectivo'
  | 'fiado_adrian';

/**
 * Transaction type enum
 * Matches PostgreSQL enum: transaction_type
 */
export type TransactionType =
  | 'gasto'
  | 'ingreso'
  | 'transferencia_interna';

/**
 * Traffic light enum for expense categorization (Economía de Guerra)
 * Matches PostgreSQL enum: traffic_light
 */
export type TrafficLight =
  | 'inevitable'
  | 'optimizable'
  | 'evitable';

/**
 * Recurring frequency enum for recurring expenses
 */
export type RecurringFrequency =
  | 'diario'
  | 'semanal'
  | 'quincenal'
  | 'mensual';

/**
 * Account type enum
 * Matches PostgreSQL check constraint on accounts.type
 */
export type AccountType =
  | 'banco'
  | 'billetera_virtual'
  | 'efectivo'
  | 'tarjeta_credito'
  | 'deuda_fiado';

// ============================================
// TABLE INTERFACES
// ============================================

/**
 * Account entity
 * Represents bank accounts, wallets, cash, credit cards, and debts
 */
export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at: string; // ISO 8601 timestamp
  closing_day?: number | null;
  due_day?: number | null;
  interest_rate?: number | null;
  last_interest_charge?: string | null;
  notes?: string | null;
}

/**
 * Category entity
 * Supports nested categories via parent_id
 * Parent categories (macro) have null parent_id
 * Child categories reference their parent
 */
export interface Category {
  id: string;
  name: string;
  icon_slug: string | null;
  parent_id: string | null;
  is_system: boolean;
}

/**
 * Transaction entity
 * The core entity for tracking all financial movements
 */
export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  destination_account_id: string | null; // Only for internal transfers
  category_id: string | null;
  amount: number;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  description: string | null;
  type: TransactionType;
  method: PaymentMethod;
  
  // Installment fields
  is_installment: boolean;
  current_installment: number | null;
  total_installments: number | null;
  
  // Recurring expense fields
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  
  // Traffic light tag
  tag: TrafficLight | null;
  
  created_at: string; // ISO 8601 timestamp
}

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

/**
 * Account with calculated total balance
 * Used for dashboard display
 */
export interface AccountWithBalance extends Account {
  calculated_balance?: number;
}

/**
 * Category with nested children
 * Used for building the category tree
 */
export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

/**
 * Transaction with related entities
 * Used for detailed transaction views
 */
export interface TransactionWithRelations extends Transaction {
  account?: Account;
  destination_account?: Account | null;
  category?: Category | null;
}

// ============================================
// INSERT TYPES (for creating new records)
// ============================================

/**
 * Data needed to create a new account
 */
export interface AccountInsert {
  user_id?: string;
  name: string;
  type: AccountType;
  balance?: number;
}

/**
 * Data needed to create a new transaction
 */
export interface TransactionInsert {
  user_id: string;
  account_id: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount: number;
  date?: string;
  description?: string | null;
  type: TransactionType;
  method: PaymentMethod;
  is_installment?: boolean;
  current_installment?: number | null;
  total_installments?: number | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  tag?: TrafficLight | null;
}

/**
 * Data needed to create a new category
 */
export interface CategoryInsert {
  name: string;
  icon_slug?: string | null;
  parent_id?: string | null;
  is_system?: boolean;
}

// ============================================
// UPDATE TYPES
// ============================================

/**
 * Data that can be updated on an account
 */
export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  balance?: number;
  closing_day?: number | null;
  due_day?: number | null;
  interest_rate?: number | null;
  last_interest_charge?: string | null;
  notes?: string | null;
}

/**
 * Data that can be updated on a transaction
 */
export interface TransactionUpdate {
  account_id?: string;
  destination_account_id?: string | null;
  category_id?: string | null;
  amount?: number;
  date?: string;
  description?: string | null;
  type?: TransactionType;
  method?: PaymentMethod;
  is_installment?: boolean;
  current_installment?: number | null;
  total_installments?: number | null;
  is_recurring?: boolean;
  recurring_frequency?: RecurringFrequency | null;
  tag?: TrafficLight | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Account summary for dashboard
 */
export interface AccountSummary {
  total_balance: number;
  accounts: Account[];
  by_type: Record<AccountType, number>;
}

// ============================================
// USER PREFERENCES TYPES
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'azul' | 'rojo' | 'indigo' | 'verde' | 'naranja';

/**
 * User preferences for the app
 */
export interface UserPreferences {
  id: string;
  user_id: string;
  theme: ThemeMode;
  accent_color: AccentColor;
  notify_daily_reminder: boolean;
  notify_budget_alert: boolean;
  notify_unusual_expense: boolean;
  telegram_chat_id: number | null;
  telegram_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Category tree node for UI display
 */
export interface CategoryTreeNode {
  id: string;
  name: string;
  icon_slug: string | null;
  children: CategoryTreeNode[];
}

// ============================================
// TELEGRAM MESSAGE TYPES
// ============================================

/**
 * Telegram message status
 */
export type TelegramMessageStatus = 'pending' | 'processed' | 'error';

/**
 * Telegram message entity
 * Stores incoming Telegram messages for processing
 */
export interface TelegramMessage {
  id: string;
  telegram_id: number;
  chat_id: number;
  user_id: number | null;
  username: string | null;
  first_name: string | null;
  message_text: string | null;
  message_date: number;
  raw_update: Record<string, unknown>;
  status: TelegramMessageStatus;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

/**
 * Telegram user linked to app user
 */
export interface TelegramUser {
  id: string;
  telegram_id: number;
  user_id: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SUPABASE TABLE TYPES
// ============================================

/**
 * Database schema type for Supabase client
 * Use this for typed Supabase client
 */
export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: Account;
        Insert: AccountInsert;
        Update: AccountUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: Partial<CategoryInsert>;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      telegram_messages: {
        Row: TelegramMessage;
        Insert: Omit<TelegramMessage, 'id' | 'created_at'>;
        Update: Partial<Omit<TelegramMessage, 'id' | 'created_at'>>;
      };
      telegram_users: {
        Row: TelegramUser;
        Insert: Omit<TelegramUser, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TelegramUser, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Enums: {
      payment_method: PaymentMethod;
      transaction_type: TransactionType;
      traffic_light: TrafficLight;
    };
  };
}
