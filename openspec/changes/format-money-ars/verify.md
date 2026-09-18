# Verify: formatMoneyARS

## TDD mode

- `strict_tdd: false` (`openspec.config.yaml`, sin runner: sin scripts de test ni vitest/playwright) — estado HISTÓRICO de este change (2026-09-16).
- GAP DECLARADO ENTONCES: no había runner; verificación con node directo (import del `.ts` con type-stripping de Node 24) + `tsc --noEmit`.
- RED→GREEN real: RED = `ERR_MODULE_NOT_FOUND` antes de crear el módulo; GREEN = 8/8 asserts node tras implementar.

## Runner calibrado — GAP CERRADO (VICKY-P2, 2026-09-16/17)

- Runner declarado: **vitest** (+ jsdom + @testing-library/react) en `openspec.config.yaml` (`runners.unit: vitest`, `strict_tdd: true` habilitable).
- Script `npm test` → `vitest run`. Suite mínima en `__tests__/` (pool forks, singleFork para estabilidad Windows).
- Evidencia real: `npm test` → 11/11 passed, exit 0 (`__tests__/lib/format-money-ars.test.ts` 8/8 + `__tests__/components/ui/Button.test.tsx` 3/3 smoke).
- FIX de entorno Windows: cache `node_modules/.vite` stale/corrupt causa hang del worker (`Timeout fetching /@vite/env`); limpiar el cache resuelve. `tsc --noEmit` exit 0, `next lint` exit 0.
- Activación strict_tdd: para nuevos cambios togglear `strict_tdd: true` en `openspec.config.yaml` (runner ya disponible → exigir RED→GREEN).

## Evidence

### RED (pre-implementación)

```text
RED OK (modulo inexistente): ERR_MODULE_NOT_FOUND
```

### GREEN (post-implementación, `node` directo)

```text
ok positive => "$ 1.234,50"
ok zero => "$ 0,00"
ok negative => "-$ 50,00"
ok round-up => "$ 10,01"
ok round-down => "$ 10,00"
ok nan
ok inf
ok -inf
```

Asserts comparan contra `Intl.NumberFormat('es-AR', {currency:'ARS', 2 decimales})` y exigen `RangeError` para `NaN`/`±Infinity`. Exit 0.

### Types

```text
npx tsc --noEmit → exit 0, sin errores
```

## Spec compliance

| Requirement | Escenarios | Estado |
|-------------|------------|--------|
| ARS Formatting (positive/zero/negative) | 3 | PASS (asserts node) |
| Rounding (up/down) | 2 | PASS (asserts node) |
| Invalid Input Rejection (NaN/Infinity) | 2 (+`-Infinity` extra) | PASS (asserts node) |

## Gate (GGA, `AGENTS.md` VICKY)

- Sin `any` en exportada, sin `console.log`, sin secretos, sin `catch` vacío: PASS (helper puro, solo `Intl` + `Math`).
- Scope: solo `lib/format-money-ars.ts` + `openspec/changes/format-money-ars/`; `telegram-env-docs` no tocado.

## Verdict

STATUS: PASSED — cambio mínimo verificado, listo para commit acotado sin push.
