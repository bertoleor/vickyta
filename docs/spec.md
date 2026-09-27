# VICKY — App financiera PWA + bot Telegram (spec del dueño 2026-09-14)

> Fuente: descripción directa del dueño. Estado: SPEC, no implementado. DB: proyecto `vicky` (token 4, org token-4) desde cero. Costo cero.
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[producto]], [[arquitectura]], [[bot-telegram]]

## Objetivo

Facilidad para la madre del dueño para seguir sus finanzas. Todo gasto se pone por Telegram. App PWA en PC como espejo completo pero sencillo.

## Flujo Telegram (bot)

1. Ella manda mensaje con el gasto: monto + palabra/frase que queda en observaciones.
2. Bot pregunta: "¿Registrar gasto ahora o después?" con selector Ahora / Después.
3. Si **Ahora**: preguntas individuales paso a paso —
   - medio: efectivo / crédito / débito / billetera virtual
   - si crédito/débito/billetera: selector de cuenta propia de ese medio
   - categoría o subcategoría
4. Si **Después**: queda pendiente + recordatorio tarde/noche para cargarlo.
   Si al otro día sigue sin cargar: notificación mañana. No invasivo, sí recordatorio.

## App PWA

- Home: últimos gastos + gastos pendientes (clasificables desde el home).
- Añadir cuentas (por medio: efectivo, crédito, débito, billetera).
- Historial, resumen por categoría, edición, comparación de meses.
- Carga de ingresos por cuenta.
- Gastos recursivos: cuotas de tarjeta (n° cuota, de qué cuenta es).
- Completo pero sencillo (usuaria mayor: botones grandes, poco texto, voseo).

## Modelo de datos mínimo (a diseñar por 06-DBA)

`accounts(id, medio, nombre)` · `expenses(id, monto, medio, account_id, categoria, subcategoria, observaciones, estado: registrado|pendiente, fecha)` · `incomes(id, account_id, monto, fecha)` · `recurring(id, tipo, cuota_n, cuota_total, account_id)` · `reminders(expense_id, cuándo, estado)`.

## Fases propuestas

1. DB vicky desde cero + RLS + types.
2. Bot: flujo ahora/después + recordatorios.
3. PWA home + cuentas + pendientes.
4. Historial/resumen/comparación/ingresos/recursivos.
5. Pulido visual con el dueño (primer cliente).

## Nota operativa (2026-09-14)

VICKY es **greenfield: sin repo ni dir local**. Todo lo que genere la flota
(DB ya migrada a proyecto `vicky` token-4, docs, código futuro) vive primero en
`E:/Hermes/` + Supabase hasta que el dueño defina dónde vive el repo. El
blocker-scan lo marca como "dependencia rota de bootstrap" — no es error, es
estado: pendiente decisión de repo.
