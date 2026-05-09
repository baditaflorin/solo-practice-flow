import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { analyzeIntake } from "./inference";

const fixturesDir = join(process.cwd(), "test/fixtures/realdata");

describe("intake inference performance", () => {
  it("stays inside the Phase 2 paste-to-preview budget", () => {
    const measurements = readdirSync(fixturesDir)
      .filter((file) => !file.endsWith(".expected.json"))
      .sort()
      .map((file) => {
        const input = readFileSync(join(fixturesDir, file), "utf8");
        const start = performance.now();
        analyzeIntake(input);
        return performance.now() - start;
      })
      .sort((a, b) => a - b);

    const median = measurements[Math.floor(measurements.length / 2)] ?? 0;
    const worst = measurements.at(-1) ?? 0;

    expect(median).toBeLessThan(1000);
    expect(worst).toBeLessThan(1000);
  });
});
