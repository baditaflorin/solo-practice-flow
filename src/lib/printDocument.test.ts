import { describe, expect, it } from "vitest";
import { markdownToPrintableHtml } from "./printDocument";

describe("print document", () => {
  it("escapes markdown before writing printable HTML", () => {
    const html = markdownToPrintableHtml(
      "Proposal <draft>",
      "# Scope\n<script>alert('x')</script>",
    );

    expect(html).toContain("Proposal &lt;draft&gt;");
    expect(html).toContain("&lt;script&gt;alert(&#039;x&#039;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});
