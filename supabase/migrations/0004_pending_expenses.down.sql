-- Down migration 0004: pending_expenses
--
-- Reverses 0004_pending_expenses.sql. Drops trigger, function, index, policy
-- and table. Safe to re-run (IF EXISTS throughout).

BEGIN;

DROP TRIGGER IF EXISTS pending_expenses_touch ON pending_expenses;
DROP FUNCTION IF EXISTS pending_expenses_touch_updated_at();
DROP INDEX IF EXISTS pending_expenses_pending_per_chat;
DROP POLICY IF EXISTS "pending_expenses_service_role" ON pending_expenses;
DROP TABLE IF EXISTS pending_expenses;

COMMIT;
