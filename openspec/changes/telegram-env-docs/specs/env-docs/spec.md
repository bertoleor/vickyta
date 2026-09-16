# Env Docs Specification

## Purpose

Every environment variable read by VICKY code is documented in `.env.example`,
and a checker enforces it.

## Requirements

### Requirement: Complete Example File

The system MUST list all six runtime variables in `.env.example`:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USERS`.

#### Scenario: Fresh setup

- GIVEN a developer copies `.env.example` to `.env.local`
- WHEN they fill each entry
- THEN the app and the Telegram bot have every variable they read

### Requirement: Automated Completeness Check

The system MUST provide `scripts/check-env-docs.mjs`, which fails (exit ≠ 0)
when any static `process.env.X` reference in shipped code is absent from
`.env.example`.

#### Scenario: Missing var detected

- GIVEN code reads `process.env.NEW_VAR` not listed in `.env.example`
- WHEN the checker runs
- THEN it exits non-zero naming `NEW_VAR`

#### Scenario: All documented

- GIVEN all referenced vars are listed
- WHEN the checker runs
- THEN it exits 0
