export const schemaVersion = 1;

export type LeadStatus =
  | "new"
  | "qualified"
  | "proposal"
  | "contract"
  | "active"
  | "won"
  | "lost";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export type TaxCategory =
  | "consulting_income"
  | "software_income"
  | "maintenance_income"
  | "reimbursable_expense";

export type ConfidenceLevel = "high" | "medium" | "low";

export type IntakeKind =
  | "email"
  | "message"
  | "rfp"
  | "lead_csv"
  | "contract"
  | "invoice_csv"
  | "payment_csv"
  | "transcript"
  | "adversarial"
  | "unknown";

export interface InferredValue<T> {
  value: T;
  confidence: number;
  level: ConfidenceLevel;
  evidence: string;
  reason: string;
}

export interface IntakeAnomaly {
  code: string;
  severity: "info" | "warning" | "danger";
  message: string;
  why: string;
  next: string;
  evidence?: string;
}

export interface SuggestedFix {
  id: string;
  label: string;
  reason: string;
  action: string;
}

export interface InferredLead {
  id: string;
  name?: InferredValue<string>;
  company?: InferredValue<string>;
  email?: InferredValue<string>;
  source?: InferredValue<string>;
  budgetMin?: InferredValue<number>;
  budgetMax?: InferredValue<number>;
  followUpAt?: InferredValue<string>;
  need?: InferredValue<string>;
  notes?: InferredValue<string>;
}

export interface InferredProposal {
  deliverables: Array<InferredValue<string>>;
  timeline?: InferredValue<string>;
  paymentTerms?: InferredValue<string>;
  acceptanceCriteria?: InferredValue<string>;
  risks: Array<InferredValue<string>>;
}

export interface InferredInvoice {
  lineItems: number;
  total: number;
  paid: number;
  taxCategories: Array<InferredValue<TaxCategory>>;
}

export interface InferredPayment {
  currency?: InferredValue<string>;
  gross?: InferredValue<number>;
  fee?: InferredValue<number>;
  net?: InferredValue<number>;
  transactionId?: InferredValue<string>;
}

export interface InferredContract {
  jurisdiction?: InferredValue<string>;
  hasConfidentiality: boolean;
  hasTermination: boolean;
  hasLiabilityCap: boolean;
}

export interface IntakeAnalysis {
  id: string;
  sourceId: string;
  kind: IntakeKind;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  normalizedText: string;
  summary: string;
  lead: InferredLead;
  proposal: InferredProposal;
  invoice?: InferredInvoice;
  payment?: InferredPayment;
  contract?: InferredContract;
  anomalies: IntakeAnomaly[];
  suggestedFixes: SuggestedFix[];
  metadata: {
    schemaVersion: number;
    generatedAt: string;
    inputBytes: number;
    durationMs: number;
    parameters: Record<string, string | number | boolean>;
  };
}

export interface ActivityEvent {
  id: string;
  at: string;
  type: string;
  message: string;
  entityId?: string;
}

export interface CorrectionMemory {
  sourceLabels: Record<string, string>;
  taxCategoryByPhrase: Record<string, TaxCategory>;
  preferredPaymentTerms: string;
}

export interface PracticeProfile {
  businessName: string;
  ownerName: string;
  email: string;
  address: string;
  paymentDetails: string;
  defaultHourlyRate: number;
}

export interface LocalLlmSettings {
  enabled: boolean;
  endpoint: string;
  model: string;
}

export interface PracticeSettings {
  currency: string;
  paymentTermsDays: number;
  taxYear: number;
  repoUrl: string;
  paypalUrl: string;
  localLlm: LocalLlmSettings;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  status: LeadStatus;
  budget: number;
  need: string;
  createdAt: string;
  followUpAt: string;
  notes: string;
  inference?: IntakeAnalysis;
}

export interface Proposal {
  id: string;
  leadId: string;
  title: string;
  scope: string;
  deliverables: string[];
  timeline: string;
  fee: number;
  terms: string;
  generatedAt: string;
  source: "template" | "local_llm";
  confidence?: number;
  evidence?: string[];
}

export interface SignatureRecord {
  algorithm: "Ed25519";
  signedAt: string;
  signerName: string;
  publicKey: string;
  signature: string;
  payloadHash: string;
  verified: boolean;
}

export interface Contract {
  id: string;
  proposalId: string;
  title: string;
  jurisdiction: string;
  bodyMarkdown: string;
  createdAt: string;
  signature?: SignatureRecord;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCategory: TaxCategory;
}

export interface Invoice {
  id: string;
  proposalId: string;
  number: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  lineItems: LineItem[];
  amountPaid: number;
  paidDate: string;
  memo: string;
  provenance?: Record<string, string | number | boolean>;
}

export interface PracticeState {
  schemaVersion: number;
  updatedAt: string;
  profile: PracticeProfile;
  settings: PracticeSettings;
  leads: Lead[];
  proposals: Proposal[];
  contracts: Contract[];
  invoices: Invoice[];
  activityLog: ActivityEvent[];
  corrections: CorrectionMemory;
}

export interface TaxSummaryRow {
  category: TaxCategory;
  invoiced: number;
  paid: number;
  outstanding: number;
}
