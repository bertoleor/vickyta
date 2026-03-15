import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

/**
 * Telegram Verification API
 * 
 * POST /api/telegram/verify
 * Body: { action: "request" | "verify", code?: string }
 * 
 * request: Genera y envía un código de verificación al chat de Telegram
 * verify: Verifica el código y vincula la cuenta
 */

// ============================================
// TELEGRAM API
// ============================================

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
    await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "HTML",
        }),
      }
    );
  } catch (err) {
    console.error("Error sending Telegram message:", err);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function createVerificationSession(chatId: number): Promise<string | null> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // First try to find existing session
  const { data: existing } = await supabase
    .from('telegram_sessions')
    .select('id')
    .eq('chat_id', chatId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('telegram_sessions')
      .update({
        verification_code: code,
        verification_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error updating verification code:', error);
      return null;
    }
  } else {
    const { error } = await supabase
      .from('telegram_sessions')
      .insert({
        chat_id: chatId,
        step: 'VERIFY',
        verification_code: code,
        verification_expires_at: expiresAt,
      });

    if (error) {
      console.error('Error creating verification code:', error);
      return null;
    }
  }

  return code;
}

async function verifyCode(code: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('telegram_sessions')
    .select('chat_id, verification_expires_at')
    .eq('verification_code', code)
    .single();

  if (error || !data) {
    return null;
  }

  if (new Date(data.verification_expires_at) < new Date()) {
    return null;
  }

  return data.chat_id as number;
}

// ============================================
// REQUEST HANDLER - Send verification code
// ============================================

async function handleRequestVerification(userId: string): Promise<{ success: boolean; error?: string; chatId?: number }> {
  // Get the user's Telegram chat_id from preferences
  const { data: preferences, error: prefError } = await supabase
    .from('user_preferences')
    .select('telegram_chat_id')
    .eq('user_id', userId)
    .single();

  if (prefError || !preferences?.telegram_chat_id) {
    return { success: false, error: 'No hay cuenta de Telegram vinculada' };
  }

  const chatId = preferences.telegram_chat_id;

  // Check if already linked
  const { data: existingLink } = await supabase
    .from('telegram_users')
    .select('id')
    .eq('telegram_id', chatId)
    .single();

  if (existingLink) {
    return { success: false, error: 'Esta cuenta de Telegram ya está vinculada' };
  }

  // Generate verification code
  const code = await createVerificationSession(chatId);

  if (!code) {
    return { success: false, error: 'Error al generar código' };
  }

  // Send code to Telegram
  await sendTelegramMessage(
    chatId,
    `<b>Codigo de verificacion:</b> ${code}\n\n` +
    `Ingresa este codigo en la app de finanzas para vincular tu cuenta.\n` +
    `El codigo expira en 10 minutos.`
  );

  return { success: true, chatId };
}

// ============================================
// VERIFY HANDLER - Verify code and link account
// ============================================

async function handleVerifyCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  if (!code || code.length !== 4) {
    return { success: false, error: 'Código inválido' };
  }

  // Verify the code
  const chatId = await verifyCode(code);

  if (!chatId) {
    return { success: false, error: 'Código incorrecto o expirado' };
  }

  // Link the Telegram account to the user
  const { error: linkError } = await supabase
    .from('telegram_users')
    .upsert({
      telegram_id: chatId,
      user_id: userId,
    }, { onConflict: 'telegram_id' });

  if (linkError) {
    console.error('Error linking Telegram account:', linkError);
    return { success: false, error: 'Error al vincular cuenta' };
  }

  // Update user preferences to enable notifications
  await supabase
    .from('user_preferences')
    .update({
      telegram_chat_id: chatId,
      telegram_notifications_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  // Clear the verification session
  await supabase
    .from('telegram_sessions')
    .delete()
    .eq('chat_id', chatId);

  // Send confirmation to Telegram
  await sendTelegramMessage(
    chatId,
    `<b>Cuenta vinculada correctamente!</b> 🎉\n\n` +
    `Ahora puedes:\n` +
    `- Registrar gastos directamente\n` +
    `- Ver saldos con /saldos\n` +
    `- Ver gastos del dia con /hoy`
  );

  return { success: true };
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { action, code } = body;

    if (!action) {
      return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
    }

    switch (action) {
      case 'request': {
        const result = await handleRequestVerification(user.id);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Código enviado a tu Telegram' 
        });
      }

      case 'verify': {
        const result = await handleVerifyCode(user.id, code);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Cuenta vinculada correctamente' 
        });
      }

      default:
        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
