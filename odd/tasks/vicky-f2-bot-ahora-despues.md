> Parte de: [[INDICE-SISTEMA]] · Relacionados: [[bot-telegram]], [[recordatorio-noche-pendientes]]

# ODD Feature — vicky-f2-bot-ahora-despues

> **Búsqueda:** keywords: `telegram, bot, pendientes, recordatorios, ahora, despues` · clasificación: `odd-feature` · estado: in-progress · actualizado: 2026-09-28

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
- [ ] T2: Test RED → bot flow: parsed expense asks Ahora/Después (not CATEGORY); callback `pend:despues` inserts pending_expense row; callback `pend:registrar:<id>` restarts CATEGORY flow with stored amount/description; `pend:descartar:<id>` marks discarded. — Flow + tests committed in ceebe7f (T2+T3 per commit), but box left unchecked; verify against route.ts wiring before T6.
- [ ] T3: Test RED → reminders endpoint: POST /api/telegram/reminders with valid secret → picks pending expenses whose reminder window (20:30 / 09:30 America/Argentina) has arrived and reminder not yet sent → sends Telegram message with Registrar/Descartar inline keyboard → marks reminder sent. — Logic + tests in ceebe7f; same caveat as T2.
- [x] T4: Types: add PendingExpense to database.types.ts.
- [x] T5: Docs: update docs/bot-telegram.md (flow, commands, reminders, endpoint), spec pointer.
- [ ] T6: Hermes cron wiring: register `vicky-telegram-reminders` job hitting the endpoint (needs deployed URL + webhook secret) — owner decision if deployment not ready.
- [x] T7: Full suite GREEN + tsc + lint, RDD receipt, commit+push, kanban → review. — Done 2026-10-01 noche: vitest 41/41 (8 files), tsc --noEmit clean, eslint --max-warnings=0 clean.

## Accumulated evidence
- 2026-09-29 (noche): RED observado (2 tests rojos: silence window + stale night). Fix en `selectDueReminders`: silence guard 09:30–21:00 local + stale-night rule (night sólo su mismo día local). Test log: `Test Files 3 passed (3) / Tests 18 passed (18)`. tsc --noEmit clean.
- 2026-09-29 (noche, segunda vuelta): T4 tipos PendingExpense (database.types.ts) + T5 docs/bot-telegram.md (flow + reminders endpoint) → vitest 18/18 GREEN, tsc clean.
- 2026-09-30 (noche): T1 migration `0004_pending_expenses.sql` + down + contract test. RED observado ("missing migration"), luego GREEN 6/6. Suite completa 30/30 tests (2 unhandled errors pre-existentes ajenos a migration). Nota: partial index en lugar de UNIQUE constraint — multi-pending por chat es decisión consciente; dedupe guard vive en flow code. Commit bf0c24f pushed.
- 2026-10-01 (noche): T7 pipeline clean — vitest 41/41 (8 files, 50s), `tsc --noEmit` exit 0, `eslint . --max-warnings=0` exit 0. Tests crecieron 30→41 (suite expandida entre vueltas). Slice ORN-108 listo para PR/review; T6 queda como owner decision.

## Accepted changes and rationale
- Pending expenses live in their own table, NOT `transactions`: `transactions.account_id`/`method` are NOT NULL and a pending expense has neither yet. Own table keeps `transactions` invariants honest.
- Silence/staleness rule: reminders only fire 09:30–21:00 America/Argentina; an unsent night reminder from the previous local day is superseded by the morning window.

## Next step
- T6 Hermes cron wiring `vicky-telegram-reminders` (owner decision: requiere deploy de la rama + webhook secret). T7: full pipeline clean (vitest + tsc + lint) antes de PR/kanban → review.
