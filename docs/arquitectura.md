# Arquitectura — VICKY

> Cómo se arma el proyecto. Complementa [`producto.md`](./producto.md) (qué es) y la [spec](./spec.md) (fuente autorizada).
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[producto]], [[projects/Vicky/docs/spec]], [[pwa]]

## Stack (verificado en `package.json`)

| Capa | Tecnología |
| ---- | ---------- |
| Core | Next.js 14 (App Router) + React 18 + TypeScript 5 |
| Estilos | Tailwind CSS 4 (`tailwind.config.ts` + `app/globals.css` + `app/dynamic-utilities.css`) |
| Backend/DB | Supabase (`@supabase/ssr` + `@supabase/supabase-js`), proyecto `vicky`, RLS activo |
| Bot | Telegram Bot API vía webhook en `app/api/telegram/route.ts` |
| PWA | `public/manifest.json` + `public/sw.js` + `app/components/ServiceWorkerRegistration.tsx` + `public/offline.html` |
| UI extra | `framer-motion`, `lucide-react`, `recharts`, `sonner`, `clsx` + `tailwind-merge` |
| Auth web | PIN/username propio + sesión Supabase; `middleware.ts` protege rutas por cookie `sb-*-auth-token` |

## Estructura (verificada en disco)

```
app/                  # App Router: page.tsx (dashboard), gastos/, ingresos/,
                      # historial/, banco/, presupuestos/, login/,
                      # configuracion/{perfil,apariencia,notificaciones,seguridad}/,
                      # api/telegram/ (webhook), api/telegram/verify/ (vinculación)
components/           # layout/Sidebar, ThemeProvider, DashboardWithTour,
                      # ui/* (Button, Card, GlassCard, formularios, charts, modales, tour)
lib/actions/          # Server Actions: accounts, transactions, categories,
                      # budgets, preferences, export
lib/auth/ lib/supabase/  # auth + clientes Supabase (client/server)
lib/constants.ts      # iconos, tipos de cuenta, medios de pago, semáforo, moneda es-AR/ARS
supabase/migrations/  # 0001_vicky_initial.sql + 0002_telegram.sql (fuente del schema)
types/database.ts     # tipos generados del schema
public/               # manifest.json, sw.js, offline.html, icon-192/512.png, fonts/garet/
docs/                 # esta carpeta
```

## Cómo se arma (flujo de datos)

1. **Web (PWA):** Server Components hacen fetch paralelo (`getAccountSummary`, `getRecentTransactions`, `getTransactionSummary`) y las Server Actions escriben en Supabase con RLS por `auth.uid()`.
2. **Bot (Telegram):** Telegram → `POST /api/telegram` (valida `TELEGRAM_WEBHOOK_SECRET` por query `token` o header `x-telegram-webhook-secret`) → log en `telegram_messages` → máquina de estados en `telegram_sessions` (`START → CATEGORY → METHOD → BANK → INSTALLMENTS → COMPLETE`, más `VERIFY` para vinculación) → `service_role` escribe la transacción (bypasea RLS).
3. **Vinculación:** la app genera un código (`/api/telegram/verify`) que la usuaria manda al bot; el bot guarda `telegram_users.telegram_id ↔ user_id`.
4. **Auth web:** `middleware.ts` redirige a `/login` si no hay cookie Supabase; las rutas `/api/telegram*` hacen bypass total.
5. **Preferencias:** tema (`light/dark/system`) y `accent_color` se guardan en `user_preferences` y se aplican por CSS variables (`--accent-color`, `--background`, `--text-*`) + `localStorage` para pintado inmediato (`ThemeProvider`).

## Rutas (verificadas en `app/`)

| Ruta | Función |
| ---- | ------- |
| `/` | Dashboard: saludo, saldos, últimos + pendientes, charts semanal/por categoría |
| `/gastos` | Carga y categorización de gastos |
| `/ingresos` | Carga de ingresos por cuenta |
| `/historial` | Historial con filtros + exportación (`lib/actions/export.ts`) |
| `/banco` | Cuentas, vencimientos e intereses de tarjetas |
| `/presupuestos` | Presupuestos por categoría y período |
| `/configuracion/*` | Perfil, apariencia (tema + acento), notificaciones (Telegram), seguridad (PIN) |
| `/login` | Ingreso (pública) |
| `/api/telegram` | Webhook del bot (bypass auth) |
| `/api/telegram/verify` | Verificación de vinculación Telegram ↔ app |

## Modelo de datos (fuente: `supabase/migrations/`)

`accounts` (5 tipos: `banco`, `billetera_virtual`, `efectivo`, `tarjeta_credito`, `deuda_fiado`) · `transactions` (`gasto`/`ingreso`/`transferencia_interna`, 8 `payment_method` incluyendo `fiado_adrian`, tag `traffic_light`, cuotas, recurrencia) · `categories` (árbol padre/hijas, 27 sembradas, `icon_slug` → Lucide) · `budgets` (`weekly`/`monthly`/`yearly`) · `user_preferences` (tema + acento + notifs) · `telegram_users` (vínculo) · `telegram_messages` (log, `pending`/`processed`/`error`) · `telegram_sessions` (estado del flujo + verificación).

## Convenciones

- Español con **voseo**, frases cortas; artefactos técnicos en inglés donde el código lo exige.
- La `spec.md` manda ante cualquier contradicción.
- Solo documentación en esta tarea: no tocar código.
