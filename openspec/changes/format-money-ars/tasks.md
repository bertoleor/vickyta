# Tasks: formatMoneyARS

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~40 prod / ~150 SDD docs |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single commit, no PR |
| Delivery strategy | single-pr |
| Chain strategy | none (micro-función) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

`strict_tdd: false` — sin runner (`openspec.config.yaml`); verificación = node directo + `tsc --noEmit`.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | helper + SDD + verify en un commit | N/A local | node assert script | `node verify script` / N/A UI | revert del commit |

## Phase 1: RED (test primero)

- [x] 1.1 Script node de asserts para `formatMoneyARS` (falla: módulo no existe)

## Phase 2: GREEN (implementación)

- [x] 2.1 Crear `lib/format-money-ars.ts` puro, tipado estricto, sin `any` ni `console.log`
- [x] 2.2 Pasar asserts node en verde (formato, redondeo, `RangeError`)

## Phase 3: Contrato SDD

- [x] 3.1 `proposal.md`, `specs/money-formatting/spec.md` y `tasks.md` completos
- [x] 3.2 `verify.md` con evidencia RED→GREEN + `tsc` + gate

## Phase 4: Cierre

- [x] 4.1 Tildar tasks y commit acotado solo archivos propios, sin push
