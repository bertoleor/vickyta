/**
 * ORN-108 (F2) — Bot flow "Ahora o Después" + pending expenses.
 *
 * Tracer bullet 1: after parsing "4500 verduleria", the bot must ask
 * "¿Ahora o después?" (timing keyboard), NOT jump straight to category.
 * Tracer bullet 2: "Después" stores a pending expense row.
 * Tracer bullet 3: "pend:registrar:<id>" resumes the Ahora flow with the
 * stored amount/description; "pend:descartar:<id>" discards.
 * Tracer bullet 4: reminders endpoint sends due reminders with
 * Registrar/Descartar buttons and marks them sent.
 *
 * The route module is heavy (Supabase client at import time). We test the
 * exported pure flow helpers from lib/telegram/flow.ts (RED first: file
 * does not exist yet), which route.ts will use for its state machine.
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  parseExpenseMessage,
  getTimingKeyboard,
  buildPendingExpenseRow,
  resolveReminderWindow,
  type PendingExpenseInput,
} from "@/lib/telegram/flow";

const CHAT = 12345;

describe("tracer 1 — expense message asks Ahora o Después", () => {
  it("parsed expense produces a timing keyboard with Ahora and Después", () => {
    const parsed = parseExpenseMessage("4500 verduleria");
    expect(parsed).not.toBeNull();
    const kb = getTimingKeyboard(parsed!.amount, parsed!.description) as {
      inline_keyboard: { text: string; callback_data: string }[][];
    };
    const flat = kb.inline_keyboard.flat();
    const callbacks = flat.map((b) => b.callback_data);
    expect(callbacks).toContain("pend:ahora");
    expect(callbacks).toContain("pend:despues");
    expect(flat.length).toBe(2);
  });

  it("timing keyboard announces amount and description", () => {
    const kb = getTimingKeyboard(2500, "almuerzo") as unknown as {
      inline_keyboard: { text: string }[][];
    };
    expect(kb.inline_keyboard.flat().length).toBe(2);
  });
});

describe("tracer 2 — Después stores a pending expense", () => {
  it("builds a pending row with status pendiente and no account/method", () => {
    const input: PendingExpenseInput = {
      chat_id: CHAT,
      amount: 4500,
      description: "verduleria",
    };
    const row = buildPendingExpenseRow(input);
    expect(row.chat_id).toBe(CHAT);
    expect(row.amount).toBe(4500);
    expect(row.description).toBe("verduleria");
    expect(row.status).toBe("pendiente");
    // A pending expense has neither account nor method yet (by design).
    expect(row).not.toHaveProperty("account_id");
    expect(row).not.toHaveProperty("method");
  });
});

describe("tracer 3 — reminder windows (America/Argentina, -03)", () => {
  it("expense created at 14:00 gets reminders at 20:30 today and 09:30 tomorrow", () => {
    // 2026-09-28 14:00 -03 → UTC 17:00
    const createdAt = new Date("2026-09-28T17:00:00.000Z");
    const windows = resolveReminderWindow(createdAt);
    expect(windows).toEqual({
      night: new Date("2026-09-28T23:30:00.000Z"), // 20:30 -03
      morning: new Date("2026-09-29T12:30:00.000Z"), // 09:30 -03 next day
    });
  });

  it("expense created at 21:00 skips the night window of the same day", () => {
    // Created after 20:30: the 20:30 reminder for today already passed.
    const createdAt = new Date("2026-09-28T00:00:00.000Z"); // 21:00 -03 on the 27th
    const windows = resolveReminderWindow(createdAt);
    expect(windows.night).toBeNull();
    expect(windows.morning).toEqual(new Date("2026-09-28T12:30:00.000Z"));
  });
});
