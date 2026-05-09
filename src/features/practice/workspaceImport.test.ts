import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
import { parseWorkspaceBackup } from "./workspaceImport";

describe("workspace import", () => {
  it("restores the current provenance envelope", () => {
    const state = createInitialPracticeState();
    const parsed = parseWorkspaceBackup(
      JSON.stringify({
        provenance: {
          app_version: "0.2.0",
          commit: "unit",
          schema_version: state.schemaVersion,
          generated_at: state.updatedAt,
          source_id: "unit-test",
          parameters: { leads: state.leads.length },
        },
        state,
      }),
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    expect(parsed.value.sourceId).toBe("unit-test");
    expect(parsed.value.state.leads[0]?.company).toBe("Northstar Operations");
  });

  it("restores legacy raw practice state JSON", () => {
    const state = createInitialPracticeState();
    const parsed = parseWorkspaceBackup(JSON.stringify(state));

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error(parsed.message);
    }
    expect(parsed.value.sourceId).toBe("legacy-state-json");
  });

  it("rejects malformed JSON with an actionable message", () => {
    const parsed = parseWorkspaceBackup("{not json");

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("Expected malformed JSON to fail");
    }
    expect(parsed.detail).toContain("not valid JSON");
  });

  it("rejects structurally invalid workspace JSON", () => {
    const parsed = parseWorkspaceBackup(JSON.stringify({ schemaVersion: 1 }));

    expect(parsed.ok).toBe(false);
    if (parsed.ok) {
      throw new Error("Expected invalid state JSON to fail");
    }
    expect(parsed.detail).toContain("recognizable workspace state");
  });
});
