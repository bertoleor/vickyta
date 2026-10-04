/**
 * Login rate limiter unit tests — VICKY (t_cdb1bc45, P3 hardening).
 *
 * Defecto: la action de login (lib/auth/actions.ts) no tenía límite de
 * intentos ni lockout → el PIN numérico (hasta 6 dígitos) era brute-forceable
 * sin freno desde el endpoint.
 *
 * Diseño del limiter (lib/auth/rate-limit.ts):
 *  - contador en memoria, module-level en el proceso de Next (app de una
 *    sola instancia — documentado en el código).
 *  - key = email mapeado cuando el username es conocido (los 3 aliases
 *    'vicky'/'vickyta'/'mama' comparten bucket); username crudo si es
 *    desconocido (user-spray no bloquea a la usuaria real).
 *  - 5 fallas → lockout progresivo: 1 min, luego duplica hasta 15 min.
 *  - ventana de decaimiento 15 min: fallas viejas expiran.
 *  - éxito limpia el contador.
 *  - UX: mensaje claro en voseo, sin cambios de PIN ni flujo (usuaria mayor).
 *
 * Ticket: t_cdb1bc45. Related: t_5bfcd0ed.
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LoginRateLimiter } from "@/lib/auth/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

function makeLimiter(now = 1_000_000) {
  const limiter = new LoginRateLimiter({ now: () => now });
  return { limiter, tick: (ms: number) => (now += ms) };
}

describe("LoginRateLimiter — bloqueo tras N fallas", () => {
  it("permite hasta MAX_ATTEMPTS (5) intentos fallidos", () => {
    const { limiter } = makeLimiter();
    for (let i = 0; i < 5; i++) {
      const d = limiter.check("user@test");
      expect(d.blocked).toBe(false);
      limiter.recordFailure("user@test");
    }
    // 6º intento: bloqueado
    const d6 = limiter.check("user@test");
    expect(d6.blocked).toBe(true);
  });

  it("el mensaje de bloqueo es claro y en voseo, con minutos restantes", () => {
    const { limiter } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("user@test");
    const d = limiter.check("user@test");
    expect(d.blocked).toBe(true);
    expect(d.message).toMatch(/esperá/i);
    expect(d.message).toMatch(/minuto/);
    expect(d.retryAfterMs).toBeGreaterThan(0);
  });

  it("lockout progresivo: cada falla durante el lockout duplica el castigo (cap 15 min)", () => {
    const { limiter, tick } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("user@test");
    const first = limiter.check("user@test").retryAfterMs;
    expect(first).toBe(60 * 1000); // 1 min

    // falla durante lockout → 2 min
    limiter.recordFailure("user@test");
    expect(limiter.check("user@test").retryAfterMs).toBe(2 * 60 * 1000);

    limiter.recordFailure("user@test");
    expect(limiter.check("user@test").retryAfterMs).toBe(4 * 60 * 1000);

    limiter.recordFailure("user@test");
    limiter.recordFailure("user@test");
    limiter.recordFailure("user@test");
    expect(limiter.check("user@test").retryAfterMs).toBe(15 * 60 * 1000); // cap
  });

  it("la falla durante lockout reinicia el reloj del lockout actual", () => {
    const { limiter, tick } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("user@test");
    tick(30 * 1000); // 30s del lockout de 1 min
    limiter.recordFailure("user@test"); // extiende
    const d = limiter.check("user@test");
    expect(d.retryAfterMs).toBe(2 * 60 * 1000); // full 2 min desde ahora
  });

  it("el bloqueo expira: pasado el lockout se puede reintentar", () => {
    const { limiter, tick } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("user@test");
    tick(61 * 1000); // lockout de 1 min vencido
    expect(limiter.check("user@test").blocked).toBe(false);
  });

  it("éxito limpia el contador", () => {
    const { limiter } = makeLimiter();
    for (let i = 0; i < 4; i++) limiter.recordFailure("user@test");
    limiter.recordSuccess("user@test");
    for (let i = 0; i < 4; i++) limiter.recordFailure("user@test");
    expect(limiter.check("user@test").blocked).toBe(false); // 8 fallas totales pero reset intermedio
  });

  it("fallas decaen tras la ventana (15 min sin actividad)", () => {
    const { limiter, tick } = makeLimiter();
    for (let i = 0; i < 4; i++) limiter.recordFailure("user@test");
    tick(WINDOW_MS + 1000);
    expect(limiter.check("user@test").blocked).toBe(false);
    limiter.recordFailure("user@test"); // 5ª falla pero contadores vencidos
    expect(limiter.check("user@test").blocked).toBe(false);
  });

  it("buckets independientes por key", () => {
    const { limiter } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("a@test");
    expect(limiter.check("a@test").blocked).toBe(true);
    expect(limiter.check("b@test").blocked).toBe(false);
  });

  it("decision sin blockeo no registra nada (check ≠ recordFailure)", () => {
    const { limiter } = makeLimiter();
    for (let i = 0; i < 20; i++) limiter.check("user@test");
    expect(limiter.check("user@test").blocked).toBe(false);
  });
});

describe("LoginRateLimiter — formato de minutos para el mensaje", () => {
  it("menos de un minuto redondea a 'menos de 1 minuto'", () => {
    const { limiter, tick } = makeLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("user@test");
    tick(45 * 1000);
    expect(limiter.check("user@test").message).toMatch(/menos de 1 minuto/i);
  });
});
