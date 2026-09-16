# 07 — Repos relacionados — VICKY

> Referencias externas para inspirarte y no reinventar. Nada de acá está vendorizado en VICKY: son ideas probadas para copiar patrones (flujos, UX, esquemas) cuando implementes las fases pendientes. Fuentes verificadas por búsqueda web (2026-09-15).

## A. Finanzas personales / PWA (espejo web)

| Repo | Stack | Licencia | Qué mirar para VICKY |
| ---- | ----- | -------- | -------------------- |
| [actualbudget/actual](https://github.com/actualbudget/actual) — app local-first de envelope budgeting | TypeScript (React + Node sync server, SQLite por presupuesto) | MIT | **Referencia #1 para la PWA.** Local-first + sync cifrado, funciona offline y sincroniza al reconectar. Importación CSV/OFX/QFX/QIF, reglas automáticas, transacciones programadas. Copiá el patrón "IndexedDB local + sync en background" si el offline de VICKY crece más allá del SW básico. |
| [firefly-iii/firefly-iii](https://github.com/firefly-iii/firefly-iii/) — gestor de finanzas personales | PHP (Laravel) + MariaDB/MySQL/Postgres | AGPL-3.0 | **Referencia de modelo de datos.** Contabilidad por partida doble (toda transacción tiene origen y destino), piggy banks (metas), bills recurrentes, reglas de auto-categorización, API REST completa, reportes por cuenta/categoría/tag. Mirá su motor de reglas y sus reportes antes de diseñar los de VICKY. |
| [maybe-finance/maybe](https://github.com/maybe-finance/maybe) (archivado 2025) — dashboard de net-worth | Ruby on Rails + Postgres + Sidekiq + Redis | AGPL-3.0 | **Referencia de UI.** El dashboard más pulido de los tres (cuentas, inversiones, inmuebles, deudas en una vista). Proyecto archivado: no lo uses como dependencia, solo como inspiración visual. |
| [techtwig/budget-pro](https://github.com/techtwig/budget-pro) — budgeting en Next.js como PWA | Next.js (PWA) | Open source (ver repo) | **Referencia directa de stack.** Next.js + PWA para presupuestos y gastos. Compará su manifest/SW con `public/manifest.json` y `public/sw.js` de VICKY. |

Comparativas consultadas: [Firefly III vs Actual vs Maybe — Big Iron](https://www.bigiron.cc/guides/firefly-iii-vs-actual-budget-vs-maybe-finance), [Actual vs Firefly — selfhosting.sh](https://selfhosting.sh/compare/actual-budget-vs-firefly/), [Actual vs Maybe — selfhosting.sh](https://selfhosting.sh/compare/actual-budget-vs-maybe/).

**Lectura para VICKY:** si tu problema es "controlar gasto mensual", el método envelope de Actual es el más cercano a presupuestos por categoría; si es "saber dónde está cada peso", el modelo doble-asiento de Firefly III es el correcto. VICKY hoy está más cerca de Actual (presupuestos + categorías simples).

## B. Bots de Telegram para gastos (carga conversacional)

| Repo | Stack | Qué mirar para VICKY |
| ---- | ----- | -------------------- |
| [muety/telegram-expense-bot](https://github.com/muety/telegram-expense-bot) ([@ExpenseBot](https://github.com/muety/telegram-expense-bot)) | Go + MongoDB, modo webhook | El más maduro: alta propia, parseo de gasto en lenguaje libre, categorías. Mirá su manejo de webhook (`BIND_IPV4`/`PORT`/URL pública) antes de llevar `/api/telegram` a producción. |
| [masudur-rahman/khorcha-pati](https://github.com/masudur-rahman/khorcha-pati) ([@KhorchaPatiBot](https://github.com/masudur-rahman/khorcha-pati)) | Bot Telegram + dashboard web React mobile-friendly | **El más parecido a VICKY (bot + espejo web).** Entrada en lenguaje natural ("lunch 250", "transfer 10k from brac to city"), wallets/contactos, presupuestos, estados de cuenta. Copiá su gramática de montos ("1.5k", "ayer", "el 1ro") para el parseo del bot. |
| [cenoff/Money-Bot](https://github.com/cenoff/Money-Bot) | Python (aiogram) + SQLite, 93% tests | Bot simple con categorías, gráficos y renovaciones con APScheduler. Buen ejemplo de scheduler de recordatorios — útil para el flujo "después" (aviso tarde/noche + mañana siguiente) que VICKY aún no implementa. |
| [DeKodez/budgetbot](https://github.com/DeKodez/budgetbot) | Cloudflare Workers + D1, serverless | Presupuestos diarios/semanales vs finde, categorías por botón, whitelist de usuarios, `secret_token` en `setWebhook`, APIs JSON de resumen. Mirá su validación de webhook y su modelo de budgets antes de exponer el tuyo. |
| [edoardob90/finance-tracker-bot](https://github.com/edoardob90/finance-tracker-bot) | Python (python-telegram-bot), polling o webhook, Google Sheets vía OAuth2 | Registro gasto/ingreso + consultas ("resumen mensual", alertas por categoría). Patrón útil si algún día querés exportar el historial a Sheets. |
| [sukhendu-chakraborty/telegram-expense-bot](https://github.com/sukhendu-chakraborty/telegram-expense-bot) | Python + MongoDB Atlas, Flask para webhook | Resúmenes diario/semanal/mensual/anual. Ejemplo mínimo de deploy con webhook si necesitás una alternativa simple al route de Next.js. |
| [nghianguyen98/gemini-finance-bot](https://github.com/nghianguyen98/gemini-finance-bot) | Google Apps Script + Gemini API + Google Sheets, 100% serverless | Entrada 100% natural con NLU ("bought coffee 35k at Highland") + reportes y recordatorios diarios con triggers. Idea a futuro: clasificador IA de categorías sobre el texto libre. |
| [dhaval9911/automated-n8n-expense-tracker](https://github.com/dhaval9911/automated-n8n-expense-tracker) | n8n + Telegram + Gemini AI + Google Sheets | Frase libre sin comandos ("450 Zomato dinner via UPI") + captura automática de SMS bancarios + dashboard. Mirá su idea de "cero formato que memorizar": es exactamente el principio de VICKY para una usuaria mayor. |
| [Canopix/hermes-expense-tracker](https://github.com/Canopix/hermes-expense-tracker) | Python (FastMCP) + SQLite compartido, multi-perfil | Gastos compartidos del hogar por chat (cada miembro con su asistente, misma DB). Interesante si VICKY crece a uso familiar: `paid_by` + repartos porcentuales + reportes con gráficos. |
| [Upsonic expense_tracker_bot](https://github.com/Upsonic/Examples/blob/master/examples/autonomous_agents/expense_tracker_bot) | Upsonic AutonomousAgent + FastAPI + EasyOCR | OCR de tickets: foto del recibo → comercio, monto, fecha, categoría → CSV + resumen mensual. Futura función premium para VICKY ("sacale foto al ticket"). |

## Qué copiar ya (recomendado)

1. **Gramática de montos** (khorcha-pati): `1.5k`, `ayer`, fechas relativas — directo al parseo del webhook.
2. **Recordatorios no invasivos** (Money-Bot / gemini-finance-bot): un job tarde/noche + uno a la mañana siguiente para pendientes "después".
3. **Validación de webhook** (budgetbot): `secret_token` + whitelist, tal como ya prevé `app/api/telegram/route.ts` con `TELEGRAM_WEBHOOK_SECRET`.
4. **Offline local-first** (Actual): si el SW básico se queda corto, IndexedDB + sync en background.
5. **Cero formato** (n8n tracker): monto + frase libre, sin comandos que memorizar — ya es tu spec, defendelo.

## Convenciones

- Español con **voseo**; la [`spec.md`](./spec.md) manda ante cualquier contradicción.
- Solo referencias: no vendorizar código sin revisar licencia (cuidado con AGPL-3.0 en derivados).
