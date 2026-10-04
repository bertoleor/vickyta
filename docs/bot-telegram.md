# Bot de Telegram — funciones — VICKY

> **Búsqueda:** keywords: `telegram, bot, webhook, vinculacion, sesiones, flujo-ahora, pendientes, recordatorios, ahora-despues` · clasificación: `referencia-tecnica` · estado: `canónico` · actualizado: 2026-10-04
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[pwa]], [[producto]], [[implementacion-telegram]], [[recordatorio-noche-pendientes]], [[STATUS]]

## Estado en una línea

**Cableado hoy: webhook con flujo "ahora" (categoría → medio → banco → cuotas), 6 comandos, vinculación por código, sesiones en DB. No existe todavía: el flujo "Ahora o Después" con recordatorios — la capa pura está commiteada y testeada pero nadie la cablea — y el endpoint `POST /api/telegram/reminders`.**

Este doc describe el código como ES (verificado 2026-10-04, rama `feat/vicky-f4-historial-resumen`); cada afirmación lleva archivo:línea o commit de respaldo. Lo pendiente está marcado como pendiente y apunta al plan. Corregido tras hallazgo H7 de la auditoría 2026-10-03 (t_6a5cbc60): la versión anterior documentaba el endpoint de recordatorios y el flujo "Ahora o Después" como verificados cuando no existían.

## Idea

Todo gasto se carga escribiendo **monto + frase** (queda en descripción). El bot guía paso a paso, en voseo, un paso por vez. La app es el espejo; el bot es la carga diaria.

## Flujo "ahora" — máquina de estados (cableado)

Estados: `START → CATEGORY → METHOD → BANK → INSTALLMENTS → COMPLETE` (+ `VERIFY` para vinculación) — enum en `app/api/telegram/route.ts:62`, persistidos en `telegram_sessions`.

1. La usuaria manda ej. `4500 verdulería` → `parseExpenseMessage` (`route.ts:412-427`, acepta `1.500` y `1,500`) guarda monto y descripción en la sesión y salta directo a `CATEGORY` (`route.ts:645-673`).
2. Categoría: 5 macro hardcodeadas con emoji (`route.ts:82-88`): 🛒 Súper y Alimentos, 🚗 Trabajo y Transporte, 🏠 Casa y Servicios, ☕ Extras y Hormiga, 🏦 Deudas y Bancos. ⚠️ Los IDs son strings (`cat-super`), no UUIDs — hoy rompe FK al guardar (defecto P1, ver §Defectos conocidos).
3. Medio — 6 opciones (`route.ts:90-97`): 💵 efectivo, 💳 débito, 🏦 crédito, 📲 QR, 💸 transferencia, 📉 descubierto.
4. Banco (si el medio lo pide): 5 hardcodeados (`route.ts:99-105`: Galicia, Nación, Provincia, Santander, Mercado Pago); si ninguno matchea, cae a la primera cuenta del usuario (`resolveAccountId`, `route.ts:769-774`).
5. Cuotas si es crédito: 1, 3, 6, 12 (`route.ts:107`).
6. Guarda vía `addTransaction` (`route.ts:809`, server action de `lib/actions/transactions`) y confirma. `/cancelar` limpia la sesión (`route.ts:588-591`).

## Comandos (los 6 que existen — switch en `route.ts:875-896`)

| Comando | Función |
| ------- | ------- |
| `/start` | Bienvenida; registra/actualiza al usuario en `telegram_users` (`route.ts:486-519`) |
| `/hoy` | Gastos del día + botón eliminar del último (`route.ts:521-555`) |
| `/saldos` | Balances por cuenta (`route.ts:557-586`) |
| `/vincular` | Genera código de 6 dígitos y lo manda al chat (`route.ts:596-625`) |
| `/ayuda` | Lista de comandos (`route.ts:630-643`) |
| `/cancelar` | Cancela el flujo en curso y limpia sesión (`route.ts:588-591`) |

## Vinculación app ↔ Telegram (cableada)

Endpoint real: `POST /api/telegram/verify` (autenticado — `verify/route.ts:304-312`), con 3 acciones (`verify/route.ts:321-358`):

1. **`request`**: la usuaria pone su usuario de Telegram en la app (`app/configuracion/notificaciones/NotificationSettings.tsx`). El backend busca la fila `telegram_users` capturada por el bot cuando la usuaria mandó `/start`, genera un código de **6 dígitos** con expiración de 10 minutos (`verify/route.ts:55-61`) en `telegram_sessions.step='VERIFY'` y lo manda al chat de Telegram.
2. **`verify`**: valida el código, linkea `telegram_users.telegram_id ↔ user_id`, habilita notificaciones y borra la sesión (`verify/route.ts:196-248`).
3. **`unlink`**: desvincula (`verify/route.ts:254-298`).

El bot también ofrece `/vincular` (genera el código desde el chat), pero el flujo canónico arranca desde la app. El upsert de sesiones depende del `UNIQUE(chat_id)` reparado por la migración `0005_telegram_sessions_unique.sql` (commit f8ecb2c, 2026-10-03).

## Webhook y seguridad

- `POST /api/telegram` con bypass de middleware por prefijo `'/api/telegram'` (`middleware.ts:19`, `BYPASS_ROUTES` via `startsWith`).
- Valida `TELEGRAM_WEBHOOK_SECRET` por query `token` o header `x-telegram-webhook-secret` (`route.ts:113-122`) — pero es **fail-open**: sin la variable seteada acepta cualquier request (defecto P2).
- `TELEGRAM_ALLOWED_USERS` filtra solo mensajes, no `callback_query` (`route.ts:862-867` vs `:849-851`) (defecto P2).
- Opera con `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS) porque las tablas Telegram no son por `auth.uid()` (`route.ts:9-13`).
- Updates entrantes: solo `console.log` (`route.ts:846`). **No se persisten en `telegram_messages`** — la tabla existe (`0002_telegram.sql:52`) pero el webhook no la escribe ni la lee.
- Config del webhook: `setWebhook` manual a `https://<dominio>/api/telegram?token=<secreto>`. No existe endpoint `/api/telegram/setup`.
- Env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USERS` + las de Supabase — las 6 documentadas en `.env.example` (checker `npm run check:env-docs` + test `__tests__/env-wiring`, commit eade033).

## Flujo "Ahora o Después" (ORN-108) — PLANIFICADO, no cableado

La spec del dueño (`docs/spec.md:13`) define: después de monto + descripción, preguntar **"✅ Ahora / ⏳ Después"**; "Después" guarda en `pending_expenses` y un recordatorio llega en dos ventanas — **20:30 del mismo día** y **09:30 del día siguiente** (horario Argentina) — con botones Registrar/Descartar.

**Lo que existe (commiteado):**

- Tabla `pending_expenses` — migración `supabase/migrations/0004_pending_expenses.sql` (+down), RLS + policy service_role, índice parcial por chat (commit bf0c24f).
- Types `PendingExpense` — `lib/database.types.ts:110` (commit 1695ef1).
- Capa pura `lib/telegram/flow.ts` (393 líneas, commit ceebe7f): `parseExpenseMessage` (:21), `getTimingKeyboard` (:43), `buildPendingExpenseRow` (:83), `selectDueReminders` (:143, ventana silencio 09:30–21:00 local; noche stale la supersede la mañana), `getReminderKeyboard` (:213), `buildReminderMessage` (:230), `resolvePendCallback` (:280), `resolveReminderWindow` (:369) — con 3 archivos de tests (`__tests__/telegram/{flow,pend-callbacks,reminders-due}.test.ts`, commit ceebe7f declara 18 tests verdes).

**Lo que NO existe (verificado 2026-10-04):**

- El webhook **nunca importa** `flow.ts` — 0 referencias en `app/` (grep `telegram/flow` sobre `app/`).
- No hay pregunta "¿Ahora o Después?" en el flujo real: un gasto parseado va directo a `CATEGORY` (`route.ts:662-672`).
- El endpoint `POST /api/telegram/reminders` **no existe** — `app/api/telegram/` solo contiene `route.ts` y `verify/`.
- Los callbacks `pend:registrar:<id>` / `pend:descartar:<id>` no tienen handler en el webhook.
- No hay cron/scheduler registrado que dispare recordatorios.

Plan y diseño: [`plans/implementacion-telegram.md`](./plans/implementacion-telegram.md) (pasos base) y [`recordatorio-noche-pendientes.md`](./recordatorio-noche-pendientes.md) (ventanas y copy). Seguimiento de tareas: [`odd/tasks/vicky-f2-bot-ahora-despues.md`](../odd/tasks/vicky-f2-bot-ahora-despues.md).

## Defectos conocidos del código (no de este doc)

De la auditoría 2026-10-03 (kickoff t_5bfcd0ed; detalle y tickets en [[STATUS]]):

| Sev | Defecto | Dónde |
| --- | --- | --- |
| P0 | Data path roto: server actions usan client anon sin sesión → RLS bloquea TODO guardado (web y bot) | `lib/supabase/client` ← `lib/actions/*`; bot vía `addTransaction` (`route.ts:809`) |
| P1 | `category_id` strings no-UUID (`cat-super`) → FK violation al guardar; bancos hardcodeados con fallback a la primera cuenta | `route.ts:82-88` + `:802`; `:769-774` |
| P2 | Webhook fail-open sin secret; allowlist no cubre callbacks; `delete:<id>` sin ownership check; HTML injection en descripción | `route.ts:113-122`, `:849-867`, `:748-756` |

Cuando uno de estos se arregle, actualizar esta tabla (y la de [[STATUS]]).
