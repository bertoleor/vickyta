> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[bot-telegram]], [[recordatorio-noche-pendientes]]

# ODD Feature — vicky-f2-bot-ahora-despues

> **Búsqueda:** keywords: `telegram, bot, pendientes, recordatorios, ahora, despues` · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-10-04

## Objective
Complete ORN-108: after amount+description, the bot asks "Ahora o Después"; "Después" stores the expense as pending and reminders fire at 20:30 (same day) and 09:30 (next day) with Registrar/Descartar buttons.

## Problem / Why
The spec (docs/spec.md) defines the core bot flow as ahora/después with reminders, but the current `app/api/telegram/route.ts` jumps straight to CATEGORY selection. Pending expenses are forgotten — the whole reason the owner wants the bot (docs/recordatorio-noche-pendientes.md).

## Scope
- In: DB table(s) for pending expenses + reminder windows; bot flow Ahora/Después; callbacks to register/discard pending; reminders endpoint (`/api/telegram/reminders`) that sends due reminders; migration + down; database.types.ts update; tests.
- Out: scheduler infra (Hermes cron or external hits the endpoint); app PWA pending list UI (F3); snooze config.

## Constraints
- TDD (strict): vitest runner, RED before code, GREEN minimal, triangulation.
- GGA: no hardcoded secrets, no `any` on exported fns, no empty catch, no console.log in prod paths (logger/console.error only in error paths is current style).
- DB: migration requires down.sql; RLS enabled tables need >=1 CREATE POLICY (rls-coverage guard).
- Telegram tables are service_role-only by design (bot bypasses auth.uid()).
- Budget: ~400 authored lines per work unit; split into 2 commits (DB/bot core, reminders+cron wiring).
- Generated-By trailer on AI-authored commits.

## Tasks (stable IDs)
- [x] T1: Migration `0004_pending_expenses.sql` + down: `pending_expenses` table (chat_id, amount, description, status, created/updated), RLS + service_role policy, unique constraint chat_id+status pending dedupe guard. — Done 2026-09-30 noche, commit bf0c24f. Partial index (chat_id) WHERE status='pendiente' instead of UNIQUE (configurable multi-pending per chat is a feature; dedupe guard lives in flow code as designed).
- [ ] T2: Test RED → bot flow: parsed expense asks Ahora/Después (not CATEGORY); callback `pend:despues` inserts pending_expense row; callback `pend:registrar:<id>` restarts CATEGORY flow with stored amount/description; `pend:descartar:<id>` marks discarded. — **SIN CABLEAR.** `lib/telegram/flow.ts` (pure layer: parseExpenseMessage, getTimingKeyboard, resolvePendCallback + tests) committed in ceebe7f, but ceebe7f only touched `lib/telegram/` + `__tests__/` — never `app/api/telegram/route.ts` (`git show --stat ceebe7f`). The webhook still routes parsed expenses straight to CATEGORY (`route.ts:662-672`) and has no `pend:*` callback handler. Wiring en curso: ticket t_3f2176ff (16-backend) + working-tree files `lib/telegram/bot-data.ts`, `__tests__/telegram/{bot-data,webhook-wiring,reminders-endpoint}.test.ts` (untracked as of 2026-10-04).
- [ ] T3: Test RED → reminders endpoint: POST /api/telegram/reminders with valid secret → picks pending expenses whose reminder window (20:30 / 09:30 America/Argentina) has arrived and reminder not yet sent → sends Telegram message with Registrar/Descartar inline keyboard → marks reminder sent. — **SIN CABLEAR.** Due-window selection logic (`selectDueReminders`, `buildReminderMessage`, `getReminderKeyboard`) + tests committed in ceebe7f, pero el endpoint `app/api/telegram/reminders/` **no existe** — `app/api/telegram/` solo contiene `route.ts` y `verify/` (verificado 2026-10-04). Same wiring ticket t_3f2176ff.
- [x] T4: Types: add PendingExpense to database.types.ts.
- [x] T5: Docs: update docs/bot-telegram.md (flow, commands, reminders, endpoint), spec pointer. — Done 2026-09-29 (commit 1695ef1), PERO esa versión de bot-telegram.md documentaba el endpoint de recordatorios y el flujo "Ahora o Después" como verificados cuando NO existían (hallazgo H7 de la auditoría 2026-10-03). **Re-echo 2026-10-04** (t_6a5cbc60): el doc ahora describe lo cableado con archivo:línea y lo pendiente como pendiente.
- [ ] T6: Hermes cron wiring: register `vicky-telegram-reminders` job hitting the endpoint (needs deployed URL + webhook secret) — owner decision if deployment not ready.
- [x] T7: Full suite GREEN + tsc + lint, RDD receipt, commit+push, kanban → review. — Recalibrado 2026-10-04 (hallazgo H7): "done" original (2026-10-01: vitest 41/41, tsc clean, eslint clean) era verde de suite, no feature: los 41 tests no cableaban nada del feature (la suite no toca `app/api/telegram/route.ts`). El slice commiteado está limpio como LIBRERÍA pura; el feature end-to-end requiere T2/T3 wiring + T6. Mantener abierto hasta cierre de t_3f2176ff.

## Accumulated evidence
- 2026-09-29 (noche): RED observado (2 tests rojos: silence window + stale night). Fix en `selectDueReminders`: silence guard 09:30–21:00 local + stale-night rule (night sólo su mismo día local). Test log: `Test Files 3 passed (3) / Tests 18 passed (18)`. tsc --noEmit clean.
- 2026-09-29 (noche, segunda vuelta): T4 tipos PendingExpense (database.types.ts) + T5 docs/bot-telegram.md (flow + reminders endpoint) → vitest 18/18 GREEN, tsc clean.
- 2026-09-30 (noche): T1 migration `0004_pending_expenses.sql` + down + contract test. RED observado ("missing migration"), luego GREEN 6/6. Suite completa 30/30 tests (2 unhandled errors pre-existentes ajenos a migration). Nota: partial index en lugar de UNIQUE constraint — multi-pending por chat es decisión consciente; dedupe guard vive en flow code. Commit bf0c24f pushed.
- 2026-10-01 (noche): T7 pipeline clean — vitest 41/41 (8 files, 50s), `tsc --noEmit` exit 0, `eslint . --max-warnings=0` exit 0. Tests crecieron 30→41 (suite expandida entre vueltas). Slice ORN-108 listo para PR/review; T6 queda como owner decision.
- 2026-10-03 (auditoría 34-auditor, kickoff t_5bfcd0ed, hallazgo H2/H7): se verificó que NADA de T2/T3 está cableado — `git show --stat ceebe7f` confirma que el commit solo tocó `lib/telegram/` + `__tests__/` (nunca `route.ts`), grep de `lib/telegram/flow` en `app/` da 0 matches, y `app/api/telegram/` no contiene `reminders/`. La "pipeline clean 41/41" era verde de librería pura: ningún test toca el webhook real.
- 2026-10-04 (19-writer, t_6a5cbc60): re-verificado el estado del wiring — sigue sin haber import de flow.ts en `app/` y sin endpoint reminders; apareció trabajo en curso (untracked) de 16-backend en `lib/telegram/bot-data.ts` + `__tests__/telegram/{bot-data,webhook-wiring,reminders-endpoint}.test.ts` (ticket t_3f2176ff en progreso). Este ODD y docs/bot-telegram.md corregidos para reflejar la realidad.

## Accepted changes and rationale
- Pending expenses live in their own table, NOT `transactions`: `transactions.account_id`/`method` are NOT NULL and a pending expense has neither yet. Own table keeps `transactions` invariants honest.
- Silence/staleness rule: reminders only fire 09:30–21:00 America/Argentina; an unsent night reminder from the previous local day is superseded by the morning window.

## Next step
- **Wiring T2/T3 (bloqueante, en curso):** ticket t_3f2176ff (16-backend) — importar flow.ts en el webhook (pregunta Ahora/Después + handlers `pend:*`), crear `app/api/telegram/reminders/route.ts`. SIN eso, el feature no existe end-to-end. Los archivos untracked del working tree son ese trabajo en progreso.
- **T6 Hermes cron wiring** `vicky-telegram-reminders` (owner decision: requiere deploy de la rama + webhook secret) — dependiente de T2/T3.
- Nota 2026-10-04: el wiring hereda los defectos P0/P1/P2 abiertos de la auditoría (data path roto `lib/actions/*` → RLS bloquea `addTransaction`; `category_id` strings no-UUID → FK violation). Cablear flow.ts sin arreglar eso produce un bot que tampoco puede guardar. Ver tabla en [[projects/Vicky/docs/bot-telegram|bot-telegram.md]] y [[STATUS]].
