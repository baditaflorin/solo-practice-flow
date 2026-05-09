import { describe, expect, it } from "vitest";
import { createInitialPracticeState, normalizePracticeState } from "./seed";
import { practiceStateSchema } from "./schemas";

describe("practice schemas", () => {
  it("accepts a valid workspace backup shape", () => {
    expect(
      practiceStateSchema.safeParse(createInitialPracticeState()).success,
    ).toBe(true);
  });

  it("rejects invalid workspace backup shapes", () => {
    expect(practiceStateSchema.safeParse({ schemaVersion: 1 }).success).toBe(
      false,
    );
  });

  it("fills Phase 2 workspace fields for older local state", () => {
    const legacy = createInitialPracticeState();
    delete (legacy as Partial<typeof legacy>).activityLog;
    delete (legacy as Partial<typeof legacy>).corrections;

    const normalized = normalizePracticeState(legacy);

    expect(normalized.activityLog).toEqual([]);
    expect(normalized.corrections.preferredPaymentTerms).toBe("Net 14");
  });
});
