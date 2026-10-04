-- Down migration 0005: telegram_sessions UNIQUE(chat_id)
-- Reverses 0005_telegram_sessions_unique.sql. Safe to re-run (IF EXISTS throughout).
-- WARNING: dropping this constraint re-breaks the bot's linking upsert
-- (.upsert onConflict 'chat_id' -> 42P10). Only run if the 0002 schema is
-- being reverted as well.

BEGIN;

ALTER TABLE telegram_sessions
  DROP CONSTRAINT IF EXISTS telegram_sessions_chat_id_key;

COMMIT;
