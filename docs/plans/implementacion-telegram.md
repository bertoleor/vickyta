# 📋 Plan de Implementación - Integración con Telegram

## Estado Actual

La integración con Telegram está **parcialmente implementada**:

- ✅ Código del bot en [`app/api/telegram/route.ts`](app/api/telegram/route.ts) (786 líneas)
- ✅ Tabla `telegram_users` existe en la base de datos
- ✅ Comandos programados: `/start`, `/hoy`, `/saldos`, `/cancelar`
- ❌ **Falta tabla `telegram_sessions`** (referenciada pero no existe)
- ❌ **Sin token de bot** configurado
- ❌ **Vinculación ficticia** (usa `Date.now()` como mock)
- ❌ **Sin verificación real** del usuario

---

## 🎯 Objetivo

Lograr que el usuario pueda:

1. Vincular su cuenta de Telegram con la app
2. Recibir notificaciones de gastos
3. Registrar gastos directamente desde Telegram
4. Ver saldo y gastos del día desde el bot

---

## 📝 Plan de Implementación (6 pasos)

### Paso 1: Configurar Variables de Entorno

**Archivo:** `.env.local` (agregar)

```env
# Obligatorio - Token del bot de Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Opcional - Para seguridad del webhook
TELEGRAM_WEBHOOK_SECRET=tu_secreto_seguro_123

# Opcional - Limitar usuarios (IDs separados por coma)
TELEGRAM_ALLOWED_USERS=123456789,987654321
```

**Acción:** Obtener el token del bot de @BotFather en Telegram.

---

### Paso 2: Crear Tabla telegram_sessions

**Archivo SQL a ejecutar en Supabase:**

```sql
-- Tabla de sesiones para el flujo de gastos en Telegram
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL,
  step TEXT NOT NULL DEFAULT 'START',
  -- Datos del gasto
  amount DECIMAL(12, 2),
  description TEXT,
  category_id UUID,
  category_name TEXT,
  method TEXT,
  bank TEXT,
  installments INT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_chat_id
  ON telegram_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_updated
  ON telegram_sessions(updated_at DESC);

-- Habilitar RLS
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: solo servicio puede acceder (para el API)
CREATE POLICY "Service role can manage sessions" ON telegram_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

---

### Paso 3: Modificar NotificationSettings para Verificación Real

**Archivo:** [`app/configuracion/notificaciones/NotificationSettings.tsx`](app/configuracion/notificaciones/NotificationSettings.tsx)

**Cambio necesario:** En lugar de usar mock, implementar flujo de verificación:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Usuario ingresa │────>│ Bot envía código │────>│ Usuario ingresa │
│ @username       │     │ de verificación  │     │ código en app  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Se guarda el    │
                                                 │ chat_id real    │
                                                 └─────────────────┘
```

**Nueva función a implementar:**

- `generateVerificationCode()` - Genera código de 4 dígitos
- `sendVerificationToBot()` - Envía código vía bot
- `verifyCode()` - Valida código y vincula

---

### Paso 4: Actualizar API route.ts

**Cambios necesarios en [`app/api/telegram/route.ts`](app/api/telegram/route.ts:186-231):**

1. **Corregir función `getSession`** - Ya usa la tabla correcta
2. **Agregar endpoint de verificación** (nueva ruta):

```typescript
// Nuevo endpoint para verificar código
app / api / telegram / verify / route.ts;

// Flujo:
// 1. Usuario pide código desde la app
// 2. Bot envía código al chat del usuario
// 3. Usuario ingresa código en la app
// 4. App verifica y guarda el chat_id
```

3. **Mejorar vinculación automática** (línea 412-432):

```typescript
async function handleStartCommand(
  chatId: number,
  firstName?: string,
  username?: string,
): Promise<void> {
  // En lugar de auto-vincular, verificar si ya está vinculado
  const existingLink = await getUserIdByTelegramId(chatId);

  if (existingLink) {
    // Usuario ya vinculado - mostrar menú completo
    await showMainMenu(chatId, firstName);
  } else {
    // Usuario no vinculado - pedir que vincule desde la app
    await sendTelegramMessage(
      chatId,
      "Para usar el bot, vincula tu cuenta desde la app de finanzas en Configuración > Notificaciones",
    );
  }
}
```

---

### Paso 5: Configurar Webhook

**Una vez que el token esté configurado, configurar el webhook:**

```bash
# Reemplazar TU_BOT_TOKEN con el token real
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
  -d "url=https://tu-dominio.com/api/telegram?token=tu_secreto"
```

**O crear un endpoint de configuración:**

```typescript
// app/api/telegram/setup/route.ts
export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/telegram?token=${process.env.TELEGRAM_WEBHOOK_SECRET}`;

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    },
  );

  return NextResponse.json(await response.json());
}
```

---

### Paso 6: Testing y Validación

**Pruebas a realizar:**

1. ✅ Enviar `/start` al bot → Recibe mensaje de bienvenida
2. ✅ Enviar `4500 prueba` → Solicita categoría
3. ✅ Seleccionar categoría → Solicita método de pago
4. ✅ Completar flujo → Guarda transacción en Supabase
5. ✅ Enviar `/hoy` → Muestra gastos del día
6. ✅ Enviar `/saldos` → Muestra balances de cuentas

---

## 📦 Archivos a Modificar

| Archivo                                                     | Acción                           |
| ----------------------------------------------------------- | -------------------------------- |
| `.env.local`                                                | Agregar TELEGRAM_BOT_TOKEN       |
| `lib/sql/telegram_sessions.sql`                             | Crear (nuevo archivo)            |
| `app/configuracion/notificaciones/NotificationSettings.tsx` | Reescribir flujo de verificación |
| `app/api/telegram/route.ts`                                 | Mejorar manejo de vinculación    |
| `app/api/telegram/setup/route.ts`                           | Crear (nuevo - config webhook)   |

---

## ⏱️ Estimación de Trabajo

- **Paso 1:** 5 minutos (obtener token)
- **Paso 2:** 10 minutos (ejecutar SQL)
- **Paso 3:** 2-3 horas (reescribir componente React)
- **Paso 4:** 1 hora (ajustar API)
- **Paso 5:** 15 minutos (configurar webhook)
- **Paso 6:** 30 minutos (testing)

**Total: ~4-5 horas**

---

## 🚀 Comenzar Ahora

¿Quieres que proceda con la implementación? Puedo:

1. **Crear el SQL** para la tabla telegram_sessions
2. **Modificar el componente** NotificationSettings.tsx con el flujo de verificación real
3. **Actualizar la API** del bot para mejor manejo de vinculación
4. **Crear el setup** del webhook

¿Cuál paso prefieres hacer primero?
