# STATUS — PWA + bot Telegram — VICKY

> **Búsqueda:** keywords: `vicky, status, auditoria, fases, pwa, telegram, rls, data-path, ci` · clasificación: `status` · estado: `canónico` · actualizado: 2026-10-04
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[pwa]], [[bot-telegram]], [[implementacion-telegram]], [[producto]]

## Conclusión primero

**La app web hoy no puede guardar ni mostrar datos (P0): las server actions usan un client anon sin sesión y RLS exige `auth.uid()` — y el bot comparte el mismo pozo roto vía `addTransaction`.** El feature #1 del spec (Ahora/Después con recordatorios, ORN-108) existe como librería pura testeada pero sin cablear al webhook. La suite (41 tests al 2026-10-01, 30 verificados 2026-10-03) está verde pero no toca el data path real. Estado de referencia: **auditoría Modo A del 2026-10-03** (34-auditor, kickoff t_5bfcd0ed) — 8 hallazgos → 8 tickets. Este STATUS reemplaza al del 2026-09-15 (deuda P3 anotada por el propio F0).

## Rama y pipeline

- Rama activa: `feat/vicky-f4-historial-resumen`, **19 commits ahead de origin/main**, pusheada a origin (salvo el HEAD local f8ecb2c del 2026-10-03).
- CI: workflow reparado EN f4 (trivy-action renombrado, job de tests agregado, lockfile trackeado) pero `on: push` solo dispara en `main`/`develop` → **los commits de f4 nunca corrieron CI** (ticket t_588291a4, P2).
- Tests locales 2026-10-03: 30/30 pass pero exit 1 (2 unhandled forks-worker errors, jsdom/Windows). Suite al 2026-10-01: 41/41 (commit 703b949).
- npm audit 0 (commit 7bf1163, next 15.5.27).

## Fases (estado verificable)

| Fase | Qué era | Estado | Evidencia |
| --- | --- | --- | --- |
| F0 | Inventario de arranque (2026-09-27): BUILD ROJO — node_modules corrupto, CI roto en main desde 15/9 | **Cerrada** — el entorno se reparó solo (instalación posterior); CI workflow reparado en f4 (c1f6a88); deuda P0/P1 resuelta | `docs/F0-2026-09-27.md` + re-verificación auditoría 2026-10-03 |
| F1 | RLS policy budgets + types + coverage guard (ORN-107) | **Commiteada** (197f07b) — el guard existe pero es regex estático sobre SQL | commit 197f07b |
| F2 | Bot Ahora/Después (ORN-108) | **A medias**: migración 0004 + types + capa pura `flow.ts` + 18 tests commiteados (ceebe7f, bf0c24f, 1695ef1); **SIN cablear al webhook**, endpoint reminders inexistente | ver [[bot-telegram]] §Ahora o Después y `odd/tasks/vicky-f2-bot-ahora-despues.md` |
| F3 | Reparación de salud (node_modules/CI) | **Absorbida** — resuelta entre F0 y f4 sin ola propia | auditoría 2026-10-03 §resuelto sin ticket |
| F4 | Historial + resumen (rama activa) | **En curso** — 19 commits, incluye fixes CI/deps/env + 0005 UNIQUE(chat_id) (f8ecb2c) | `git log --oneline main..HEAD` |

## Defectos abiertos (auditoría 2026-10-03 → tickets)

| Sev | Defecto | Ticket |
| --- | --- | --- |
| P0 | Data path roto: server actions con client anon sin sesión → RLS bloquea TODA la app (web + bot vía addTransaction) | t_b1af5693 |
| P1 | Flujo Ahora/Después sin cablear: flow.ts código muerto, endpoint `/api/telegram/reminders` inexistente | t_3f2176ff |
| P1 | Bot inserta `category_id` string no-UUID (`cat-super`) → FK violation; categorías/bancos hardcodeados | t_9a73f2fe |
| P2 | Webhook fail-open, callbacks sin allowlist, delete sin ownership, HTML injection | t_0d2bf078 |
| P2 | CI solo main/develop — f4 nunca validada; main roto desde 15/9 | t_588291a4 |
| P2 | 0 tests del data path real; suite local exit 1 con 30/30 pass | t_8bffca39 |
| P3 | Docs descreen realidad (bot-telegram.md, ODD T2/T3, STATUS) — **resuelto 2026-10-04** (t_6a5cbc60: este refresh + reescritura de bot-telegram.md + ODD honesto) | t_6a5cbc60 ✅ |
| P3 | Hardening menor: bypass startsWith middleware, login sin rate-limit | t_cdb1bc45 |

Informe completo con evidencia por hallazgo: `E:/Hermes/kanban/attachments/t_5bfcd0ed/auditoria-vicky-2026-10-03.md`.

## PWA — VERIFICADO (re-chequeado 2026-10-04)

- **Manifest:** `public/manifest.json` — cableado en `app/layout.tsx:19` (`metadata.manifest: "/manifest.json"`).
- **Service worker:** `public/sw.js` (cache-first, fallback offline `public/offline.html`); registrado por `app/components/ServiceWorkerRegistration.tsx` montado en `app/layout.tsx:38`.
- Sin deploy validado; ver [[pwa]].

## Bot Telegram — cableado (con defectos)

- Webhook `POST /api/telegram` (`app/api/telegram/route.ts`, bypass middleware) — flujo "ahora" completo, 6 comandos, vinculación por código de 6 dígitos vía `POST /api/telegram/verify`. Detalle fiel en [[bot-telegram]].
- **NO existe:** flujo Ahora/Después en el webhook, endpoint de recordatorios, persistencia de updates en `telegram_messages`.
- Migraciones: `0002_telegram.sql` (tablas), `0005_telegram_sessions_unique.sql` (reparación UNIQUE(chat_id), f8ecb2c).

## Historial de este archivo

- 2026-09-15 (ORN-187): verificación ligera PWA + bot — vigente en su momento, hoy histórico. Anotó `.env.example` sin vars de Telegram: RESUELTO (commit e638747 + checker `check:env-docs`).
- 2026-10-04: refresh completo contra la auditoría 2026-10-03 (t_6a5cbc60). Próxima actualización: al cerrarse tickets P0/P1.