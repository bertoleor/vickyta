# Tasks: Telegram Env Docs

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 30–60 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Note: `strict_tdd: false` (no runner in repo). Verification = checker + tsc + lint.

## Phase 1: Checker First (test-equivalent)

- [x] 1.1 Write `scripts/check-env-docs.mjs`; run it and confirm it FAILS listing the 4 undocumented vars

## Phase 2: Implementation

- [x] 2.1 Extend `.env.example` with the 4 vars; add `check:env-docs` script to `package.json`

## Phase 3: Verify

- [x] 3.1 Checker exits 0; `npx tsc --noEmit` + `npm run lint` pass
- [x] 3.2 Linear micro-issue to Done with evidence; commit + push (`main`)
