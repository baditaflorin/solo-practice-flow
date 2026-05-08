import type { Invoice, PracticeState, TaxCategory, TaxSummaryRow } from './types'

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0)

export const invoiceTotal = (invoice: Invoice) =>
  invoice.lineItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0)

export const invoiceOutstanding = (invoice: Invoice) =>
  Math.max(invoiceTotal(invoice) - invoice.amountPaid, 0)

export const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const taxSummary = (state: PracticeState): TaxSummaryRow[] => {
  const rows = new Map<TaxCategory, TaxSummaryRow>()

  for (const invoice of state.invoices) {
    const total = invoiceTotal(invoice)
    for (const item of invoice.lineItems) {
      const lineTotal = item.quantity * item.unitPrice
      const paidShare = total === 0 ? 0 : invoice.amountPaid * (lineTotal / total)
      const existing =
        rows.get(item.taxCategory) ??
        ({
          category: item.taxCategory,
          invoiced: 0,
          paid: 0,
          outstanding: 0,
        } satisfies TaxSummaryRow)

      existing.invoiced += lineTotal
      existing.paid += Math.min(paidShare, lineTotal)
      existing.outstanding += Math.max(lineTotal - paidShare, 0)
      rows.set(item.taxCategory, existing)
    }
  }

  return [...rows.values()].sort((a, b) => a.category.localeCompare(b.category))
}

export const nextInvoiceNumber = (state: PracticeState) => {
  const year = new Date().getFullYear()
  const count = state.invoices.filter((invoice) => invoice.number.startsWith(`${year}-`)).length
  return `${year}-${String(count + 1).padStart(4, '0')}`
}

export const statusCounts = (state: PracticeState) => ({
  leads: state.leads.length,
  proposals: state.proposals.length,
  contracts: state.contracts.length,
  invoices: state.invoices.length,
  paidInvoices: state.invoices.filter((invoice) => invoice.status === 'paid').length,
})
