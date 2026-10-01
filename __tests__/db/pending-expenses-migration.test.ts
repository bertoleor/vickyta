/**
 * Migration contract test — 0004_pending_expenses.sql (ORN-108 T1)
 *
 * The bot flow "ahora o después" stores "después" expenses in a
 * `pending_expenses` table (see docs/bot-telegram.md and
 * lib/telegram/flow.ts — buildPendingExpenseRow). The pure layer and the
 * PendingExpense type already exist; the table itself is the missing piece.
 *
 * This test is static (reads the SQL migration as text), so it runs in CI
 * without a live database. It pins the schema contract the bot code and
 * database.types.ts already rely on:
 *  - table exists in migration 0004
 *  - columns required by the flow + reminder windows
 *  - status CHECK constraint with the three states used in code
 *  - RLS enabled AND a service_role policy (rls-coverage guard requirement)
 *  - partial index on pending rows (reminders scan; dedupe guard)
 *
 * TDD (strict): this file was written RED first — see the run log in the
 * commit message (migration 0004 absent at RED time).
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(__dirname, "../../supabase/migrations");
const FILE = "0004_pending_expenses.sql";

function readMigration(): string {
  const path = join(MIGRATIONS_DIR, FILE);
  if (!existsSync(path)) {
    throw new Error(`missing migration: ${FILE}`);
  }
  return readFileSync(path, "utf8");
}

describe("0004_pending_expenses migration contract", () => {
  const sql = readMigration();

  it("creates the pending_expenses table idempotently", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS\s+pending_expenses/i);
  });

  it("has the columns the bot flow and reminders need", () => {
    for (const col of [
      "id",
      "chat_id",
      "amount",
      "description",
      "status",
      "night_sent_at",
      "morning_sent_at",
      "created_at",
      "updated_at",
    ]) {
      expect(sql).toMatch(new RegExp(`\\b${col}\\b`));
    }
  });

  it("status CHECK admits exactly the three states used in code", () => {
    expect(sql).toMatch(
      /CHECK\s*\(\s*status\s+IN\s*\(\s*'pendiente'\s*,\s*'registrado'\s*,\s*'descartado'\s*\)\s*\)/i,
    );
  });

  it("enables RLS and creates a service_role policy (rls-coverage)", () => {
    expect(sql).toMatch(
      /ALTER TABLE\s+(?:IF EXISTS\s+)?pending_expenses\s+ENABLE ROW LEVEL SECURITY/i,
    );
    expect(sql).toMatch(
      /CREATE POLICY\s+"[^"]+"\s+ON\s+pending_expenses/i,
    );
    expect(sql).toMatch(/TO\s+service_role/i);
  });

  it("index for the reminders scan: pending rows per chat", () => {
    expect(sql).toMatch(
      /CREATE INDEX IF NOT EXISTS\s+\w+\s+ON\s+pending_expenses\s*\(\s*chat_id\s*\)\s+WHERE\s+status\s*=\s*'pendiente'/i,
    );
  });

  it("has a matching down migration", () => {
    const down = join(MIGRATIONS_DIR, "0004_pending_expenses.down.sql");
    expect(existsSync(down), "down migration must exist").toBe(true);
    const downSql = readFileSync(down, "utf8");
    expect(downSql).toMatch(/DROP TABLE IF EXISTS pending_expenses/i);
  });
});
