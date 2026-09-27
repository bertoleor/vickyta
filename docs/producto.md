# VICKY — App financiera PWA + bot de Telegram

> Doc de producto. Fuente autorizada: [`spec.md`](./spec.md) (spec del dueño, 2026-09-14).
> Estado: fase 0 (base de datos) aplicada; fases 1-5 pendientes de implementar (ver [Roadmap](#roadmap)).
> Parte de: [[projects/Vicky/docs/README]] · Relacionados: [[projects/Vicky/docs/spec]], [[arquitectura]], [[bot-telegram]]

## Qué es

**VICKY** es una aplicación web progresiva (PWA) de finanzas personales pensada para que
una persona mayor —la madre del dueño— maneje sus gastos **sin fricción**. La idea central:
**todo gasto se carga por Telegram**, y la app en la PC (o cualquier navegador) es un espejo
completo pero sencillo de lo que pasa.

Dos caras del mismo producto:

- **Bot de Telegram** — el registro de gastos diario, rápido y conversacional.
- **App PWA** — el panel completo: historial, cuentas, presupuestos, ingresos y resumen.

## Objetivo

Que la usuaria siga sus finanzas con el mínimo esfuerzo:

1. Mandar un gasto por Telegram con solo escribir **monto + frase** (que queda en observaciones).
2. Que el bot la guíe paso a paso para clasificarlo (medio, cuenta, categoría).
3. Tener un espejo completo pero **sencillo** en la app para revisar, editar y comparar.

**Principio de diseño para la usuaria:** botones grandes, poco texto, mensajes en voseo.
Completo por dentro, simple por fuera.

## Flujo del bot de Telegram

1. La usuaria manda el gasto: `4500 verdulería`.
2. El bot pregunta **"¿Registrar gasto ahora o después?"** con un selector.
3. **Ahora** → preguntas individuales paso a paso:
   - **Medio de pago**: efectivo / crédito / débito / billetera virtual.
   - Si es crédito/débito/billetera → selector de **cuenta propia** de ese medio.
   - **Categoría o subcategoría**.
4. **Después** → el gasto queda **pendiente** y el bot lo recuerda a la tarde/noche.
   Si al otro día sigue sin cargar → notificación a la mañana. Recordatorio no invasivo.

Comandos programados: `/start`, `/hoy`, `/saldos`, `/cancelar`.

## App PWA (espejo)

- **Home**: últimos gastos + gastos pendientes (clasificables desde el home).
- **Cuentas**: añadir por medio (efectivo, crédito, débito, billetera virtual).
- **Historial**: lista con filtros por tipo/categoría/cuenta/fecha y búsqueda por descripción.
- **Resumen por categoría**, edición de movimientos y comparación entre meses.
- **Ingresos**: carga por cuenta.
- **Gastos recursivos**: cuotas de tarjeta (n.º de cuota, de qué cuenta sale).

### Rutas de la app

| Ruta                         | Función                                              |
| ---------------------------- | ---------------------------------------------------- |
| `/`                          | Dashboard: saldo, movimientos recientes, pendientes  |
| `/gastos`                    | Carga y categorización de gastos                     |
| `/ingresos`                  | Carga de ingresos                                    |
| `/historial`                 | Historial con filtros y exportación                  |
| `/banco`                     | Cuentas, vencimientos e intereses de tarjetas        |
| `/presupuestos`              | Presupuestos por categoría                           |
| `/configuracion/*`           | Perfil, apariencia, notificaciones, seguridad (PIN)  |
| `/login`                     | Ingreso con PIN/username                             |
| `/api/telegram`              | Webhook del bot (telegram)                           |
| `/api/telegram/verify`       | Verificación de vinculación Telegram ↔ app           |

## Público y tono

- Usuaria única primaria: personas mayores, poca familiaridad con la tecnología.
- **Idioma y tono**: español, **voseo**, frases cortas, claras y amables.
- Cada interacción debe ser obvia: un paso por vez, nada de texto largo.

## Stack técnico

- **Core**: Next.js 14 (App Router) + React 18, TypeScript.
- **Estilos**: Tailwind CSS 4 (tema iOS-inspired, tipografía Inter).
- **Backend / DB**: Supabase (proyecto `vicky`, ref `dttxtzuwodoikidzifwk`), con RLS (Row-Level Security).
- **Notificaciones y carga de gastos**: Telegram Bot API.
- **PWA**: manifest + service worker para uso offline básico.

## Modelo de datos

Esquema source: [`supabase/migrations/0001_vicky_initial.sql`](../supabase/migrations/0001_vicky_initial.sql)
y `0002_telegram.sql`. Tablas principales:

| Tabla                   | Descripción                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `accounts`              | Cuentas por medio: banco, billetera virtual, efectivo, tarjeta, deuda/fiado |
| `transactions`          | Movimientos: gasto / ingreso / transferencia, con medio, categoría, cuotas y tag |
| `categories`            | Árbol de categorías (padre e hijas). **27 categorías** sembradas por defecto |
| `budgets`               | Presupuestos por categoría y período (semanal/mensual/anual)         |
| `user_preferences`      | Tema, color de acento y preferencias de notificación por usuario     |
| `telegram_users`        | Vinculación cuenta Telegram ↔ usuario de la app                      |
| `telegram_messages`     | Log de mensajes entrantes del bot                                    |
| `telegram_sessions`     | Estado del flujo del bot + códigos de verificación de vinculación    |

Tipos (enum): `transaction_type` (gasto / ingreso / transferencia_interna),
`payment_method` (transferencia, qr, debito, debito_automatico, credito, descubierto,
efectivo, fiado_adrian) y `traffic_light` (inevitable / optimizable / evitable).

**Seguridad**: RLS habilitado en todas las tablas; políticas por `auth.uid()` para que cada
usuario vea solo sus datos. Las tablas de Telegram se administran con `service_role`.

## Roadmap

Fases propuestas (según la spec del dueño):

1. **Fase 0 — DB** ✅ *Aplicada*: schema + RLS + 27 categorías en Supabase, migraciones en `supabase/migrations/`.
2. **Fase 1 — Bot** ⏳ Pendiente: flujo ahora/después + recordatorios + vinculación real.
3. **Fase 2 — PWA home** ⏳ Pendiente: dashboard, cuentas y pendientes.
4. **Fase 3 — Historia** ⏳ Pendiente: historial, resumen, comparación, ingresos, recursivos.
5. **Fase 4 — Pulido** ⏳ Pendiente: revisión visual con el dueño (primera usuaria real).

## Documentación relacionada

- **[Índice de documentación](./README.md)** — punto de entrada a toda la carpeta `docs/`.
- **[Spec del dueño](./spec.md)** — descripción original del producto (fuente autorizada).
- **[Plan de integración con Telegram](./plans/implementacion-telegram.md)**.
- **[Auditorías](./plans/)** — escaneos del estado del proyecto (históricos).