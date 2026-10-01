-- Migration 0004: pending_expenses (ORN-108 T1)
--
-- Ahora/Después flow: "después" expenses live here until the user registers
-- or discards them via Telegram inline buttons. Reminders scan this table
-- for pending rows whose reminder window has arrived.
--
-- Design notes:
--  - NOT in `transactions`: pending expenses have neither account_id nor
--    method yet, and transactions has NOT NULL on both. Own table keeps
--    `transactions` invariants honest.
--  - RLS: service_role ONLY (bot runs as service role; bot bypasses auth
--    uid by design — see docs/bot-telegram.md).
--  - Partial index on (chat_id) WHERE status='pendiente': reminder scan
--    picks pending rows per chat; also backstop for the in-flow dedupe
--    guard (one active pending per chat is enforced in code, index keeps
--    lookups O(log n) as chats accumulate history).

BEGIN;

CREATE TABLE IF NOT EXISTS pending_expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         BIGINT NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'registrado', 'descartado')),
  night_sent_at   TIMESTAMPTZ,
  morning_sent_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminders scan: pending rows per chat, without scanning discarded/registered history.
CREATE INDEX IF NOT EXISTS pending_expenses_pending_per_chat
  ON pending_expenses (chat_id)
  WHERE status = 'pendiente';

-- updated_at maintenance (same shape as 0002_telegram.sql trigger).
CREATE OR REPLACE FUNCTION pending_expenses_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pending_expenses_touch ON pending_expenses;
CREATE TRIGGER pending_expenses_touch
  BEFORE UPDATE ON pending_expenses
  FOR EACH ROW
  EXECUTE FUNCTION pending_expenses_touch_updated_at();

-- RLS: table locked down by default, bot reaches it via service_role only.
ALTER TABLE pending_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending_expenses_service_role"
  ON pending_expenses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
