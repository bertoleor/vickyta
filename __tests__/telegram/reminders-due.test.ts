/**
 * ORN-108 (F2) — reminders due selection (pure layer).
 *
 * Given "now" and the pending expenses with their reminder state, pick
 * the ones whose reminder window has arrived and was not yet sent.
 * One touch per window: night 20:30, morning 09:30 (America/Argentina).
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { selectDueReminders } from "@/lib/telegram/flow";

export interface TestPending {
  id: string;
  chat_id: number;
  amount: number;
  description: string;
  created_at: string; // ISO UTC
  status: "pendiente" | "registrado" | "descartado";
  night_sent_at: string | null;
  morning_sent_at: string | null;
}

describe("reminder due selection", () => {
  const base = {
    chat_id: 1,
    amount: 2500,
    description: "almuerzo",
    status: "pendiente" as const,
  };

  it("at 20:35 -03, a pending expense from 14:00 is due for its night reminder", () => {
    const now = new Date("2026-09-28T23:35:00.000Z"); // 20:35 -03
    const pending: TestPending[] = [
      {
        ...base,
        id: "p1",
        created_at: "2026-09-28T17:00:00.000Z", // 14:00 -03
        night_sent_at: null,
        morning_sent_at: null,
      },
    ];
    const due = selectDueReminders(pending, now);
    expect(due).toEqual([
      expect.objectContaining({ id: "p1", window: "night" }),
    ]);
  });

  it("night reminder already sent is not repeated; morning window not yet due at 20:35", () => {
    const now = new Date("2026-09-28T23:35:00.000Z"); // 20:35 -03
    const pending: TestPending[] = [
      {
        ...base,
        id: "p1",
        created_at: "2026-09-28T17:00:00.000Z",
        night_sent_at: "2026-09-28T23:30:00.000Z",
        morning_sent_at: null,
      },
    ];
    expect(selectDueReminders(pending, now)).toEqual([]);
  });

  it("at 09:35 -03 next day, still-pending expense is due for its morning reminder", () => {
    const now = new Date("2026-09-29T12:35:00.000Z"); // 09:35 -03
    const pending: TestPending[] = [
      {
        ...base,
        id: "p1",
        created_at: "2026-09-28T17:00:00.000Z",
        night_sent_at: "2026-09-28T23:30:00.000Z",
        morning_sent_at: null,
      },
    ];
    const due = selectDueReminders(pending, now);
    expect(due).toEqual([
      expect.objectContaining({ id: "p1", window: "morning" }),
    ]);
  });

  it("expense created after 20:30 only ever gets the morning reminder", () => {
    const now = new Date("2026-09-29T12:35:00.000Z"); // 09:35 -03
    const pending: TestPending[] = [
      {
        ...base,
        id: "p2",
        created_at: "2026-09-29T00:00:00.000Z", // 21:00 -03 previous day
        night_sent_at: null,
        morning_sent_at: null,
      },
    ];
    const due = selectDueReminders(pending, now);
    expect(due).toEqual([
      expect.objectContaining({ id: "p2", window: "morning" }),
    ]);
  });

  it("discarded or registered expenses never remind", () => {
    const now = new Date("2026-09-29T12:35:00.000Z");
    const pending: TestPending[] = [
      {
        ...base,
        id: "p3",
        created_at: "2026-09-28T17:00:00.000Z",
        status: "descartado",
        night_sent_at: null,
        morning_sent_at: null,
      },
      {
        ...base,
        id: "p4",
        created_at: "2026-09-28T17:00:00.000Z",
        status: "registrado",
        night_sent_at: null,
        morning_sent_at: null,
      },
    ];
    expect(selectDueReminders(pending, now)).toEqual([]);
  });

  it("outside 09:30-21:00 nothing is due (silence window)", () => {
    // 23:00 -03 on 09-28: night window (20:30) already passed but we are
    // past 21:00 -> the reminder must NOT fire (nada fuera de 09:30-21:00).
    const now = new Date("2026-09-29T02:00:00.000Z"); // 23:00 -03 on 09-28
    const pending: TestPending[] = [
      {
        ...base,
        id: "p5",
        created_at: "2026-09-28T17:00:00.000Z", // 14:00 -03
        night_sent_at: null,
        morning_sent_at: null,
      },
    ];
    expect(selectDueReminders(pending, now)).toEqual([]);
  });

  it("at 09:35 -03 with unsent night window, the MORNING copy fires (night is stale)", () => {
    // Cron was down at 20:30; at 09:35 next day the nudge must use the
    // morning window, not the stale night one.
    const now = new Date("2026-09-29T12:35:00.000Z"); // 09:35 -03
    const pending: TestPending[] = [
      {
        ...base,
        id: "p6",
        created_at: "2026-09-28T17:00:00.000Z",
        night_sent_at: null,
        morning_sent_at: null,
      },
    ];
    expect(selectDueReminders(pending, now)).toEqual([
      expect.objectContaining({ id: "p6", window: "morning" }),
    ]);
  });
});
