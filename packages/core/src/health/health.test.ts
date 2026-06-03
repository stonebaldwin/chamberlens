import { describe, expect, it } from "vitest";
import { detectAnomaly, type SyncRunResult } from "./index";

const base: SyncRunResult = { recordsSeen: 0, recordsNew: 0, recordsUpdated: 0, errors: [] };

describe("detectAnomaly", () => {
  it("flags an all-errors run", () => {
    const v = detectAnomaly({ ...base, errors: [{ message: "boom" }] }, 10);
    expect(v).toEqual({ anomalous: true, reason: "all-errors" });
  });

  it("flags a high error rate", () => {
    const v = detectAnomaly(
      { ...base, recordsSeen: 10, errors: Array.from({ length: 6 }, () => ({ message: "x" })) },
      10,
    );
    expect(v).toEqual({ anomalous: true, reason: "high-error-rate" });
  });

  it("flags a zero-results regression vs history", () => {
    const v = detectAnomaly({ ...base, recordsSeen: 0 }, 20);
    expect(v).toEqual({ anomalous: true, reason: "zero-results-regression" });
  });

  it("passes a healthy run", () => {
    const v = detectAnomaly({ recordsSeen: 12, recordsNew: 3, recordsUpdated: 9, errors: [] }, 10);
    expect(v.anomalous).toBe(false);
  });

  it("does not flag a first-ever run with results and no history", () => {
    const v = detectAnomaly({ recordsSeen: 4, recordsNew: 4, recordsUpdated: 0, errors: [] }, null);
    expect(v.anomalous).toBe(false);
  });
});
