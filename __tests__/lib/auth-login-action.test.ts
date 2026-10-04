/**
 * Login action rate-limit integration tests — VICKY (t_cdb1bc45, P3 hardening).
 *
 * Cablea el rate-limiter real (lib/auth/rate-limit.ts) a la action login:
 * tras 5 intentos fallidos la action debe responder error en voseo y NI
 * SIQUIERA llamar a Supabase (fail-closed en lockout). El mock de Supabase
 * simula signInWithPassword rechazando cualquier PIN ≠ '1234'.
 *
 * Nota UX: no se cambia el flujo PIN de la usuaria mayor (ticket explícito).
 *
 * Ticket: t_cdb1bc45. Related: t_5bfcd0ed.
 */
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// —— Mocks (hoisted por vi.mock antes de importar la action) ———————
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) =>
        password === "1234" ? { data: { user: { id: "u1", email } }, error: null } : { data: { user: null }, error: { message: "Invalid credentials" } }
      ),
      signOut: vi.fn(async () => {}),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    },
  })),
}));

const redirectMock = vi.hoisted(() => vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { login } from "@/lib/auth/actions";
import { resetLoginRateLimiter } from "@/lib/auth/rate-limit";

function form(username: string, pin: string): FormData {
  const fd = new FormData();
  fd.append("username", username);
  fd.append("pin", pin);
  return fd;
}

describe("login action: rate-limit de fuerza bruta (PIN)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLoginRateLimiter();
  });

  it("PIN correcto hace login (fixture), redirect a /", async () => {
    await expect(login(form("vickyta", "1234"))).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("5 PINs incorrectos → 6º intento bloqueado con mensaje en voseo, sin llamar a Supabase", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await login(form("vickyta", "0000"));
      expect(r?.error).toBe("Credenciales incorrectas");
    }
    const r6 = await login(form("vickyta", "1234")); // ¡el PIN CORRECTO!
    expect(r6?.error).toMatch(/esperá/i);
    expect(r6?.error).not.toBe("Credenciales incorrectas");
  });

  it("los 3 aliases comparten bucket (mismo email mapeado)", async () => {
    for (let i = 0; i < 3; i++) await login(form("vicky", "0000"));
    for (let i = 0; i < 2; i++) await login(form("vickyta", "0000"));
    const r = await login(form("mama", "1234")); // PIN correcto pero bucket saturado
    expect(r?.error).toMatch(/esperá/i);
  });

  it("en lockout NO llama a Supabase (fail-closed)", async () => {
    for (let i = 0; i < 5; i++) await login(form("vickyta", "0000"));
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockClear();
    await login(form("vickyta", "1234"));
    expect(createClient).not.toHaveBeenCalled();
  });

  it("username desconocido no satura el bucket de la usuaria real", async () => {
    for (let i = 0; i < 10; i++) {
      const r = await login(form("intruso", "9999"));
      expect(r?.error).toBe("Credenciales incorrectas");
    }
    // la usuaria real sigue libre: su PIN correcto loguea
    await expect(login(form("vickyta", "1234"))).rejects.toThrow("NEXT_REDIRECT");
  });

  it("login exitoso limpia el contador de la usuaria", async () => {
    for (let i = 0; i < 4; i++) await login(form("vickyta", "0000"));
    await expect(login(form("vickyta", "1234"))).rejects.toThrow("NEXT_REDIRECT"); // éxito → reset
    // 4 fallas más siguen permitidas (contador reseteado por el éxito)
    for (let i = 0; i < 4; i++) {
      const r = await login(form("vickyta", "0000"));
      expect(r?.error).toBe("Credenciales incorrectas");
    }
    // 5ª caída bloquea la 6ª… pero el PIN correcto tras 4 fallas aún loguea
    await expect(login(form("vickyta", "1234"))).rejects.toThrow("NEXT_REDIRECT");
  });
});
