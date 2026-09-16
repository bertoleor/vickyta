# Proposal: Telegram Env Docs

## Intent

ORN-187 follow-up (recorded discrepancy): `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ALLOWED_USERS` (plus
`SUPABASE_SERVICE_ROLE_KEY`) are read in code but missing from `.env.example`.
New setups silently run without the bot. Document all six + add a checker.

## Scope

### In Scope

- `.env.example`: document the 4 missing vars (6 total)
- `scripts/check-env-docs.mjs`: node checker — every `process.env.X` in
  `app/ lib/ components/ middleware.ts` must appear in `.env.example`
- `package.json` script `check:env-docs`

### Out of Scope

- Rotating or provisioning real secrets
- Changing telegram route behavior

## Capabilities

### New Capabilities

- `env-docs`: env-documentation completeness contract for VICKY

### Modified Capabilities

- None

## Approach

Extend `.env.example`, write the checker (no test runner in repo;
`strict_tdd: false`), run `node scripts/check-env-docs.mjs` + `tsc` + `lint`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.env.example` | Modified | 4 missing vars documented |
| `scripts/check-env-docs.mjs` | New | Completeness checker |
| `package.json` | Modified | `check:env-docs` script |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Checker false positives (dynamic keys) | Low | Only static `process.env.X` matches counted |

## Rollback Plan

Revert single commit; `.env.example` returns to 2 vars.

## Dependencies

- None

## Success Criteria

- [ ] Checker exits 0; `tsc --noEmit` and `next lint` pass
- [ ] Linear micro-issue closed with evidence
