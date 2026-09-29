/**
 * ORN-108 (F2) — pend:* callback routing (pure decision layer).
 *
 * The route.ts callback handler stays thin: it delegates the decision of
 * WHAT to do for each `pend:*` callback to `resolvePendCallback`, which
 * returns the next bot action without touching Supabase or Telegram.
 * route.ts only executes the returned action. This keeps the state
 * machine testable in isolation (RED first: function does not exist).
 */
// @vitest-environment node
import { describe, expect, it } from "vitest";
import { resolvePendCallback } from "@/lib/telegram/flow";

describe("pend callback routing", () => {
  it("pend:ahora with active session -> continue to CATEGORY selection", () => {
    const action = resolvePendCallback("pend:ahora", {
      chat_id: 1,
      step: "TIMING",
      amount: 4500,
      description: "verduleria",
    });
    expect(action).toEqual({
      kind: "continue-now",
      amount: 4500,
      description: "verduleria",
    });
  });

  it("pend:despues with active session -> store pending expense", () => {
    const action = resolvePendCallback("pend:despues", {
      chat_id: 1,
      step: "TIMING",
      amount: 2500,
      description: "almuerzo",
    });
    expect(action).toEqual({
      kind: "store-pending",
      chat_id: 1,
      amount: 2500,
      description: "almuerzo",
    });
  });

  it("pend:registrar:<id> -> resume Ahora flow with stored amount/description", () => {
    const action = resolvePendCallback("pend:registrar:abc-123", {
      chat_id: 1,
      step: "COMPLETE",
    });
    expect(action).toEqual({
      kind: "resume-pending",
      pending_id: "abc-123",
    });
  });

  it("pend:descartar:<id> -> mark pending expense discarded", () => {
    const action = resolvePendCallback("pend:descartar:abc-123", {
      chat_id: 1,
      step: "COMPLETE",
    });
    expect(action).toEqual({ kind: "discard-pending", pending_id: "abc-123" });
  });

  it("pend:ahora without an amount in session -> restart flow (ask expense)", () => {
    const action = resolvePendCallback("pend:ahora", {
      chat_id: 1,
      step: "START",
    });
    expect(action).toEqual({ kind: "restart" });
  });

  it("unknown pend callback -> ignored gracefully", () => {
    const action = resolvePendCallback("pend:what:is:this", {
      chat_id: 1,
      step: "START",
    });
    expect(action).toEqual({ kind: "ignore" });
  });
});
