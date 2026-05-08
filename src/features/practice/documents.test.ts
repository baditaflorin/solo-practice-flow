import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
import {
  buildContractFromProposal,
  buildInvoiceFromProposal,
  buildProposalFromLead,
  renderContractMarkdown,
  renderInvoiceMarkdown,
  renderProposalMarkdown,
} from "./documents";

describe("practice documents", () => {
  it("generates proposal, contract, and invoice artifacts from a lead", () => {
    const state = createInitialPracticeState();
    const lead = state.leads[0];
    const proposal = buildProposalFromLead(lead, state.profile, state.settings);
    const contract = buildContractFromProposal(proposal, lead, state.profile);
    const invoice = buildInvoiceFromProposal(state, proposal, state.settings);

    expect(proposal.leadId).toBe(lead.id);
    expect(proposal.deliverables.length).toBeGreaterThan(2);
    expect(contract.bodyMarkdown).toContain(proposal.title);
    expect(invoice.lineItems[0]?.unitPrice).toBe(proposal.fee);
  });

  it("renders exportable markdown documents", () => {
    const state = createInitialPracticeState();
    const lead = state.leads[0];
    const proposal = buildProposalFromLead(
      lead,
      state.profile,
      state.settings,
      "LLM scope",
    );
    const contract = buildContractFromProposal(proposal, lead, state.profile);
    const invoice = buildInvoiceFromProposal(state, proposal, state.settings);

    expect(
      renderProposalMarkdown(
        proposal,
        lead,
        state.profile,
        state.settings.currency,
      ),
    ).toContain("LLM scope");
    expect(renderContractMarkdown(contract)).toContain("Agreement");
    expect(
      renderInvoiceMarkdown(
        invoice,
        proposal,
        lead,
        state.profile,
        state.settings,
      ),
    ).toContain(invoice.number);
  });
});
