# Tasks: Recordatorio noche pendientes (docs-only)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 0 prod / ~120 docs |
| 400-line budget risk | None |
| Chained PRs recommended | No |
| Suggested split | single docs commit |
| Delivery strategy | docs-only |
| Chain strategy | none (ejemplo de calibración) |

Decision needed before apply: No (no hay código).
`strict_tdd: false` — sin runner; verificación = revisión de cadena.

## Phase 1: Contrato (este cambio)

- [x] 1.1 `proposal.md` describe intent, scope y success criteria
- [x] 1.2 `specs/reminders/spec.md` cubre noche + mañana + no-invasivo con escenarios
- [x] 1.3 `docs/recordatorio-noche-pendientes.md` fija UX y ventanas horarias

## Phase 2: Verificación de cadena (sin código)

- [x] 2.1 `git status --porcelain` muestra archivos solo bajo `openspec/` y `docs/`
- [x] 2.2 Cada requirement del spec traza a una sección del proposal o de `docs/spec.md`
- [x] 2.3 Reporte de inventario SDD archivado (este test)

## Phase 3: Implementación futura (fuera de este cambio)

- [ ] 3.1 Nuevo cambio SDD con scheduler + envío + migración `reminders`
- [ ] 3.2 TDD con runner (hoy inexistente, ver `openspec.config.yaml`)
