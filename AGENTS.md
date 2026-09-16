# VICKY — Code Review Rules (GGA)
Stack: Next 14 / React / TS / Supabase (DB en construcción) + bot Telegram.
Canon: `E:/Hermes/AGENTS.md` (Gentleman gates rigen en este repo).

## General
REJECT if:
- Hardcoded secrets or credentials (incluye tokens de bot)
- `any` type on exported functions
- Empty catch blocks
- `console.log` in production code (use logger)

## PWA y bot
REJECT if:
- Telegram webhook without secret validation
- Expense amounts parsed without grammar validation
- PWA manifest or service worker broken

## Response Format
FIRST LINE must be exactly:
STATUS: PASSED
or
STATUS: FAILED

If FAILED, list: `file:line - rule violated - issue`
