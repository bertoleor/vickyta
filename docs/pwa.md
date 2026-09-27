# PWA — funciones — VICKY

> Verificado en `public/manifest.json`, `public/sw.js`, `public/offline.html`, `app/layout.tsx`, `app/components/ServiceWorkerRegistration.tsx`.
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[producto]], [[bot-telegram]], [[projects/Vicky/docs/branding]]

## Qué es la PWA

La app (`"Vickyta Finanzas"`) es instalable (`display standalone`) y funciona como **espejo completo pero sencillo** de lo que entra por Telegram. Idioma `es-AR`.

## Capacidades

- **Instalable:** manifest con nombre, descripción, `start_url /`, `scope /`, `theme_color #8B5CF6`, `background_color #faf9fc`, iconos 192/512 maskable.
- **Atajos:** "Agregar Gasto" → `/gastos`, "Ver Historial" → `/historial`.
- **Offline básico:** service worker `finanzas-v1` con precache (`/`, `/manifest.json`, `/offline.html`); estrategia stale-while-revalidate para GET; `/api/*` solo network con respuesta `{ error: 'Offline' }` si falla; fallback a `offline.html` para HTML sin red.
- **Registro y updates:** `ServiceWorkerRegistration.tsx` registra `/sw.js`; el SW soporta mensaje `SKIP_WAITING` para activar versiones nuevas.
- **Viewport mobile-first:** `width=device-width, initialScale=1, maximumScale=1`, `orientation portrait-primary`.

## Pantallas (rutas verificadas en `app/`)

| Ruta | Función |
| ---- | ------- |
| `/` | Dashboard: saludo ("¡Hola, {nombre}!"), saldos, últimos 5 movimientos, pendientes clasificables, resumen semanal + torta por categoría, comparación entre meses |
| `/gastos` | Carga manual y categorización de gastos |
| `/ingresos` | Carga de ingresos por cuenta |
| `/historial` | Lista con filtros (tipo/categoría/cuenta/fecha), búsqueda por descripción, exportación (`lib/actions/export.ts`) |
| `/banco` | Cuentas por medio, vencimientos e intereses de tarjetas |
| `/presupuestos` | Presupuestos por categoría (`weekly`/`monthly`/`yearly`) con alertas |
| `/configuracion/perfil` | Nombre, avatar |
| `/configuracion/apariencia` | Tema light/dark/system + color de acento (5 opciones) |
| `/configuracion/notificaciones` | Vinculación Telegram + recordatorios |
| `/configuracion/seguridad` | PIN |
| `/login` | Ingreso (pública; con sesión redirige a `/`) |

## Datos en vivo

El dashboard hace fetch paralelo real a Supabase (`getAccountSummary`, `getRecentTransactions`, `getTransactionSummary`); si faltan categorías las siembra (`ensureDefaultCategories`). Moneda `es-AR / ARS`.
