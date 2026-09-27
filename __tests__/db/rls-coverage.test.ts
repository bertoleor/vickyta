/**
 * RLS coverage guard — VICKY DB
 *
 * Goal: every table that has `ENABLE ROW LEVEL SECURITY` in our migrations
 * must also have at least one `CREATE POLICY`. Otherwise the table is
 * readable/writable by NOBODY (except service_role), which is a silent bug
 * (Supabase returns 0 rows and the UI looks "empty" instead of failing).
 *
 * Tickets: ORN-107 (F1 DB desde cero + RLS + types).
 *
 * This test is static (reads the SQL migrations as text). It runs in any
 * environment without needing a live database, and fails in CI the moment
 * someone adds a table with RLS enabled but forgets the policy.
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(__dirname, "../../supabase/migrations");

function loadMigrations(): { file: string; sql: string }[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8") }));
}

describe("RLS coverage across migrations", () => {
  it("every table with ENABLE ROW LEVEL SECURITY has >= 1 CREATE POLICY", () => {
    const migrations = loadMigrations();
    expect(migrations.length).toBeGreaterThan(0);

    // Build an aggregated view: table -> { rls: boolean, policies: number }
    const tables = new Map<string, { rls: boolean; policies: number }>();
    const note = (name: string) =>
      tables.get(name) ?? tables.set(name, { rls: false, policies: 0 }).get(name)!;

    for (const { sql } of migrations) {
      // Strip line comments to avoid matching commented-out SQL.
      const clean = sql
        .split("\n")
        .map((l) => l.replace(/--.*$/, ""))
        .join("\n");

      // Match `ALTER TABLE [IF EXISTS] [schema.]name ENABLE ROW LEVEL SECURITY;`
      const rlsRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:[\w]+\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
      for (const m of clean.matchAll(rlsRe)) {
        note(m[1].toLowerCase()).rls = true;
      }

      // Match `CREATE POLICY [IF NOT EXISTS] "<name>" ON [schema.]table ...`
      const policyRe = /CREATE\s+POLICY\s+(?:IF\s+NOT\s+EXISTS\s+)?"[^"]+"\s+ON\s+(?:[\w]+\.)?(\w+)/gi;
      for (const m of clean.matchAll(policyRe)) {
        note(m[1].toLowerCase()).policies += 1;
      }
    }

    const violations: string[] = [];
    for (const [table, info] of tables) {
      if (info.rls && info.policies === 0) {
        violations.push(
          `table "${table}" enables RLS but has no CREATE POLICY in any migration — ` +
            `it will silently return 0 rows to all authenticated users`,
        );
      }
    }

    expect(
      violations,
      violations.length
        ? `RLS coverage gaps:\n  - ${violations.join("\n  - ")}`
        : undefined,
    ).toHaveLength(0);
  });
});
