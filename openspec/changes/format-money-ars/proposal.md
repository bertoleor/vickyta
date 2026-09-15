# Proposal: formatMoneyARS (pure helper)

## Intent

Gastos e ingresos muestran montos sin formato único; se necesita un helper puro mínimo para formatear ARS y calibrar la cadena SDD con código real.

## Scope

### In Scope
- `formatMoneyARS(value)` puro en `lib/format-money-ars.ts`.
- Cadena SDD: proposal + spec + tasks + verify, verificación con node directo.
- Commit acotado sin push.

### Out of Scope
- Integración en UI, parsers de montos, i18n general.
- `telegram-env-docs` (otro cambio, no se toca).
- Agregar runner de tests (se declara el gap).

## Capabilities

### New Capabilities
- `money-formatting`: formateo determinista de montos ARS.

### Modified Capabilities
- None.

## Approach

TDD estricto adaptado: RED con script node que falla sin la función, GREEN con implementación pura (`Intl es-AR`, 2 decimales), verificación con node directo por `strict_tdd: false` sin runner.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/format-money-ars.ts` | New | helper puro + tipos estrictos |
| `openspec/changes/format-money-ars/` | New | proposal + spec + tasks + verify |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Separador locale distinto en otro runtime | Low | fijar `es-AR` + asserts con `Intl` normalizado |
| Uso con NaN/Infinity | Low | `RangeError` explícito por spec |

## Rollback Plan

Revertir el commit acotado; borrar `lib/format-money-ars.ts` y `openspec/changes/format-money-ars/`.

## Dependencies

- Ninguna (solo `Intl` nativo de Node 20+).

## Success Criteria

- [ ] `formatMoneyARS` pasa asserts node (RED→GREEN evidenciado).
- [ ] `tsc --noEmit` sin errores nuevos en el archivo.
- [ ] Tasks tildadas, `verify.md` con evidencia, commit acotado sin push.
