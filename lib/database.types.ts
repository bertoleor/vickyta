// database.types.ts — VICKY DB schema types (auto-generated)
// Generated from supabase/migrations/0001_vicky_initial.sql + 0002_telegram.sql + 0003_rls_policies_budgets.sql
// DO NOT EDIT MANUALLY — regenerate from schema migrations.

export type Category = {
  id: string; // uuid
  name: string;
  icon_slug: string;
  parent_id: string | null; // uuid or null
  is_system: boolean;
};

export type Account = {
  id: string; // uuid
  user_id: string; // uuid
  name: string;
  type: 'banco' | 'billetera_virtual' | 'efectivo' | 'tarjeta_credito' | 'deuda_fiado';
  balance: number;
  created_at: Date;
  closing_day: number;
  due_day: number;
  interest_rate: number;
  last_interest_charge: Date;
  notes: string;
};

export type Transaction = {
  id: string; // uuid
  user_id: string; // uuid
  account_id: string; // uuid
  destination_account_id: string | null; // uuid or null
  category_id: string; // uuid
  amount: number;
  date: Date; // Date (not timestamp)
  description: string;
  type: 'gasto' | 'ingreso' | 'transferencia_interna';
  method: 'transferencia' | 'qr' | 'debito' | 'debito_automatico' | 'credito' | 'descubierto' | 'efectivo' | 'fiado_adrian';
  is_installment: boolean;
  current_installment: number;
  total_installments: number;
  tag: 'inevitable' | 'optimizable' | 'evitable';
  created_at: Date; // timestamptz → Date
  is_recurring: boolean;
  recurring_frequency: string;
};

export type Budget = {
  id: string; // uuid
  user_id: string; // uuid
  category_id: string; // uuid
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  created_at: Date; // timestamptz → Date
  updated_at: Date; // timestamptz → Date
};

export type UserPreference = {
  id: string; // uuid
  user_id: string; // uuid
  theme: 'light' | 'dark' | 'system';
  accent_color: string; // default 'azul'
  notify_daily_reminder: boolean;
  notify_budget_alert: boolean;
};

export type TelegramUser = {
  id: string; // uuid
  telegram_id: number; // bigint (64-bit integer)
  user_id: string; // uuid
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: Date; // timestamptz → Date
  updated_at: Date; // timestamptz → Date
};

export type TelegramMessage = {
  id: string; // uuid
  telegram_id: number; // bigint (64-bit integer)
  chat_id: number; // bigint (64-bit integer)
  user_id: string | null; // uuid
  username: string | null;
  first_name: string | null;
  message_text: string;
  message_date: number; // bigint (epoch ms)
  raw_update: any; // jsonb → unknown (preserve structure)
  status: 'pending' | 'processed' | 'error';
  error_message: string | null;
  processed_at: Date | null; // timestamptz → Date
  created_at: Date; // timestamptz → Date
};

export type TelegramSession = {
  id: string; // uuid
  chat_id: number; // bigint (64-bit integer)
  step: string;
  amount: number | null;
  description: string;
  category_id: string | null; // uuid
  category_name: string | null;
  method: string;
  bank: string | null;
  installments: number | null;
  verification_code: string | null;
  verification_expires_at: Date | null; // timestamptz → Date
  created_at: Date; // timestamptz → Date
  updated_at: Date; // timestamptz → Date
};

export type PendingTelegramMessage = {
  id: string; // uuid
  telegram_id: number; // bigint
  chat_id: number; // bigint
  user_id: string; // uuid
  username: string | null;
  first_name: string | null;
  message_text: string;
  message_date: number; // bigint (epoch ms)
  raw_update: any; // jsonb → unknown (preserve structure)
  created_at: Date; // timestamptz → Date
};

export type TransactionType = 'gasto' | 'ingreso' | 'transferencia_interna';
export type PaymentMethod = 'transferencia' | 'qr' | 'debito' | 'debito_automatico' | 'credito' | 'descubierto' | 'efectivo' | 'fiado_adrian';
export type TrafficLight = 'inevitable' | 'optimizable' | 'evitable';
export type Period = 'weekly' | 'monthly' | 'yearly';
export type Status = 'pending' | 'processed' | 'error';
export type UserRole = 'user' | 'service_role';