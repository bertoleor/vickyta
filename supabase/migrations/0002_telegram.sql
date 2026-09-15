-- ============================================
-- 0002_telegram.sql
-- Telegram bot integration: sessions, messages, users, linking
-- Idempotent consolidation of lib/sql/telegram_sessions.sql and
-- lib/sql/telegram_messages.sql, coherent with 0001_vicky_initial.sql
-- ============================================

-- --------------------------------------------
-- 1. telegram_sessions (bot flow state + verification codes)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id BIGINT NOT NULL UNIQUE,
  step TEXT NOT NULL DEFAULT 'START',
  -- Expense draft state
  amount NUMERIC(12, 2),
  description TEXT,
  category_id UUID,
  category_name TEXT,
  method TEXT,
  bank TEXT,
  installments INT,
  -- Link verification code (6 digits, 10 min TTL)
  verification_code TEXT,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_sessions_chat_id
  ON telegram_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_updated
  ON telegram_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_verification
  ON telegram_sessions(verification_code) WHERE verification_code IS NOT NULL;

ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_sessions' AND policyname = 'Service role can manage sessions'
  ) THEN
    CREATE POLICY "Service role can manage sessions" ON telegram_sessions
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --------------------------------------------
-- 2. telegram_messages (inbound update log)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  user_id BIGINT,
  username TEXT,
  first_name TEXT,
  message_text TEXT,
  message_date BIGINT,
  raw_update JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_telegram_messages_status ON telegram_messages(status);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_created_at ON telegram_messages(created_at);

ALTER TABLE telegram_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_messages' AND policyname = 'Service role can manage telegram messages'
  ) THEN
    CREATE POLICY "Service role can manage telegram messages" ON telegram_messages
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --------------------------------------------
-- 3. telegram_users (link between Telegram account and auth user)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS telegram_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_users' AND policyname = 'Users can see their own telegram link'
  ) THEN
    CREATE POLICY "Users can see their own telegram link" ON telegram_users
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'telegram_users' AND policyname = 'Service role can manage telegram users'
  ) THEN
    CREATE POLICY "Service role can manage telegram users" ON telegram_users
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- --------------------------------------------
-- 4. user_preferences columns used by the linking flow
-- --------------------------------------------
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_unusual_expense BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- --------------------------------------------
-- 5. Expired session cleanup helper (call manually or via pg_cron)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM telegram_sessions
  WHERE updated_at < NOW() - INTERVAL '24 hours'
     OR (verification_code IS NOT NULL AND verification_expires_at < NOW());
END;
$$;
