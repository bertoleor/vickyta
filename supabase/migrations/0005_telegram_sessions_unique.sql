-- ============================================
-- 0005_telegram_sessions_unique.sql
-- Fix: 0002_telegram.sql declares UNIQUE(chat_id) inside CREATE TABLE IF NOT EXISTS,
-- but the table already existed in live (created by scripts/vicky-migrate.py without
-- the constraint), so the body never ran. The bot's linking flow does
-- .upsert(..., { onConflict: 'chat_id' }) (app/api/telegram/route.ts) and live
-- upserts fail with 42P10 "no unique or exclusion constraint matching the ON
-- CONFLICT specification". Detected by DBA kickoff t_d290e262 probe (2026-10-03).
-- Idempotent: only adds the constraint when missing.
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'telegram_sessions_chat_id_key'
      AND conrelid = 'telegram_sessions'::regclass
  ) THEN
    ALTER TABLE telegram_sessions
      ADD CONSTRAINT telegram_sessions_chat_id_key UNIQUE (chat_id);
  END IF;
END
$$;
