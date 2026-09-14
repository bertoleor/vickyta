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
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createVerificationSession(chatId: number): Promise<string | null> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('telegram_sessions')
    .upsert({
      chat_id: chatId,
      step: 'VERIFY',
      verification_code: code,
      verification_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'chat_id' });

  if (error) {
    console.error('Error creating verification session:', error);
    return null;
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

async function handleRequestVerification(userId: string, username?: string): Promise<{ success: boolean; error?: string }> {
  let chatId: number | null = null;

  if (username) {
    // Flow A: user entered their Telegram username in the app.
    // Find an unlinked telegram_users row captured by the bot webhook.
    const normalized = username.replace(/^@/, '').trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Ingresa tu usuario de Telegram' };
    }

    const { data: tgUser, error: tgError } = await supabase
      .from('telegram_users')
      .select('telegram_id, user_id')
      .ilike('username', normalized)
      .maybeSingle();

    if (tgError || !tgUser) {
      return {
        success: false,
        error: 'No encontramos ese usuario. Escribile /start al bot (@crismorobot) en Telegram y volvé a intentar.',
      };
    }

    if (tgUser.user_id && tgUser.user_id !== userId) {
      return { success: false, error: 'Esa cuenta de Telegram ya está vinculada a otro usuario' };
    }

    chatId = tgUser.telegram_id;
  } else {
    // Flow B: resend — use the chat_id already stored in preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('telegram_chat_id')
      .eq('user_id', userId)
      .single();

    if (!preferences?.telegram_chat_id) {
      return { success: false, error: 'No hay una vinculación en progreso' };
    }

    chatId = preferences.telegram_chat_id;
  }

  // Check if already linked to THIS user
  const { data: existingLink } = await supabase
    .from('telegram_users')
    .select('user_id')
    .eq('telegram_id', chatId)
    .maybeSingle();

  if (existingLink?.user_id === userId) {
    return { success: false, error: 'Esta cuenta de Telegram ya está vinculada' };
  }

  if (chatId === null) {
    return { success: false, error: 'No se pudo determinar el chat de Telegram' };
  }

  const targetChatId = chatId;

  // Generate verification code (stored in telegram_sessions, expires in 10 min)
  const code = await createVerificationSession(targetChatId);

  if (!code) {
    return { success: false, error: 'Error al generar código' };
  }

  // Store pending chat_id in preferences so 'resend' works during the flow
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      telegram_chat_id: targetChatId,
      telegram_notifications_enabled: false,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  // Send code to Telegram
  await sendTelegramMessage(
    targetChatId,
    `<b>Codigo de verificacion:</b> ${code}\n\n` +
    `Ingresa este codigo en la app de finanzas para vincular tu cuenta.\n` +
    `El codigo expira en 10 minutos.`
  );

  return { success: true };
}

// ============================================
// VERIFY HANDLER - Verify code and link account
// ============================================

async function handleVerifyCode(userId: string, code: string): Promise<{ success: boolean; error?: string; chatId?: number }> {
  if (!code || code.length !== 6) {
    return { success: false, error: 'El código debe tener 6 dígitos' };
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

  // Ensure user_preferences row exists, then enable notifications
  await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      telegram_chat_id: chatId,
      telegram_notifications_enabled: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

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

  return { success: true, chatId };
}

// ============================================
// UNLINK HANDLER - Remove Telegram link
// ============================================

async function handleUnlink(userId: string): Promise<{ success: boolean; error?: string }> {
  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('telegram_chat_id')
    .eq('user_id', userId)
    .single();

  if (!preferences?.telegram_chat_id) {
    return { success: false, error: 'No hay cuenta de Telegram vinculada' };
  }

  const chatId = preferences.telegram_chat_id;

  const { error: unlinkError } = await supabase
    .from('telegram_users')
    .update({ user_id: null })
    .eq('telegram_id', chatId)
    .eq('user_id', userId);

  if (unlinkError) {
    console.error('Error unlinking Telegram account:', unlinkError);
    return { success: false, error: 'Error al desvincular cuenta' };
  }

  await supabase
    .from('user_preferences')
    .update({
      telegram_chat_id: null,
      telegram_notifications_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  await supabase
    .from('telegram_sessions')
    .delete()
    .eq('chat_id', chatId);

  await sendTelegramMessage(
    chatId,
    'Tu cuenta de Telegram fue desvinculada de la app de finanzas.'
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
    const { action, code, username } = body;

    if (!action) {
      return NextResponse.json({ error: 'Acción requerida' }, { status: 400 });
    }

    switch (action) {
      case 'request': {
        const result = await handleRequestVerification(user.id, username);
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
          message: 'Cuenta vinculada correctamente',
          chatId: result.chatId
        });
      }

      case 'unlink': {
        const result = await handleUnlink(user.id);
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          message: 'Cuenta desvinculada'
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
