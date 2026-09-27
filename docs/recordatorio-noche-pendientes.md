# Recordatorio noche pendientes — nota de producto/UX

> Micro-feature docs-only de ejemplo (calibración SDD 2026-09-15).
> Contrato: `openspec/changes/recordatorio-noche-pendientes/`.
> Fuente de dominio: `docs/spec.md` (flujo Después).
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[bot-telegram]], [[producto]], [[projects/Vicky/docs/spec]]

## Problema

Los gastos guardados "para después" se olvidan. La usuaria necesita un
empujón suave, no una alarma.

## Diseño

- Dos ventanas fijas: **20:30** (noche del mismo día) y **09:30** (mañana
  siguiente, solo si sigue pendiente).
- Un toque por ventana y por gasto. Nada fuera de 09:30–21:00.
- Mensaje en voseo, corto, con dos botones grandes: **Registrar** / **Descartar**.
- Registrar abre el flujo "Ahora" existente (medio → cuenta → categoría).

## Ejemplo de copy

> "Tenés 1 gasto pendiente de hoy: $2.500 (almuerzo). ¿Lo registramos?"
> [Registrar] [Después]

## Fuera de alcance (a propósito)

Scheduler, envío Telegram, migración `reminders`, snooze configurable.
Todo eso va en el cambio de implementación futuro.
