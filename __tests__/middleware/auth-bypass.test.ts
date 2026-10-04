/**
 * Middleware auth-bypass tests — VICKY (t_cdb1bc45, P3 hardening).
 *
 * Defecto (auditoría t_5bfcd0ed): BYPASS_ROUTES se evaluaba con
 * `pathname.startsWith(route)` → cualquier path que arrancara con un prefijo
 * bypass heredaba el bypass de auth sin ser el recurso legítimo
 * (ej. `/api/telegramX`, `/iconsX`). PUBLIC_ROUTES tenía el mismo defecto
 * de clase (`/loginX` público sin ser `/login`).
 *
 * Fix: comparación por segmento exacto — `pathname === route` o
 * `pathname.startsWith(route + '/')`. `/api/telegram/verify` es una subruta
 * REAL (app/api/telegram/verify/route.ts) y debe seguir en bypass.
 *
 * Ticket: t_cdb1bc45 — https://linear.app/ornellita/ Orn...
 * Related: t_5bfcd0ed (kickoff auditoría VICKY 2026-10-03).
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "@/middleware";

const ORIGIN = "http://localhost:3000";

function req(pathname: string, cookies: Record<string, string> = {}) {
  return new NextRequest(ORIGIN + pathname, { headers: { cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ") } });
}

/** Cookie de sesión Supabase válida a efectos del middleware. */
const AUTH_COOKIE = { "sb-xxx-auth-token": "token" };

describe("middleware: BYPASS_ROUTES segmento exacto", () => {
  it("rutas bypass exactas siguen sin requerir auth", () => {
    for (const p of ["/api/telegram", "/api/telegram/verify", "/_next/static/chunk.js", "/icons/icon.png", "/manifest.json"]) {
      const res = middleware(req(p));
      expect(res.status).toBe(200);
    }
  });

  it("path con prefijo pero segmento distinto YA NO bypassea (/api/telegramX)", () => {
    const res = middleware(req("/api/telegramX"));
    // Sin cookie de auth → debe redirigir a /login, no dejar pasar
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("prefijo malicioso sobre otros bypass: /iconsX, /manifest.json.mal", () => {
    for (const p of ["/iconsX", "/manifest.json.mal", "/_nextX"]) {
      const res = middleware(req(p));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    }
  });

  it("rutas privadas sin auth siguen redirigiendo a /login", () => {
    for (const p of ["/", "/gastos", "/historial"]) {
      const res = middleware(req(p));
      expect(res.status).toBe(307);
      expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
    }
  });

  it("con cookie de sesión, /api/telegramX pasa (bypass apagado ≠ bloqueo)", () => {
    const res = middleware(req("/api/telegramX", AUTH_COOKIE));
    expect(res.status).toBe(200);
  });

  it("matcher excluye _next/static y favicon del middleware", () => {
    expect(config.matcher).toContain("/((?!_next/static|_next/image|favicon.ico).*)");
  });
});

describe("middleware: PUBLIC_ROUTES segmento exacto", () => {
  it("/login y /auth/callback son públicos sin auth", () => {
    for (const p of ["/login", "/auth/callback"]) {
      const res = middleware(req(p));
      expect(res.status).toBe(200);
    }
  });

  it("/loginX ya no es público (mismo defecto de clase)", () => {
    const res = middleware(req("/loginX"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  it("/auth/callback con session previa en querystring no rompe el bypass público", () => {
    // regresión suave: el login real redirige con query, sigue siendo la ruta pública
    const res = middleware(req("/auth/callback?code=abc"));
    expect(res.status).toBe(200);
  });

  it("con auth, /login redirige al dashboard", () => {
    const res = middleware(req("/login", AUTH_COOKIE));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");
  });
});
