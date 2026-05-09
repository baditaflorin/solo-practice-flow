import { describe, expect, it } from "vitest";
import {
  decodeShareHash,
  detectIntakeFormat,
  encodeShareText,
  formatLoadedIntakeFiles,
  maxShareTextBytes,
} from "./io";

describe("practice IO helpers", () => {
  it("detects common real-user intake formats", () => {
    expect(detectIntakeFormat("name,email\nAvery,a@example.com").kind).toBe(
      "csv",
    );
    expect(detectIntakeFormat("<html><body>RFP</body></html>").kind).toBe(
      "html",
    );
    expect(detectIntakeFormat("# Discovery notes\n- scope").kind).toBe(
      "markdown",
    );
  });

  it("combines multi-file intake with visible boundaries", () => {
    const result = formatLoadedIntakeFiles([
      {
        name: "email.txt",
        type: "text/plain",
        size: 22,
        text: "Need proposal",
      },
      {
        name: "budget.csv",
        type: "text/csv",
        size: 19,
        text: "name,budget\nAtlas,8400",
      },
    ]);

    expect(result.ok).toBe(true);
    expect(result.value?.text).toContain("--- email.txt");
    expect(result.value?.text).toContain("--- budget.csv");
  });

  it("round-trips share hash payloads", () => {
    const encoded = encodeShareText("Need proposal for Iași office");
    expect(encoded.ok).toBe(true);

    const decoded = decodeShareHash(`#intake=${encoded.value}`);
    expect(decoded.value).toBe("Need proposal for Iași office");
  });

  it("refuses oversized share payloads", () => {
    const encoded = encodeShareText("x".repeat(maxShareTextBytes + 1));
    expect(encoded.ok).toBe(false);
    expect(encoded.message).toContain("too large");
  });
});
