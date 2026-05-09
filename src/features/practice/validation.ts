import { invoiceTotal } from "./calculations";
import type { Contract, IntakeAnomaly, Invoice, Lead, Proposal } from "./types";

const issue = (
  code: string,
  severity: IntakeAnomaly["severity"],
  message: string,
  why: string,
  next: string,
): IntakeAnomaly => ({ code, severity, message, why, next });

export const validateLead = (lead: Lead | undefined): IntakeAnomaly[] => {
  if (!lead) {
    return [
      issue(
        "no_active_lead",
        "warning",
        "No active client is selected.",
        "Proposal, contract, invoice, and reminder exports need a client record.",
        "Capture or select a lead first.",
      ),
    ];
  }

  const issues: IntakeAnomaly[] = [];
  if (!lead.email) {
    issues.push(
      issue(
        "missing_client_email",
        "warning",
        "Client email is missing.",
        "Follow-up reminders and send-ready records need a reliable contact.",
        "Add the client email or keep this lead as discovery-only.",
      ),
    );
  }
  if (lead.budget <= 0) {
    issues.push(
      issue(
        "missing_budget",
        "warning",
        "Budget is not set.",
        "Proposal fees will fall back to the default hourly-rate estimate.",
        "Confirm the budget before sending the proposal.",
      ),
    );
  }
  if (lead.inference && lead.inference.confidence < 0.55) {
    issues.push(
      issue(
        "low_intake_confidence",
        "warning",
        "The intake guess is low confidence.",
        "The source text had missing, partial, or conflicting client details.",
        "Open the inference evidence and correct the lead before generating documents.",
      ),
    );
  }

  return issues;
};

export const validateProposal = (
  proposal: Proposal | undefined,
): IntakeAnomaly[] => {
  if (!proposal) {
    return [];
  }

  const issues: IntakeAnomaly[] = [];
  if (proposal.deliverables.length < 2) {
    issues.push(
      issue(
        "thin_deliverables",
        "warning",
        "Proposal has too few deliverables.",
        "A client-ready proposal needs enough concrete outputs to prevent scope ambiguity.",
        "Add at least two specific deliverables before exporting.",
      ),
    );
  }
  if (proposal.fee <= 0) {
    issues.push(
      issue(
        "zero_fee",
        "danger",
        "Proposal fee is zero.",
        "Invoices generated from this proposal would be unusable.",
        "Set a fixed fee before creating the invoice.",
      ),
    );
  }
  if (proposal.confidence !== undefined && proposal.confidence < 0.55) {
    issues.push(
      issue(
        "low_proposal_confidence",
        "warning",
        "Proposal came from low-confidence intake.",
        "Some scope or payment terms were inferred from weak evidence.",
        "Review the evidence list before drafting the contract.",
      ),
    );
  }

  return issues;
};

export const validateContract = (
  contract: Contract | undefined,
): IntakeAnomaly[] => {
  if (!contract) {
    return [];
  }

  if (contract.signature && !contract.signature.verified) {
    return [
      issue(
        "signature_not_verified",
        "danger",
        "Contract signature does not verify.",
        "The signed Markdown no longer matches the current contract body.",
        "Sign the contract again after the final edits.",
      ),
    ];
  }

  return [];
};

export const validateInvoice = (
  invoice: Invoice | undefined,
): IntakeAnomaly[] => {
  if (!invoice) {
    return [];
  }

  const issues: IntakeAnomaly[] = [];
  const total = invoiceTotal(invoice);
  if (invoice.amountPaid > total) {
    issues.push(
      issue(
        "overpaid_invoice",
        "warning",
        "Payment exceeds the invoice total.",
        "The tax export will show more paid than invoiced for this invoice.",
        "Check the payment amount or split the extra payment into a separate record.",
      ),
    );
  }
  if (invoice.status === "paid" && !invoice.paidDate) {
    issues.push(
      issue(
        "missing_paid_date",
        "warning",
        "Paid invoice has no paid date.",
        "Tax exports need a payment date to support year-end categorization.",
        "Set the paid amount again or add the paid date before exporting.",
      ),
    );
  }

  return issues;
};

export const validatePracticeFlow = (input: {
  lead?: Lead;
  proposal?: Proposal;
  contract?: Contract;
  invoice?: Invoice;
}) => [
  ...validateLead(input.lead),
  ...validateProposal(input.proposal),
  ...validateContract(input.contract),
  ...validateInvoice(input.invoice),
];
