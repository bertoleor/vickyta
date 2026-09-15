# STATUS — PWA + bot Telegram

Tarjeta ORN-187 · Verificación ligera del cablado PWA y bot Telegram · 2026-09-15

## PWA — VERIFICADO (cablado)
- **Manifest:** `public/manifest.json` — `Vickyta Finanzas`, `start_url "/"`, `display standalone`, `scope "/"`, theme `#8B5CF6`, iconos 192/512 maskable.
  - Cableado en layout: `app/layout.tsx` → `metadata.manifest: "/manifest.json"` (línea 19).
- **Service worker:** `public/sw.js` (cache `finanzas-v1`, precache `/, /manifest.json, /offline.html`), fallback offline `public/offline.html`.
  - Registro: `app/components/ServiceWorkerRegistration.tsx` → `navigator.serviceWorker.register("/sw.js")`; montado en `app/layout.tsx` (línea 38).
- **Estado:** presente y mínimamente cableado (SW cache-first con fallback offline). Sin deploy validado en ese paso.

## Bot Telegram — VERIFICADO (cablado)
- **Webhook:** `app/api/telegram/route.ts` (POST, bypass auth en `middleware.ts`).
- **Vinculación:** `app/api/telegram/verify/route.ts` (genera código de vinculación).
- **BD:** `supabase/migrations/0002_telegram.sql` → tablas `telegram_users`, `telegram_messages`, `telegram_sessions`.
- **Docs:** `docs/bot-telegram.md`, plan `docs/plans/implementacion-telegram.md`.

## Hallazgos / discrepancias
- `docs/bot-telegram.md` (línea 40) afirma que las variables `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USERS` están en `.env.example`, pero el archivo actual `.env.example` SOLO lista las variables de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Faltan documentar en `.env.example`. (No se tocó el bot ni `.env.local`.)
- `docs/pwa.md` menciona `docs/plans/auditoria-completa-2025.md` (`display: standalone`). Pendiente endpoint `/api/telegram/setup` (no existe aún).

## Alcance de esta verificación
Solo lectura + STATUS.md. NO se ejecutó schema, deploy, ni se modificó el bot.