# Reminders Specification

## Purpose

Todo gasto en estado `pendiente` genera recordatorios no invasivos
(noche del mismo día, mañana del día siguiente) hasta que se registre
o se descarte.

## Requirements

### Requirement: Night Reminder

The system MUST schedule one evening reminder per pending expense,
for 20:30 local time on the day it was created.

#### Scenario: Pendiente a la noche

- GIVEN un gasto en estado `pendiente` creado hoy y aún no registrado
- WHEN llegan las 20:30
- THEN el sistema envía un único recordatorio con botones Registrar / Descartar

#### Scenario: Ya registrado, sin recordatorio

- GIVEN el gasto pasó a `registrado` antes de las 20:30
- WHEN llega la ventana nocturna
- THEN no se envía nada

### Requirement: Morning Follow-up

The system MUST send one morning follow-up at 09:30 next day only if
the expense is still `pendiente` and the night reminder was already sent.

#### Scenario: Sigue pendiente al otro día

- GIVEN el gasto sigue `pendiente` a las 09:30 del día siguiente
- WHEN se evalúa la ventana de mañana
- THEN se envía una única notificación de seguimiento

#### Scenario: Resuelto de noche, silencio a la mañana

- GIVEN el gasto se resolvió tras el recordatorio nocturno
- WHEN llega la ventana de mañana
- THEN no se envía nada

### Requirement: No Invasivo

The system MUST send at most one notification per window per expense,
never outside 09:30–21:00, in voseo and with large-action wording.

#### Scenario: Ventana ya notificada

- GIVEN ya se notificó este gasto en la ventana actual
- WHEN se re-evalúa
- THEN no se duplica el envío
