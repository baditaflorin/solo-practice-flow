import { addDays, invoiceTotal, nextInvoiceNumber } from "./calculations";
import type {
  Contract,
  Invoice,
  Lead,
  LineItem,
  PracticeProfile,
  PracticeSettings,
  PracticeState,
  Proposal,
  TaxCategory,
} from "./types";

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const todayIso = () => new Date().toISOString().slice(0, 10);

const bulletList = (items: string[]) =>
  items.map((item) => `- ${item}`).join("\n");

export const buildProposalFromLead = (
  lead: Lead,
  profile: PracticeProfile,
  settings: PracticeSettings,
  llmScope?: string,
): Proposal => {
  const fee = lead.budget > 0 ? lead.budget : profile.defaultHourlyRate * 20;

  return {
    id: id("proposal"),
    leadId: lead.id,
    title: `${lead.company || lead.name} consulting sprint`,
    scope:
      llmScope?.trim() ||
      `We will turn "${lead.need}" into a focused consulting sprint with clear deliverables, weekly decision points, and a final handoff package.`,
    deliverables: [
      "Discovery brief and success criteria",
      "Implementation roadmap with risks and dependencies",
      "Production-ready operating assets or technical recommendations",
      "Final review, handoff notes, and next-step backlog",
    ],
    timeline: "2-4 weeks from kickoff, adjusted after discovery.",
    fee,
    terms: `${settings.paymentTermsDays}-day payment terms. Scope changes are estimated and approved before work begins.`,
    generatedAt: new Date().toISOString(),
    source: llmScope?.trim() ? "local_llm" : "template",
  };
};

export const buildContractFromProposal = (
  proposal: Proposal,
  lead: Lead,
  profile: PracticeProfile,
): Contract => ({
  id: id("contract"),
  proposalId: proposal.id,
  title: `${proposal.title} agreement`,
  jurisdiction: "Mutually agreed jurisdiction",
  createdAt: new Date().toISOString(),
  bodyMarkdown: `# ${proposal.title} Agreement

This consulting agreement is between ${profile.businessName} ("Consultant") and ${lead.company || lead.name} ("Client").

## Scope

${proposal.scope}

## Deliverables

${bulletList(proposal.deliverables)}

## Timeline

${proposal.timeline}

## Fees

The fixed project fee is ${proposal.fee}. Payment terms: ${proposal.terms}

## Confidentiality

Both parties agree to protect non-public business, technical, and client information shared during the engagement.

## Acceptance

Work is accepted when the agreed deliverables are provided and material issues are reported within five business days.

## Signature

The cryptographic signature below, when present, signs the Markdown body of this agreement with Ed25519.`,
});

export const buildInvoiceFromProposal = (
  state: PracticeState,
  proposal: Proposal,
  settings: PracticeSettings,
): Invoice => {
  const issueDate = todayIso();
  const lineItems: LineItem[] = [
    {
      id: id("line"),
      description: proposal.title,
      quantity: 1,
      unitPrice: proposal.fee,
      taxCategory: "consulting_income",
    },
  ];

  return {
    id: id("invoice"),
    proposalId: proposal.id,
    number: nextInvoiceNumber(state),
    issueDate,
    dueDate: addDays(issueDate, settings.paymentTermsDays),
    status: "draft",
    lineItems,
    amountPaid: 0,
    paidDate: "",
    memo: "Generated from accepted proposal.",
  };
};

export const renderProposalMarkdown = (
  proposal: Proposal,
  lead: Lead,
  profile: PracticeProfile,
  currency: string,
) => `# ${proposal.title}

Prepared by ${profile.businessName} for ${lead.company || lead.name}.

## Client Need

${lead.need}

## Scope

${proposal.scope}

## Deliverables

${bulletList(proposal.deliverables)}

## Timeline

${proposal.timeline}

## Fee

${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(proposal.fee)}

## Terms

${proposal.terms}
`;

export const renderContractMarkdown = (contract: Contract) => {
  const signature = contract.signature;
  if (!signature) {
    return contract.bodyMarkdown;
  }

  return `${contract.bodyMarkdown}

## Cryptographic Signature

- Algorithm: ${signature.algorithm}
- Signed at: ${signature.signedAt}
- Signer: ${signature.signerName}
- Payload SHA-256: ${signature.payloadHash}
- Public key: ${signature.publicKey}
- Signature: ${signature.signature}
- Verified locally: ${signature.verified ? "yes" : "no"}
`;
};

export const renderInvoiceMarkdown = (
  invoice: Invoice,
  proposal: Proposal,
  lead: Lead,
  profile: PracticeProfile,
  settings: PracticeSettings,
) => {
  const total = invoiceTotal(invoice);
  const rows = invoice.lineItems
    .map(
      (item) =>
        `| ${item.description} | ${item.quantity} | ${item.unitPrice} | ${item.taxCategory} | ${
          item.quantity * item.unitPrice
        } |`,
    )
    .join("\n");

  return `# Invoice ${invoice.number}

From: ${profile.businessName}

To: ${lead.company || lead.name}

Project: ${proposal.title}

Issue date: ${invoice.issueDate}

Due date: ${invoice.dueDate}

Status: ${invoice.status}

| Description | Qty | Unit price | Tax category | Total |
| --- | ---: | ---: | --- | ---: |
${rows}

Total due: ${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: settings.currency,
  }).format(total)}

Payment details: ${profile.paymentDetails}

Memo: ${invoice.memo}
`;
};

export const taxCategoryLabels: Record<TaxCategory, string> = {
  consulting_income: "Consulting income",
  software_income: "Software income",
  maintenance_income: "Maintenance income",
  reimbursable_expense: "Reimbursable expense",
};
