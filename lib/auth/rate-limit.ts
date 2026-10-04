/**
 * Login rate limiter — in-memory, per-identity buckets with progressive lockout.
 *
 * WHY THIS EXISTS (t_cdb1bc45, P3 hardening — audit t_5bfcd0ed): the login
 * action signs in with a numeric PIN as the Supabase password. Without any
 * attempt limit, that PIN was brute-forceable without friction. Design
 * constraints from the ticket:
 *   - NO UX changes for the elderly user: same PIN flow, same form, only a
 *     clear voseo error message when locked out.
 *   - In-memory counter (single Next.js process — documented limitation, see
 *     LIMITS below), NOT a new DB table or external dependency.
 *
 * DESIGN
 *   - Identity key = mapped email when the username is known (the three
 *     aliases 'vicky'/'vickyta'/'mama' map to one email, so they share one
 *     bucket); raw username otherwise (attacker spraying unknown usernames
 *     cannot lock out the real user by exhausting a shared bucket).
 *   - MAX_ATTEMPTS (5) failed attempts → lockout. Each failure during the
 *     lockout doubles the remaining penalty, capped at MAX_LOCKOUT_MS.
 *   - Failures decay: any entry older than WINDOW_MS (15 min) is dropped.
 *   - Success resets the bucket entirely.
 *   - `check()` never mutates — decide first, then record.
 *
 * LIMITS (accepted, ticket scope): in-memory per process. A restart wipes
 * counters and multi-instance deployments would need a shared store. VICKY
 * is a single-user, single-instance PWA — acceptable here; swap the Map for
 * Upstash/Redis if that ever changes.
 */

export interface RateLimitOptions {
  /** Injected clock — tests pass a mutable `now`. */
  now?: () => number;
  /** Failed attempts before lockout (default 5). */
  maxAttempts?: number;
  /** Base lockout penalty for the first lockout (default 60s). */
  baseLockoutMs?: number;
  /** Upper bound of the progressive lockout (default 15 min). */
  maxLockoutMs?: number;
  /** How long a failure is remembered (default 15 min). */
  windowMs?: number;
}

export interface RateLimitDecision {
  blocked: boolean;
  /** Milliseconds until the lockout ends (0 when not blocked). */
  retryAfterMs: number;
  /** Human message in voseo (only meaningful when blocked). */
  message: string;
}

interface Bucket {
  /** Timestamps (ms) of failed attempts inside the window. */
  failures: number[];
  /** Lockout started at (ms) — null when not locked. */
  lockedAt: number | null;
  /** Current lockout duration (ms), doubling on repeat offences. */
  lockoutMs: number;
}

const DEFAULTS = {
  maxAttempts: 5,
  baseLockoutMs: 60_000,
  maxLockoutMs: 15 * 60_000,
  windowMs: 15 * 60_000,
} as const;

function minutesLeft(retryAfterMs: number): string {
  const mins = Math.ceil(retryAfterMs / 60_000);
  return mins <= 1 ? "menos de 1 minuto" : `${mins} minutos`;
}

export class LoginRateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly now: () => number;
  private readonly maxAttempts: number;
  private readonly baseLockoutMs: number;
  private readonly maxLockoutMs: number;
  private readonly windowMs: number;

  constructor(options: RateLimitOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.maxAttempts = options.maxAttempts ?? DEFAULTS.maxAttempts;
    this.baseLockoutMs = options.baseLockoutMs ?? DEFAULTS.baseLockoutMs;
    this.maxLockoutMs = options.maxLockoutMs ?? DEFAULTS.maxLockoutMs;
    this.windowMs = options.windowMs ?? DEFAULTS.windowMs;
  }

  /** Decide without mutating: may the identity attempt a login right now? */
  check(key: string): RateLimitDecision {
    const bucket = this.buckets.get(key);
    const now = this.now();
    if (!bucket) return { blocked: false, retryAfterMs: 0, message: "" };

    // Expired lockout → drop it (failures keep counting until window decay).
    if (bucket.lockedAt !== null && now - bucket.lockedAt >= bucket.lockoutMs) {
      bucket.lockedAt = null;
      bucket.lockoutMs = 0;
    }

    if (bucket.lockedAt !== null) {
      const retryAfterMs = bucket.lockoutMs - (now - bucket.lockedAt);
      if (retryAfterMs > 0) {
        return {
          blocked: true,
          retryAfterMs,
          message: `Demasiados intentos fallidos. Esperá ${minutesLeft(retryAfterMs)} y volvé a probar.`,
        };
      }
    }

    return { blocked: false, retryAfterMs: 0, message: "" };
  }

  /** Record a failed attempt (call AFTER `check` allowed it). */
  recordFailure(key: string): void {
    const now = this.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { failures: [], lockedAt: null, lockoutMs: 0 };
      this.buckets.set(key, bucket);
    }

    // Decay: drop failures older than the window.
    bucket.failures = bucket.failures.filter((t) => now - t < this.windowMs);

    // A failure during an active lockout extends it: re-lock from NOW with
    // double the previous penalty (progressive, capped).
    if (bucket.lockedAt !== null) {
      bucket.lockoutMs = Math.min(bucket.lockoutMs * 2, this.maxLockoutMs);
      bucket.lockedAt = now;
      bucket.failures.push(now);
      return;
    }

    bucket.failures.push(now);
    if (bucket.failures.length >= this.maxAttempts) {
      bucket.lockedAt = now;
      bucket.lockoutMs = this.baseLockoutMs;
    }
  }

  /** Successful login — wipe the identity's history. */
  recordSuccess(key: string): void {
    this.buckets.delete(key);
  }

  /** Test hook: wipe every bucket (module singletons reset between suites). */
  reset(): void {
    this.buckets.clear();
  }
}

/** Module-level singleton used by the login action. */
export const loginRateLimiter = new LoginRateLimiter();

/** Test-only helper wired from the integration tests (resets singleton). */
export function resetLoginRateLimiter(): void {
  loginRateLimiter.reset();
}
