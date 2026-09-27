// Standalone RED/GREEN evidence runner for rls-coverage.test.ts assertion.
// Mirrors exactly the logic in __tests__/db/rls-coverage.test.ts (same regexes,
// same dir). Used only while vitest deps are broken in this worktree; the
// vitest run remains the canonical gate once `npm install` completes.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

function loadMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(join(MIGRATIONS_DIR, f), "utf8") }));
}

const migrations = loadMigrations();
if (migrations.length === 0) {
  console.error("FAIL: no migrations found");
  process.exit(1);
}

const tables = new Map();
const note = (name) =>
  tables.get(name) ?? tables.set(name, { rls: false, policies: 0 }).get(name);

for (const { sql } of migrations) {
  const clean = sql
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");

  const rlsRe = /ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:[\w]+\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  for (const m of clean.matchAll(rlsRe)) {
    note(m[1].toLowerCase()).rls = true;
  }

  const policyRe = /CREATE\s+POLICY\s+(?:IF\s+NOT\s+EXISTS\s+)?"[^"]+"\s+ON\s+(?:[\w]+\.)?(\w+)/gi;
  for (const m of clean.matchAll(policyRe)) {
    note(m[1].toLowerCase()).policies += 1;
  }
}

const violations = [];
for (const [table, info] of tables) {
  if (info.rls && info.policies === 0) {
    violations.push(
      `table "${table}" enables RLS but has no CREATE POLICY in any migration — ` +
      `it will silently return 0 rows to all authenticated users`,
    );
  }
}

console.log("Tables scanned:");
for (const [t, info] of tables) console.log(`  ${t}: rls=${info.rls} policies=${info.policies}`);

if (violations.length > 0) {
  console.error("RLS coverage gaps:\n  - " + violations.join("\n  - "));
  process.exit(1);
}
console.log("PASS: every RLS-enabled table has >= 1 CREATE POLICY");
