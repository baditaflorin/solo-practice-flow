import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
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
});
