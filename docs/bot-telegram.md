# Bot de Telegram — funciones — VICKY

> Verificado en `app/api/telegram/route.ts` (webhook + máquina de estados), `app/api/telegram/verify/route.ts` (vinculación), `supabase/migrations/0002_telegram.sql`, tablas `telegram_users/messages/sessions`. Plan pendiente: [`plans/implementacion-telegram.md`](./plans/implementacion-telegram.md).

## Idea

Todo gasto se carga escribiendo **monto + frase** (queda en observaciones). El bot guía paso a paso, en voseo, un paso por vez. La app es el espejo; el bot es la carga diaria.

## Flujo "ahora" (máquina de estados en `telegram_sessions`)

`START → CATEGORY → METHOD → BANK → INSTALLMENTS → COMPLETE` (+ `VERIFY` para vinculación).

1. La usuaria manda ej. `4500 verdulería` → se guarda `amount` + `description`.
2. El bot pregunta categoría (5 macro con emoji: 🛒 Súper y Alimentos, 🚗 Trabajo y Transporte, 🏠 Casa y Servicios, ☕ Extras y Hormiga, 🏦 Deudas y Bancos).
3. Pregunta medio (💵 efectivo, 💳 débito, 🏦 crédito, 📲 QR, 💸 transferencia, 📉 descubierto).
4. Si el medio lo pide, selector de cuenta/banco propio (Galicia, Nación, Provincia, Santander, Mercado Pago, más cuentas de `accounts`).
5. Si es crédito, ofrece cuotas (1, 3, 6, 12).
6. Guarda la transacción en Supabase vía `service_role` y confirma. `/cancelar` aborta y limpia la sesión.

> Nota: la spec del dueño describe una variante "¿Ahora o después?" con pendientes + recordatorio tarde/noche y aviso a la mañana siguiente. El código actual implementa el flujo "ahora" directo; el "después"/recordatorios es trabajo pendiente (ver plan).

## Comandos

| Comando | Función |
| ------- | ------- |
| `/start` | Bienvenida; si no hay vínculo pide vincular desde la app (Configuración → Notificaciones) |
| `/hoy` | Gastos del día |
| `/saldos` | Balances por cuenta |
| `/cancelar` | Cancela el flujo en curso |

## Vinculación app ↔ Telegram

1. La usuaria pide un código en la app (`/api/telegram/verify` → `generateVerificationCode`, 4 dígitos con expiración en `telegram_sessions`).
2. Manda el código al bot → el bot valida (`verifyCode`) y guarda `telegram_users.telegram_id ↔ user_id`.
3. Desde entonces el bot opera sobre sus cuentas reales.

## Webhook y seguridad

- `POST /api/telegram` (bypass de `middleware.ts`). Valida `TELEGRAM_WEBHOOK_SECRET` por query `token` o header `x-telegram-webhook-secret`; opcional `TELEGRAM_ALLOWED_USERS`.
- Requiere `TELEGRAM_BOT_TOKEN` (+ `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`) en `.env.local` (ver `.env.example`).
- Cada update se loguea en `telegram_messages` (`pending`/`processed`/`error` + `raw_update`); el bot usa `service_role` porque las tablas Telegram no son por `auth.uid()`.
- Config del webhook: `setWebhook` a `https://<dominio>/api/telegram?token=<secreto>` (hay plan de endpoint `/api/telegram/setup`, aún no existe).

## Pendiente (no inventar como hecho)

Vinculación real end-to-end con código, recordatorios "después" (tarde/noche + mañana siguiente) y tests del plan de 6 pasos. Estado actual: flujo base + comandos + tablas existen; falta token/webhook en producción y verificación real.
