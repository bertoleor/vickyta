# Proposal: Recordatorio noche pendientes (docs-only)

## Intent

Micro-feature de ejemplo docs-only para calibrar la cadena SDD en VICKY.
Cierra el loop del flujo "Después" (`docs/spec.md` línea 17): un gasto
guardado como pendiente debe generar un recordatorio a la noche; si al otro
día sigue sin cargarse, una notificación a la mañana. No invasivo.

## Scope

### In Scope (solo docs en este cambio)

- Este `proposal.md`, `specs/reminders/spec.md` y `tasks.md` (contrato).
- `docs/recordatorio-noche-pendientes.md` (nota de producto/UX).

### Out of Scope

- Todo código productivo: sin scheduler, sin envío Telegram, sin migración
  (`reminders` ya existe en el modelo mínimo de `docs/spec.md`).
- Sin cambios a `.env.example`, `package.json` ni rutas API.

## Capabilities

### New Capabilities

- `reminders`: contrato de recordatorios de gastos pendientes (noche + mañana).

### Modified Capabilities

- None.

## Approach

Docs-first: se verifica la cadena (proposal → spec → tasks → docs) sin tocar
código. La implementación futura la hará otro cambio SDD con runner y TDD.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/recordatorio-noche-pendientes/` | New (docs) | proposal + spec + tasks |
| `docs/recordatorio-noche-pendientes.md` | New (docs) | nota de producto/UX |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Horarios molestos para usuaria mayor | Medium | Ventanas fijas 20:30 / 09:30, un solo toque por ventana |
| Duplicados si ya registró el gasto | Low | Spec exige chequeo de estado antes de notificar |

## Rollback Plan

Borrar los 4 archivos docs; ningún código productivo cambia.

## Dependencies

- `docs/spec.md` (flujo Después), tabla `reminders` del modelo mínimo.

## Success Criteria

- [ ] Cadena SDD completa y legible: proposal → spec → tasks → docs.
- [ ] `git status` muestra cambios solo bajo `openspec/` y `docs/`.
