export const schemaVersion = 1

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'contract'
  | 'active'
  | 'won'
  | 'lost'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type TaxCategory =
  | 'consulting_income'
  | 'software_income'
  | 'maintenance_income'
  | 'reimbursable_expense'

export interface PracticeProfile {
  businessName: string
  ownerName: string
  email: string
  address: string
  paymentDetails: string
  defaultHourlyRate: number
}

export interface LocalLlmSettings {
  enabled: boolean
  endpoint: string
  model: string
}

export interface PracticeSettings {
  currency: string
  paymentTermsDays: number
  taxYear: number
  repoUrl: string
  paypalUrl: string
  localLlm: LocalLlmSettings
}

export interface Lead {
  id: string
  name: string
  company: string
  email: string
  source: string
  status: LeadStatus
  budget: number
  need: string
  createdAt: string
  followUpAt: string
  notes: string
}

export interface Proposal {
  id: string
  leadId: string
  title: string
  scope: string
  deliverables: string[]
  timeline: string
  fee: number
  terms: string
  generatedAt: string
  source: 'template' | 'local_llm'
}

export interface SignatureRecord {
  algorithm: 'Ed25519'
  signedAt: string
  signerName: string
  publicKey: string
  signature: string
  payloadHash: string
  verified: boolean
}

export interface Contract {
  id: string
  proposalId: string
  title: string
  jurisdiction: string
  bodyMarkdown: string
  createdAt: string
  signature?: SignatureRecord
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxCategory: TaxCategory
}

export interface Invoice {
  id: string
  proposalId: string
  number: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  lineItems: LineItem[]
  amountPaid: number
  paidDate: string
  memo: string
}

export interface PracticeState {
  schemaVersion: number
  updatedAt: string
  profile: PracticeProfile
  settings: PracticeSettings
  leads: Lead[]
  proposals: Proposal[]
  contracts: Contract[]
  invoices: Invoice[]
}

export interface TaxSummaryRow {
  category: TaxCategory
  invoiced: number
  paid: number
  outstanding: number
}
