import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

/**
 * Telegram Webhook Endpoint
 * 
 * This endpoint receives updates from Telegram Bot API when users send messages to the bot.
 * Security is enforced via a secret token validation.
 * 
 * Endpoint: POST /api/telegram?token=SECRET
 * 
 * Flow:
 * 1. Validate security token
 * 2. Parse incoming message
 * 3. Store in telegram_messages table for processing
 * 4. (Future) Parse expense data and create transaction
 */

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
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
}

interface PendingMessage {
  telegram_id: number;
  chat_id: number;
  user_id: number | null;
  username: string | null;
  first_name: string | null;
  message_text: string | null;
  message_date: number;
  raw_update: object;
  status: "pending" | "processed" | "error";
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validates the webhook request using a secret token
 * Token can be provided via query parameter or custom header
 */
function validateRequest(request: NextRequest): boolean {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("TELEGRAM_WEBHOOK_SECRET is not configured");
    return false;
  }

  // Check query parameter
  const url = new URL(request.url);
  const tokenFromQuery = url.searchParams.get("token");

  // Check custom header
  const tokenFromHeader = request.headers.get("x-telegram-webhook-secret");

  return tokenFromQuery === webhookSecret || tokenFromHeader === webhookSecret;
}

// ============================================
// MESSAGE STORAGE
// ============================================

/**
 * Store incoming message in telegram_messages table for processing
 * @param message - The Telegram message to store
 * @param update - The full update object
 * @returns Success status
 */
async function storePendingMessage(
  message: TelegramMessage,
  update: TelegramUpdate
): Promise<{ success: boolean; error?: string }> {
  try {
    const pendingMessage: PendingMessage = {
      telegram_id: message.message_id,
      chat_id: message.chat.id,
      user_id: message.from?.id ?? null,
      username: message.from?.username ?? null,
      first_name: message.from?.first_name ?? null,
      message_text: message.text ?? null,
      message_date: message.date,
      raw_update: update,
      status: "pending",
    };

    const { error } = await supabase
      .from("telegram_messages")
      .insert({
        telegram_id: pendingMessage.telegram_id,
        chat_id: pendingMessage.chat_id,
        user_id: pendingMessage.user_id,
        username: pendingMessage.username,
        first_name: pendingMessage.first_name,
        message_text: pendingMessage.message_text,
        message_date: pendingMessage.message_date,
        raw_update: pendingMessage.raw_update,
        status: pendingMessage.status,
      });

    if (error) {
      // If table doesn't exist, log but don't fail
      if (error.code === "42P01") {
        console.warn("telegram_messages table does not exist. Message will be logged only.");
        return { success: true };
      }
      console.error("Error storing Telegram message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error storing message:", err);
    return { success: false, error: "Unexpected error" };
  }
}

// ============================================
// MESSAGE PARSING (FUTURE IMPLEMENTATION)
// ============================================

/**
 * Parse expense data from message text
 * 
 * Expected formats:
 * - "500 supermercado" -> amount: 500, description: "supermercado"
 * - "1500 almuerzo con amigos" -> amount: 1500, description: "almuerzo con amigos"
 * - "transferencia 10000 banco efectivo" -> internal transfer
 * 
 * @param text - Message text to parse
 * @returns Parsed expense data or null if invalid
 */
function parseExpenseMessage(text: string): {
  amount: number;
  description: string;
  type: "gasto" | "ingreso" | "transferencia_interna";
  destinationHint?: string;
} | null {
  // Skip empty or very short messages
  if (!text || text.length < 3) {
    return null;
  }

  // Common patterns:
  // Pattern 1: "500 descripcion" - number followed by text
  const expensePattern = /^(\d+(?:[.,]\d+)?)\s+(.+)$/i;
  const match = text.match(expensePattern);

  if (match) {
    const amount = parseFloat(match[1].replace(",", "."));
    const description = match[2].trim();

    // Check for transfer keywords
    const transferKeywords = ["transferencia", "transfer", "movi", "moví"];
    const isTransfer = transferKeywords.some(kw => 
      description.toLowerCase().includes(kw)
    );

    if (isTransfer) {
      // Try to extract destination account from description
      // Format: "transferencia 10000 banco efectivo" or "transfer 5000 a efectivo"
      const words = description.split(" ");
      const destinationHint = words.slice(-1)[0]; // Last word as destination hint
      
      return {
        amount,
        description,
        type: "transferencia_interna",
        destinationHint,
      };
    }

    // Check for income keywords
    const incomeKeywords = ["ingreso", "cobro", "sueldo", "pago recibido"];
    const isIncome = incomeKeywords.some(kw => 
      description.toLowerCase().includes(kw)
    );

    return {
      amount,
      description,
      type: isIncome ? "ingreso" : "gasto",
    };
  }

  return null;
}

// ============================================
// TELEGRAM API HELPERS
// ============================================

/**
 * Send a message to a Telegram chat
 * @param chatId - The chat ID to send to
 * @param text - The message text
 */
async function sendTelegramMessage(
  chatId: number,
  text: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send Telegram message:", await response.text());
    }
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Validate security token
    if (!validateRequest(request)) {
      console.warn("Unauthorized webhook request - invalid token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body: TelegramUpdate = await request.json();

    // Log the received message for debugging
    console.log("Telegram webhook received:", {
      update_id: body.update_id,
      message_id: body.message?.message_id,
      from: body.message?.from?.username || body.message?.from?.first_name,
      chat_id: body.message?.chat.id,
      text: body.message?.text,
      date: body.message?.date,
    });

    // Process the message
    const message = body.message || body.edited_message;
    
    if (message) {
      // Store message in database for later processing
      const storeResult = await storePendingMessage(message, body);
      
      if (!storeResult.success) {
        console.error("Failed to store message:", storeResult.error);
      }

      // Process text messages
      if (message.text) {
        console.log("Message text to process:", message.text);
        
        // Try to parse expense data
        const parsedData = parseExpenseMessage(message.text);
        
        if (parsedData) {
          console.log("Parsed expense data:", parsedData);
          
          // TODO: In future, implement full flow:
          // 1. Get user by telegram_id from profiles table
          // 2. Get default account for user
          // 3. Create transaction using addTransaction action
          // 4. Send confirmation message
          
          // For now, just acknowledge receipt
          const typeLabels = {
            gasto: "Gasto",
            ingreso: "Ingreso",
            transferencia_interna: "Transferencia",
          };
          
          await sendTelegramMessage(
            message.chat.id,
            `✅ Mensaje recibido\n\n` +
            `Tipo: ${typeLabels[parsedData.type]}\n` +
            `Monto: $${parsedData.amount.toFixed(2)}\n` +
            `Descripción: ${parsedData.description}\n\n` +
            `_Pendiente de procesamiento_`
          );
        } else {
          // Message couldn't be parsed as expense
          await sendTelegramMessage(
            message.chat.id,
            `📝 Mensaje recibido pero no pude interpretarlo como gasto.\n\n` +
            `Formato esperado: <code>MONTO DESCRIPCIÓN</code>\n` +
            `Ejemplo: <code>500 supermercado</code>`
          );
        }
      }
    }

    // Return success response to Telegram
    return NextResponse.json({ ok: true }, { status: 200 });

  } catch (error) {
    // Handle unexpected errors
    console.error("Error processing Telegram webhook:", error);

    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Handle unsupported HTTP methods
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
