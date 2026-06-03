import { describe, expect, it } from "vitest";
import { parseAssemblyAI } from "./assemblyai";
import { BudgetExceededError, BudgetGuard, InMemorySpendStore } from "./budget";
import { parseDeepgram } from "./deepgram";

describe("parseDeepgram", () => {
  it("maps utterances to ms-stamped segments", () => {
    const r = parseDeepgram({
      metadata: { duration: 120 },
      results: {
        utterances: [{ start: 1.5, end: 3.0, transcript: "Call to order", speaker: 0 }],
        channels: [{ alternatives: [{ transcript: "Call to order" }] }],
      },
    });
    expect(r.segments[0]).toEqual({
      startMs: 1500,
      endMs: 3000,
      text: "Call to order",
      speaker: "0",
    });
    expect(r.durationSeconds).toBe(120);
    expect(r.costUsd).toBeCloseTo((120 / 60) * 0.0043);
  });

  it("groups words into segments when there are no utterances", () => {
    const r = parseDeepgram({
      results: {
        channels: [
          {
            alternatives: [
              {
                transcript: "a b c",
                words: [
                  { word: "a", start: 0, end: 0.3 },
                  { word: "b", start: 0.4, end: 0.6 },
                  { word: "c", start: 10, end: 10.3 },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(r.segments).toHaveLength(2); // the 9.4s gap splits the segment
    expect(r.segments[0]?.text).toBe("a b");
  });
});

describe("parseAssemblyAI", () => {
  it("keeps ms timestamps and provider", () => {
    const r = parseAssemblyAI({
      id: "x",
      status: "completed",
      text: "hello",
      audio_duration: 60,
      utterances: [{ start: 500, end: 1500, text: "hello", speaker: "A" }],
    });
    expect(r.segments[0]?.startMs).toBe(500);
    expect(r.provider).toBe("assemblyai");
    expect(r.costUsd).toBeCloseTo((60 / 60) * 0.0025);
  });
});

describe("BudgetGuard", () => {
  const now = () => new Date("2026-06-15T00:00:00Z");

  it("throws when a charge would exceed the monthly cap", async () => {
    const store = new InMemorySpendStore();
    await store.addSpendUsd("2026-06", 49);
    const guard = new BudgetGuard({ monthlyCapUsd: 50, store, now });
    await expect(guard.assertCanSpend(2)).rejects.toBeInstanceOf(BudgetExceededError);
    await expect(guard.assertCanSpend(0.5)).resolves.toBeUndefined();
  });

  it("fires onWarn past the warn fraction", async () => {
    const store = new InMemorySpendStore();
    await store.addSpendUsd("2026-06", 40);
    let warned = 0;
    const guard = new BudgetGuard({
      monthlyCapUsd: 50,
      store,
      warnAtFraction: 0.8,
      onWarn: () => {
        warned += 1;
      },
      now,
    });
    await guard.assertCanSpend(2); // 42/50 = 0.84 ≥ 0.8
    expect(warned).toBe(1);
  });
});
