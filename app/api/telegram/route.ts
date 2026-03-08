import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addTransaction } from "@/lib/actions/transactions";

// ============================================
// CONFIGURATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Use service role key for bot operations to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================
// TYPES
// ============================================

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
  last_name?: string;
  language_code?: string;
}

interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

interface TelegramSession {
  id?: string;
  chat_id: number;
  step: 'START' | 'CATEGORY' | 'METHOD' | 'BANK' | 'INSTALLMENTS' | 'COMPLETE';
  amount?: number;
  description?: string;
  category_id?: string;
  category_name?: string;
  method?: string;
  bank?: string;
  installments?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CONSTANTS
// ============================================

// Macro categories with their IDs (these should match your database)
const MACRO_CATEGORIES = [
  { id: 'cat-super', name: 'Super y Alimentos', emoji: '🛒' },
  { id: 'cat-trabajo', name: 'Trabajo y Transporte', emoji: '🚗' },
  { id: 'cat-casa', name: 'Casa y Servicios', emoji: '🏠' },
  { id: 'cat-extras', name: 'Extras y Hormiga', emoji: '☕' },
  { id: 'cat-deudas', name: 'Deudas y Bancos', emoji: '🏦' },
];

const PAYMENT_METHODS = [
  { id: 'efectivo', name: 'Efectivo', emoji: '💵' },
  { id: 'debito', name: 'Debito', emoji: '💳' },
  { id: 'credito', name: 'Credito', emoji: '🏦' },
  { id: 'qr', name: 'QR', emoji: '📲' },
  { id: 'transferencia', name: 'Transfer', emoji: '💸' },
  { id: 'descubierto', name: 'Descubierto', emoji: '📉' },
];

const BANKS = [
  { id: 'galicia', name: 'Galicia' },
  { id: 'nacion', name: 'Nacion' },
  { id: 'provincia', name: 'Provincia' },
  { id: 'santander', name: 'Santander' },
  { id: 'mercadopago', name: 'Mercado Pago' },
];

const INSTALLMENT_OPTIONS = [1, 3, 6, 12];

// ============================================
// VALIDATION
// ============================================

function validateRequest(request: NextRequest): boolean {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) return true; // Skip if not configured
  
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get("token");
  const tokenFromHeader = request.headers.get("x-telegram-webhook-secret");
  
  return tokenFromQuery === webhookSecret || tokenFromHeader === webhookSecret;
}

// ============================================
// TELEGRAM API
// ============================================

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: object
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");
    return;
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
    };

    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      console.error("Failed to send Telegram message:", await response.text());
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}

async function answerCallbackQuery(callbackQueryId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      }
    );
  } catch (err) {
    console.error("Error answering callback query:", err);
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

async function getSession(chatId: number): Promise<TelegramSession | null> {
  const { data, error } = await supabase
    .from('telegram_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as TelegramSession;
}

async function createSession(chatId: number): Promise<TelegramSession> {
  const session: TelegramSession = {
    chat_id: chatId,
    step: 'START',
  };

  const { data, error } = await supabase
    .from('telegram_sessions')
    .insert(session)
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return session;
  }

  return data as TelegramSession;
}

async function updateSession(chatId: number, updates: Partial<TelegramSession>): Promise<void> {
  await supabase
    .from('telegram_sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId);
}

async function clearSession(chatId: number): Promise<void> {
  await supabase
    .from('telegram_sessions')
    .delete()
    .eq('chat_id', chatId);
}

// ============================================
// ACCOUNT HELPERS
// ============================================

async function findAccountByName(name: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function getAccountBalance(accountId: string): Promise<number> {
  const { data, error } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (error || !data) return 0;
  return data.balance;
}

async function getAllAccounts(userId: string) {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, name, balance, type')
    .eq('user_id', userId);

  if (error) return [];
  return data;
}

// ============================================
// USER HELPERS
// ============================================

async function getUserIdByTelegramId(telegramId: number): Promise<string | null> {
  // For now, return a default user ID
  // In production, you'd have a telegram_users table mapping telegram_id to user_id
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.id;
}

// ============================================
// TRANSACTION HELPERS
// ============================================

async function getTodayTransactions(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('transactions')
    .select('id, amount, description, date, categories(name)')
    .eq('user_id', userId)
    .eq('type', 'gasto')
    .gte('date', today)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

async function deleteTransaction(transactionId: string): Promise<boolean> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  return !error;
}

// ============================================
// MESSAGE PARSING
// ============================================

function parseExpenseMessage(text: string): { amount: number; description: string } | null {
  if (!text || text.length < 3) return null;

  // Pattern: "500 descripcion" or "1.500 descripcion" or "1,500 descripcion"
  const expensePattern = /^(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)\s+(.+)$/i;
  const match = expensePattern.exec(text);

  if (match) {
    const amount = Number.parseFloat(match[1].replaceAll(/[.,](?=\d{3})/g, '').replaceAll(',', '.'));
    const description = match[2].trim();
    
    return { amount, description };
  }

  return null;
}

// ============================================
// KEYBOARD GENERATORS
// ============================================

function getCategoryKeyboard(): object {
  return {
    inline_keyboard: [
      ...MACRO_CATEGORIES.map(cat => [{
        text: `${cat.emoji} ${cat.name}`,
        callback_data: `cat:${cat.id}`,
      }]),
    ],
  };
}

function getMethodKeyboard(): object {
  return {
    inline_keyboard: [
      ...PAYMENT_METHODS.map(method => [{
        text: `${method.emoji} ${method.name}`,
        callback_data: `method:${method.id}`,
      }]),
    ],
  };
}

function getBankKeyboard(): object {
  return {
    inline_keyboard: [
      ...BANKS.map(bank => [{
        text: bank.name,
        callback_data: `bank:${bank.id}`,
      }]),
    ],
  };
}

function getInstallmentsKeyboard(): object {
  return {
    inline_keyboard: [
      INSTALLMENT_OPTIONS.map(num => [{
        text: `${num} cuota${num > 1 ? 's' : ''}`,
        callback_data: `installments:${num}`,
      }]),
    ],
  };
}

function getDeleteKeyboard(transactionId: string): object {
  return {
    inline_keyboard: [[
      {
        text: 'Eliminar',
        callback_data: `delete:${transactionId}`,
      },
    ]],
  };
}

// ============================================
// HANDLERS
// ============================================

async function handleStartCommand(chatId: number): Promise<void> {
  await clearSession(chatId);
  await sendTelegramMessage(
    chatId,
    `<b>Hola!</b>\n\n` +
    `Para registrar un gasto, escribe el monto y descripcion:\n` +
    `<code>4500 verduleria</code>\n\n` +
    `Comandos disponibles:\n` +
    `/hoy - Ver gastos del dia\n` +
    `/saldos - Ver balances\n` +
    `/cancelar - Cancelar operacion actual`
  );
}

async function handleHoyCommand(chatId: number): Promise<void> {
  const userId = await getUserIdByTelegramId(chatId);
  if (!userId) {
    await sendTelegramMessage(chatId, "No tienes una cuenta vinculada.");
    return;
  }

  const transactions = await getTodayTransactions(userId);
  
  if (transactions.length === 0) {
    await sendTelegramMessage(chatId, "No hay gastos registrados hoy.");
    return;
  }

  let message = `<b>Gastos de hoy:</b>\n\n`;
  let total = 0;

  for (const tx of transactions) {
    const categoryData = tx.categories as unknown as { name: string }[] | null;
    const category = categoryData?.[0]?.name || 'Sin categoria';
    message += `${tx.description || 'Sin descripcion'}\n`;
    message += `  $${tx.amount.toFixed(0)} - ${category}\n`;
    total += tx.amount;
  }

  message += `\n<b>Total: $${total.toFixed(0)}</b>`;

  // Send with delete button for last transaction
  const lastTx = transactions[0];
  await sendTelegramMessage(
    chatId,
    message,
    getDeleteKeyboard(lastTx.id)
  );
}

async function handleSaldosCommand(chatId: number): Promise<void> {
  const userId = await getUserIdByTelegramId(chatId);
  if (!userId) {
    await sendTelegramMessage(chatId, "No tienes una cuenta vinculada.");
    return;
  }

  const accounts = await getAllAccounts(userId);
  
  if (accounts.length === 0) {
    await sendTelegramMessage(chatId, "No hay cuentas registradas.");
    return;
  }

  let message = `<b>Saldos actuales:</b>\n\n`;
  let total = 0;

  for (const acc of accounts) {
    let emoji = '💳';
    if (acc.type === 'efectivo') emoji = '💵';
    else if (acc.type === 'banco') emoji = '🏦';
    else if (acc.type === 'billetera_virtual') emoji = '📲';
    message += `${emoji} ${acc.name}: <b>$${acc.balance.toFixed(0)}</b>\n`;
    total += acc.balance;
  }

  message += `\n<b>Total: $${total.toFixed(0)}</b>`;

  await sendTelegramMessage(chatId, message);
}

async function handleCancelarCommand(chatId: number): Promise<void> {
  await clearSession(chatId);
  await sendTelegramMessage(chatId, "Operacion cancelada. Escribe un monto y descripcion para comenzar de nuevo.");
}

async function handleNewExpense(chatId: number, text: string): Promise<void> {
  const parsed = parseExpenseMessage(text);
  
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      "No entendi el formato. Escribe:\n<code>MONTO DESCRIPCION</code>\n\nEjemplo: <code>4500 verduleria</code>"
    );
    return;
  }

  // Create or update session
  const session = await getSession(chatId);
  if (!session || session.step === 'COMPLETE') {
    await createSession(chatId);
  }

  await updateSession(chatId, {
    step: 'CATEGORY',
    amount: parsed.amount,
    description: parsed.description,
  });

  await sendTelegramMessage(
    chatId,
    `<b>Gasto:</b> $${parsed.amount.toFixed(0)}\n<b>Descripcion:</b> ${parsed.description}\n\nSelecciona una categoria:`,
    getCategoryKeyboard()
  );
}

async function handleCallback(callback: TelegramCallbackQuery): Promise<void> {
  const chatId = callback.message?.chat.id;
  if (!chatId || !callback.data) return;

  await answerCallbackQuery(callback.id);

  const session = await getSession(chatId);
  if (!session) {
    await sendTelegramMessage(chatId, "Sesion expirada. Escribe un nuevo gasto para comenzar.");
    return;
  }

  const [action, value] = callback.data.split(':');

  switch (action) {
    case 'cat':
      await updateSession(chatId, {
        step: 'METHOD',
        category_id: value,
        category_name: MACRO_CATEGORIES.find(c => c.id === value)?.name || 'Categoria',
      });
      await sendTelegramMessage(
        chatId,
        `Categoria: ${session.category_name || value}\n\nComo pagaste?`,
        getMethodKeyboard()
      );
      break;

    case 'method': {
      const method = value;
      await updateSession(chatId, { method });

      if (method === 'efectivo') {
        // Direct save for cash
        await saveTransaction(chatId, session);
      } else {
        // Ask for bank
        await updateSession(chatId, { step: 'BANK' });
        await sendTelegramMessage(
          chatId,
          "De que banco?",
          getBankKeyboard()
        );
      }
      break;
    }

    case 'bank': {
      const bank = value;
      await updateSession(chatId, { bank });

      if (session.method === 'credito') {
        // Ask for installments
        await updateSession(chatId, { step: 'INSTALLMENTS' });
        await sendTelegramMessage(
          chatId,
          "En cuantas cuotas?",
          getInstallmentsKeyboard()
        );
      } else {
        // Save transaction
        await saveTransaction(chatId, { ...session, bank });
      }
      break;
    }

    case 'installments': {
      const installments = Number.parseInt(value, 10);
      await updateSession(chatId, { installments, step: 'COMPLETE' });
      await saveTransaction(chatId, { ...session, installments });
      break;
    }

    case 'delete': {
      const deleted = await deleteTransaction(value);
      if (deleted) {
        await sendTelegramMessage(chatId, "Gasto eliminado correctamente.");
      } else {
        await sendTelegramMessage(chatId, "No se pudo eliminar el gasto.");
      }
      break;
    }
  }
}

async function resolveAccountId(userId: string, session: TelegramSession): Promise<string | null> {
  let accountId: string | null = null;
  
  if (session.method === 'efectivo') {
    accountId = await findAccountByName('efectivo', userId);
  } else if (session.bank) {
    accountId = await findAccountByName(session.bank, userId);
  }

  if (!accountId) {
    const accounts = await getAllAccounts(userId);
    if (accounts.length > 0) {
      accountId = accounts[0].id;
    }
  }

  return accountId;
}

async function saveTransaction(chatId: number, session: TelegramSession): Promise<void> {
  const userId = await getUserIdByTelegramId(chatId);
  if (!userId) {
    await sendTelegramMessage(chatId, "Error: Usuario no encontrado.");
    return;
  }

  const accountId = await resolveAccountId(userId, session);

  if (!accountId) {
    await sendTelegramMessage(chatId, "Error: No hay cuentas disponibles.");
    return;
  }

  // Create transaction using the server action
  const transactionData = {
    user_id: userId,
    account_id: accountId,
    amount: session.amount || 0,
    description: session.description || '',
    type: 'gasto' as const,
    method: (session.method || 'efectivo') as 'efectivo' | 'debito' | 'credito' | 'qr' | 'transferencia' | 'descubierto',
    date: new Date().toISOString().split('T')[0],
    category_id: session.category_id || null,
    is_installment: Boolean(session.method === 'credito' && session.installments),
    current_installment: session.method === 'credito' && session.installments ? 1 : null,
    total_installments: session.method === 'credito' && session.installments ? session.installments : null,
  };

  try {
    const result = await addTransaction(transactionData);
    
    if (result.error) {
      await sendTelegramMessage(chatId, `Error al guardar: ${result.error}`);
      return;
    }

    // Success message
    let message = `Gasto guardado!\n\n`;
    message += `$${session.amount?.toFixed(0)} - ${session.description}\n`;
    message += `Categoria: ${session.category_name || 'Sin categoria'}\n`;
    message += `Metodo: ${session.method}`;
    
    if (session.installments && session.installments > 1) {
      message += ` (${session.installments} cuotas)`;
    }

    await sendTelegramMessage(chatId, message);
    await updateSession(chatId, { step: 'COMPLETE' });
    
  } catch (error) {
    console.error("Error saving transaction:", error);
    await sendTelegramMessage(chatId, "Error al guardar el gasto. Intenta de nuevo.");
  }
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    if (!validateRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TelegramUpdate = await request.json();
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2));

    // Handle callback queries
    if (body.callback_query) {
      await handleCallback(body.callback_query);
      return NextResponse.json({ ok: true });
    }

    // Handle messages
    const message = body.message || body.edited_message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // Handle commands
    if (text.startsWith('/')) {
      const command = text.toLowerCase().split(' ')[0];
      
      switch (command) {
        case '/start':
          await handleStartCommand(chatId);
          break;
        case '/hoy':
          await handleHoyCommand(chatId);
          break;
        case '/saldos':
          await handleSaldosCommand(chatId);
          break;
        case '/cancelar':
          await handleCancelarCommand(chatId);
          break;
        default:
          await sendTelegramMessage(chatId, "Comando no reconocido. Usa /start para ver los comandos disponibles.");
      }
      
      return NextResponse.json({ ok: true });
    }

    // Handle expense input
    await handleNewExpense(chatId, text);
    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error processing Telegram webhook:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
