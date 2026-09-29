/**
 * Telegram bot flow helpers — ORN-108 (F2) "Ahora o Después".
 *
 * Pure functions extracted from app/api/telegram/route.ts so the state
 * machine can be tested without a live Supabase client:
 *  - parseExpenseMessage: "4500 verduleria" -> { amount, description }
 *  - getTimingKeyboard: Ahora/Después selector shown right after parsing
 *  - buildPendingExpenseRow: DB row for a "Después" expense
 *  - resolveReminderWindow: 20:30 same-day + 09:30 next-day (America/Argentina)
 *
 * Timezone: the owner lives in America/Argentina (-03 year-round since
 * 2024, no DST). Windows are computed in -03 and expressed in UTC.
 */

export interface ParsedExpense {
  amount: number;
  description: string;
}

/** Parse "MONTO DESCRIPCION" ("4500 verduleria", "1.500,50 almuerzo"). */
export function parseExpenseMessage(text: string): ParsedExpense | null {
  if (!text || text.length < 3) return null;

  const expensePattern = /^(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)\s+(.+)$/i;
  const match = expensePattern.exec(text);

  if (!match) return null;

  const amount = Number.parseFloat(
    match[1].replaceAll(/[.,](?=\d{3})/g, "").replaceAll(",", ".")
  );
  const description = match[2].trim();

  if (!Number.isFinite(amount) || amount <= 0) return null;

  return { amount, description };
}

/**
 * Timing selector shown after parsing an expense, per docs/spec.md:
 * "Bot pregunta: ¿Registrar gasto ahora o después?" — BEFORE category.
 */
export function getTimingKeyboard(amount: number, description: string): object {
  const formatted = amount.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  });
  return {
    inline_keyboard: [
      [
        {
          text: `✅ Ahora — $${formatted} (${description})`,
          callback_data: "pend:ahora",
        },
      ],
      [
        {
          text: "⏳ Después (te recuerdo)",
          callback_data: "pend:despues",
        },
      ],
    ],
  };
}

export interface PendingExpenseInput {
  chat_id: number;
  amount: number;
  description: string;
}

export interface PendingExpenseRow {
  chat_id: number;
  amount: number;
  description: string;
  status: "pendiente" | "registrado" | "descartado";
}

/**
 * Row for the `pending_expenses` table. A pending expense has neither
 * account nor method yet — that is why it cannot live in `transactions`
 * (account_id/method are NOT NULL there).
 */
export function buildPendingExpenseRow(
  input: PendingExpenseInput
): PendingExpenseRow {
  return {
    chat_id: input.chat_id,
    amount: input.amount,
    description: input.description,
    status: "pendiente",
  };
}

/** Offset of America/Argentina in minutes (-180, fixed since 2024). */
const AR_OFFSET_MINUTES = -180;

/** Reminder windows from docs/recordatorio-noche-pendientes.md. */
const NIGHT_HOUR = 20;
const NIGHT_MINUTE = 30;
const MORNING_HOUR = 9;
const MORNING_MINUTE = 30;

export interface ReminderWindows {
  /** 20:30 -03 of the same day; null if the expense arrives after 20:30. */
  night: Date | null;
  /** 09:30 -03 of the next day (always set). */
  morning: Date;
}

// ============================================
// REMINDERS — due selection (pure layer, ORN-108)
// ============================================

/** Pending expense as stored in the DB (reminder state included). */
export interface PendingExpenseRecord {
  id: string;
  chat_id: number;
  amount: number;
  description: string;
  created_at: string; // ISO UTC
  status: "pendiente" | "registrado" | "descartado";
  night_sent_at: string | null;
  morning_sent_at: string | null;
}

export interface DueReminder {
  id: string;
  chat_id: number;
  amount: number;
  description: string;
  window: "night" | "morning";
}

/**
 * Pick pending expenses whose reminder window has arrived and was not
 * yet sent, for the instant `now` (UTC):
 *
 *  - night:   20:30 -03 of the creation day (only if created before it)
 *  - morning: 09:30 -03 of the next day
 *  - one touch per window, only while status === "pendiente"
 *  - nothing outside 09:30–21:00 local (silence window)
 */
export function selectDueReminders(
  pending: PendingExpenseRecord[],
  now: Date
): DueReminder[] {
  const due: DueReminder[] = [];

  for (const p of pending) {
    if (p.status !== "pendiente") continue;

    const windows = resolveReminderWindow(new Date(p.created_at));

    // Silence window: reminders only fire between 09:30 and 21:00 local.
    // Anything outside that span is deferred until the morning window.
    const nowLocal = toArLocalParts(now);
    const nowLocalMinutes = nowLocal.hour * 60 + nowLocal.minute;
    const inSilenceHours =
      nowLocalMinutes < MORNING_HOUR * 60 + MORNING_MINUTE ||
      nowLocalMinutes >= 21 * 60;
    if (inSilenceHours) continue;

    // The night window is "fresh" only while it fires on its own local
    // day before 21:00; once the next local day begins, a stale unsent
    // night reminder is superseded by the morning one (prefer morning).
    const windowsNightLocal = windows.night
      ? toArLocalParts(windows.night)
      : null;
    const nightIsStale =
      windowsNightLocal !== null &&
      (nowLocal.day !== windowsNightLocal.day ||
        nowLocal.month !== windowsNightLocal.month ||
        nowLocal.year !== windowsNightLocal.year);
    const nightDue =
      windows.night !== null &&
      !p.night_sent_at &&
      windows.night.getTime() <= now.getTime() &&
      !nightIsStale;
    const morningDue =
      !p.morning_sent_at &&
      windows.morning.getTime() <= now.getTime();

    // One touch per run: prefer the night window while it is fresh, then
    // the morning one. A pending expense never gets both in one pass
    // because the morning window is 13h after the night one.
    if (nightDue) {
      due.push(toDue(p, "night"));
    } else if (morningDue) {
      due.push(toDue(p, "morning"));
    }
  }

  return due;
}

function toDue(
  p: PendingExpenseRecord,
  window: "night" | "morning"
): DueReminder {
  return {
    id: p.id,
    chat_id: p.chat_id,
    amount: p.amount,
    description: p.description,
    window,
  };
}

/**
 * Inline keyboard for a reminder message: Registrar / Descartar
 * (docs/recordatorio-noche-pendientes.md — "dos botones grandes").
 */
export function getReminderKeyboard(pendingId: string): object {
  return {
    inline_keyboard: [
      [
        { text: "✅ Registrar", callback_data: `pend:registrar:${pendingId}` },
      ],
      [
        { text: "🗑 Descartar", callback_data: `pend:descartar:${pendingId}` },
      ],
    ],
  };
}

/**
 * Reminder copy in voseo per the product note: short, one nudge.
 * "Tenés 1 gasto pendiente de hoy: $2.500 (almuerzo). ¿Lo registramos?"
 */
export function buildReminderMessage(
  amount: number,
  description: string,
  window: "night" | "morning"
): string {
  const formatted = amount.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  });
  const lead =
    window === "night"
      ? "Tenés 1 gasto pendiente de hoy"
      : "Seguís con 1 gasto pendiente de ayer";
  return `${lead}: $${formatted} (${description}). ¿Lo registramos?`;
}


/** Minimal session shape the decision layer needs. */
export interface PendSession {
  chat_id: number;
  step: string;
  amount?: number;
  description?: string;
}

export type PendAction =
  | {
      kind: "continue-now";
      amount: number;
      description: string;
    }
  | {
      kind: "store-pending";
      chat_id: number;
      amount: number;
      description: string;
    }
  | { kind: "resume-pending"; pending_id: string }
  | { kind: "discard-pending"; pending_id: string }
  | { kind: "restart" }
  | { kind: "ignore" };

/**
 * Decide what the bot should do for a `pend:*` callback_query.
 * Pure: no Supabase, no Telegram — route.ts executes the returned action.
 *
 *  - pend:ahora            -> proceed to category selection (flow Ahora)
 *  - pend:despues          -> store the expense as pending
 *  - pend:registrar:<id>   -> resume the Ahora flow for stored pending <id>
 *  - pend:descartar:<id>   -> discard stored pending <id>
 */
export function resolvePendCallback(
  data: string,
  session: PendSession
): PendAction {
  const parts = data.split(":");
  const action = parts[1] ?? "";
  const id = parts[2] ?? null;

  switch (action) {
    case "ahora": {
      if (
        typeof session.amount === "number" &&
        session.amount > 0 &&
        typeof session.description === "string" &&
        session.description.length > 0
      ) {
        return {
          kind: "continue-now",
          amount: session.amount,
          description: session.description,
        };
      }
      return { kind: "restart" };
    }
    case "despues": {
      if (
        typeof session.amount === "number" &&
        session.amount > 0 &&
        typeof session.description === "string" &&
        session.description.length > 0
      ) {
        return {
          kind: "store-pending",
          chat_id: session.chat_id,
          amount: session.amount,
          description: session.description,
        };
      }
      return { kind: "restart" };
    }
    case "registrar":
      return id ? { kind: "resume-pending", pending_id: id } : { kind: "ignore" };
    case "descartar":
      return id
        ? { kind: "discard-pending", pending_id: id }
        : { kind: "ignore" };
    default:
      return { kind: "ignore" };
  }
}


function toArLocalParts(utc: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  // local clock = UTC + offset (offset is -180min for America/Argentina):
  // 2026-09-28T00:00Z -> 2026-09-27 21:00 local, so shift BACK 3h.
  const shifted = new Date(utc.getTime() + AR_OFFSET_MINUTES * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function arLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  return new Date(
    Date.UTC(year, month, day, hour, minute) - AR_OFFSET_MINUTES * 60_000
  );
}

/**
 * Compute the two reminder windows for a pending expense created at
 * `createdAt` (UTC): 20:30 same day (skipped if already past) and 09:30
 * the next morning. One touch per window per expense, nothing outside
 * 09:30–21:00.
 */
export function resolveReminderWindow(createdAt: Date): ReminderWindows {
  const local = toArLocalParts(createdAt);

  const nightToday = arLocalToUtc(
    local.year,
    local.month,
    local.day,
    NIGHT_HOUR,
    NIGHT_MINUTE
  );
  const night = nightToday.getTime() > createdAt.getTime() ? nightToday : null;

  const nextDay = new Date(
    Date.UTC(local.year, local.month, local.day) + 24 * 3600_000
  );
  const morning = arLocalToUtc(
    nextDay.getUTCFullYear(),
    nextDay.getUTCMonth(),
    nextDay.getUTCDate(),
    MORNING_HOUR,
    MORNING_MINUTE
  );

  return { night, morning };
}
