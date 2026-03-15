-- ============================================
-- TELEGRAM SESSIONS TABLE
-- ============================================
-- Esta tabla almacena las sesiones activas del bot de Telegram
-- Permite mantener el estado durante el flujo de registro de gastos

-- Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL,
  step TEXT NOT NULL DEFAULT 'START',
  
  -- Datos del gasto que se va construyendo
  amount DECIMAL(12, 2),
  description TEXT,
  category_id UUID,
  category_name TEXT,
  method TEXT,
  bank TEXT,
  installments INT,
  
  -- Código de verificación (para vincular cuenta)
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_chat_id 
  ON telegram_sessions(chat_id);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_updated 
  ON telegram_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_verification 
  ON telegram_sessions(verification_code) 
  WHERE verification_code IS NOT NULL;

-- Habilitar RLS
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: solo servicio puede acceder (para el API del bot)
CREATE POLICY "Service role can manage sessions" ON telegram_sessions
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- ============================================
-- FUNCIÓN PARA LIMPIAR SESIONES ANTIGUAS
-- ============================================
-- Elimina sesiones que no se han actualizado en más de 24 horas
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM telegram_sessions 
  WHERE updated_at < NOW() - INTERVAL '24 hours'
    OR (verification_code IS NOT NULL 
        AND verification_expires_at < NOW());
END;
$$;

-- Crear job de limpieza (opcional - ejecutar manualmente o con pg_cron)
-- SELECT cleanup_old_sessions();

-- ============================================
-- NOTA IMPORTANTE:
-- ============================================
-- Ejecutar este SQL en el SQL Editor de Supabase
-- Después de ejecutar, la tabla estará lista para uso del bot
