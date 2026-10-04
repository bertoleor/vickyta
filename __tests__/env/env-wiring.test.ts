/**
 * Env wiring guard — VICKY local environment
 *
 * Goal: the app must talk to the LIVE Supabase project. History: the original
 * `.env.local` pointed at a dead project ref (404 on every token — see audit
 * 2026-09-14, Linear ORN-142), so local/dev ran against a ghost backend and
 * every DB call silently failed. `.env.local` is gitignored, which means
 * nothing in review protects it — this test is that protection.
 *
 * Rules enforced:
 *  1. `.env.local` exists (copied from `.env.example`, filled with live values).
 *  2. Every variable documented in `.env.example` is present and non-empty
 *     in `.env.local` (no placeholder values left behind).
 *  3. `NEXT_PUBLIC_SUPABASE_URL` points at the live project ref
 *     `dttxtzuwodoikidzifwk` — the only real VICKY backend — and NOT at the
 *     known dead refs (regression guard).
 *  4. The `service_role` key is never the same as the `anon` key.
 *
 * Tickets: ORN-142 (.env.local a proyecto muerto — policies ya cerradas).
 *          t_588291a4 (CI: suite era roja por diseño en GH Actions).
 *
 * Static test: parses dotenv files as text, runs anywhere, fails locally
 * the moment the env wiring drifts. `.env.local` is gitignored, so it can
 * never exist on a CI runner — GitHub Actions sets CI=true and the suite
 * skips there instead of failing red forever. Local protection is intact.
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "../..");
const ENV_LOCAL = join(ROOT, ".env.local");
const ENV_EXAMPLE = join(ROOT, ".env.example");

/** The only live VICKY Supabase project ref (verified ACTIVE_HEALTHY). */
const LIVE_REF = "dttxtzuwodoikidzifwk";
/** Dead refs this project historically pointed at — must never come back. */
const DEAD_REFS = ["xbxqhnqyybpxbbjvjjdo"];

/** Minimal dotenv parser: KEY=VALUE lines, supports quotes, skips comments. */
function parseDotenv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  const src = readFileSync(path, "utf8");
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

// GitHub Actions sets CI=true; .env.local never exists there (gitignored).
const describeLocalEnv = process.env.CI ? describe.skip : describe;

describeLocalEnv("env wiring: .env.local points at the live backend", () => {
  it(".env.local exists (copy .env.example and fill it in)", () => {
    expect(existsSync(ENV_LOCAL), "missing .env.local — copy .env.example and fill it with live values").toBe(true);
  });

  it("every documented variable in .env.example is present and non-empty", () => {
    if (!existsSync(ENV_LOCAL)) return; // covered by the test above
    const example = parseDotenv(ENV_EXAMPLE);
    const local = parseDotenv(ENV_LOCAL);
    expect(Object.keys(example).length).toBeGreaterThan(0);

    const missing: string[] = [];
    const empty: string[] = [];
    for (const key of Object.keys(example)) {
      if (!(key in local)) missing.push(key);
      else if (local[key].trim() === "" || /^<.*>$/.test(local[key].trim()))
        empty.push(key);
    }
    expect(
      missing,
      missing.length ? `missing in .env.local: ${missing.join(", ")}` : undefined,
    ).toHaveLength(0);
    expect(
      empty,
      empty.length
        ? `empty or placeholder value in .env.local: ${empty.join(", ")}`
        : undefined,
    ).toHaveLength(0);
  });

  it("NEXT_PUBLIC_SUPABASE_URL points at the live project ref", () => {
    if (!existsSync(ENV_LOCAL)) return; // covered by the test above
    const local = parseDotenv(ENV_LOCAL);
    const url = local["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
    expect(url, "NEXT_PUBLIC_SUPABASE_URL is not set").toMatch(/^https:\/\//);
    expect(
      url,
      `expected URL host to contain live ref "${LIVE_REF}", got: ${url}`,
    ).toContain(LIVE_REF);
  });

  it("never points at a dead project ref (regression: ORN-142)", () => {
    if (!existsSync(ENV_LOCAL)) return; // covered by the test above
    const local = parseDotenv(ENV_LOCAL);
    const url = local["NEXT_PUBLIC_SUPABASE_URL"] ?? "";
    for (const dead of DEAD_REFS) {
      expect(
        url.includes(dead),
        `NEXT_PUBLIC_SUPABASE_URL points at known-dead ref "${dead}" — this is the ORN-142 bug, it must stay dead`,
      ).toBe(false);
    }
  });

  it("service_role key differs from the anon key", () => {
    if (!existsSync(ENV_LOCAL)) return; // covered by the test above
    const local = parseDotenv(ENV_LOCAL);
    const anon = local["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    const service = local["SUPABASE_SERVICE_ROLE_KEY"];
    if (!anon || !service) return; // presence covered above
    expect(anon === service, "SUPABASE_SERVICE_ROLE_KEY must not equal the anon key").toBe(false);
  });
});
