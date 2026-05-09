import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { analyzeIntake } from "./inference";

interface ExpectedFixture {
  kind: string;
  leadCount?: number;
  confidenceAtLeast: number;
  requiredAnomalies: string[];
  lead?: {
    name?: string;
    company?: string;
    email?: string;
    source?: string;
    budgetMin?: number;
    budgetMax?: number;
    followUpAt?: string;
  };
  proposal?: {
    deliverablesAtLeast?: number;
    paymentTerms?: string;
    hasRisk?: boolean;
  };
  contract?: {
    jurisdiction?: string;
    hasConfidentiality?: boolean;
    hasTermination?: boolean;
  };
  invoice?: {
    lineItems?: number;
    total?: number;
    paid?: number;
  };
  payment?: {
    currency?: string;
    gross?: number;
    fee?: number;
    net?: number;
  };
}

const fixturesDir = join(process.cwd(), "test/fixtures/realdata");
const fixtureInputs = readdirSync(fixturesDir)
  .filter((file) => !file.endsWith(".expected.json"))
  .sort();

const readFixture = (file: string) => ({
  input: readFileSync(join(fixturesDir, file), "utf8"),
  expected: JSON.parse(
    readFileSync(
      join(fixturesDir, file.replace(/\.(txt|csv)$/, ".expected.json")),
      "utf8",
    ),
  ) as ExpectedFixture,
});

describe("real-data intake inference", () => {
  it.each(fixtureInputs)("matches expected properties for %s", (file) => {
    const { input, expected } = readFixture(file);
    const first = analyzeIntake(input, { now: "2026-05-09T00:00:00.000Z" });
    const second = analyzeIntake(input, { now: "2026-05-09T00:00:00.000Z" });

    expect(first).toEqual(second);
    expect(first.kind).toBe(expected.kind);
    expect(first.confidence).toBeGreaterThanOrEqual(expected.confidenceAtLeast);
    expect(first.anomalies.map((item) => item.code)).toEqual(
      expect.arrayContaining(expected.requiredAnomalies),
    );

    if (expected.lead?.name) {
      expect(first.lead.name?.value).toBe(expected.lead.name);
    }
    if (expected.lead?.company) {
      expect(first.lead.company?.value).toBe(expected.lead.company);
    }
    if (expected.lead?.email) {
      expect(first.lead.email?.value).toBe(expected.lead.email);
    }
    if (expected.lead?.source) {
      expect(first.lead.source?.value).toBe(expected.lead.source);
    }
    if (expected.lead?.budgetMin !== undefined) {
      expect(first.lead.budgetMin?.value).toBe(expected.lead.budgetMin);
    }
    if (expected.lead?.budgetMax !== undefined) {
      expect(first.lead.budgetMax?.value).toBe(expected.lead.budgetMax);
    }
    if (expected.lead?.followUpAt) {
      expect(first.lead.followUpAt?.value).toBe(expected.lead.followUpAt);
    }
    if (expected.leadCount !== undefined) {
      expect(first.metadata.parameters.csvRows).toBe(expected.leadCount);
    }
    if (expected.proposal?.deliverablesAtLeast) {
      expect(first.proposal.deliverables.length).toBeGreaterThanOrEqual(
        expected.proposal.deliverablesAtLeast,
      );
    }
    if (expected.proposal?.paymentTerms) {
      expect(first.proposal.paymentTerms?.value).toContain(expected.proposal.paymentTerms);
    }
    if (expected.proposal?.hasRisk) {
      expect(first.proposal.risks.length).toBeGreaterThan(0);
    }
    if (expected.contract?.jurisdiction) {
      expect(first.contract?.jurisdiction?.value).toBe(expected.contract.jurisdiction);
    }
    if (expected.contract?.hasConfidentiality !== undefined) {
      expect(first.contract?.hasConfidentiality).toBe(expected.contract.hasConfidentiality);
    }
    if (expected.contract?.hasTermination !== undefined) {
      expect(first.contract?.hasTermination).toBe(expected.contract.hasTermination);
    }
    if (expected.invoice?.lineItems !== undefined) {
      expect(first.invoice?.lineItems).toBe(expected.invoice.lineItems);
    }
    if (expected.invoice?.total !== undefined) {
      expect(first.invoice?.total).toBe(expected.invoice.total);
    }
    if (expected.invoice?.paid !== undefined) {
      expect(first.invoice?.paid).toBe(expected.invoice.paid);
    }
    if (expected.payment?.currency) {
      expect(first.payment?.currency?.value).toBe(expected.payment.currency);
    }
    if (expected.payment?.gross !== undefined) {
      expect(first.payment?.gross?.value).toBe(expected.payment.gross);
    }
    if (expected.payment?.fee !== undefined) {
      expect(first.payment?.fee?.value).toBe(expected.payment.fee);
    }
    if (expected.payment?.net !== undefined) {
      expect(first.payment?.net?.value).toBe(expected.payment.net);
    }
  });

  it("handles synthetic empty and huge edge inputs without crashing", () => {
    expect(analyzeIntake("").kind).toBe("unknown");
    const huge = `${readFixture("09-huge-transcript.txt").input}\n`.repeat(200);
    const analysis = analyzeIntake(huge, { now: "2026-05-09T00:00:00.000Z" });
    expect(analysis.kind).toBe("transcript");
    expect(analysis.metadata.inputBytes).toBeGreaterThan(100_000);
  });
});
