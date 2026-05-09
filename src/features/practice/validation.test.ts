import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
import { buildInvoiceFromProposal, buildProposalFromLead } from "./documents";
import {
  validateInvoice,
  validateLead,
  validatePracticeFlow,
  validateProposal,
} from "./validation";

describe("practice validation", () => {
  it("surfaces missing client details in domain language", () => {
    const state = createInitialPracticeState();
    const lead = {
      ...state.leads[0],
      email: "",
      budget: 0,
    };

    expect(validateLead(lead).map((issue) => issue.code)).toEqual([
      "missing_client_email",
      "missing_budget",
    ]);
  });

  it("guards proposal and invoice states before export", () => {
    const state = createInitialPracticeState();
    const lead = state.leads[0];
    const proposal = {
      ...buildProposalFromLead(lead, state.profile, state.settings),
      deliverables: ["Discovery"],
      fee: 0,
    };
    const invoice = {
      ...buildInvoiceFromProposal(state, proposal, state.settings),
      amountPaid: 100,
      status: "paid" as const,
      paidDate: "",
    };

    expect(validateProposal(proposal).map((issue) => issue.code)).toEqual([
      "thin_deliverables",
      "zero_fee",
    ]);
    expect(validateInvoice(invoice).map((issue) => issue.code)).toEqual([
      "overpaid_invoice",
      "missing_paid_date",
    ]);
    expect(
      validatePracticeFlow({ lead, proposal, invoice }).map(
        (issue) => issue.code,
      ),
    ).toEqual([
      "thin_deliverables",
      "zero_fee",
      "overpaid_invoice",
      "missing_paid_date",
    ]);
  });
});
