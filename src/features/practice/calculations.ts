import type {
  Invoice,
  PracticeState,
  TaxCategory,
  TaxSummaryRow,
} from "./types";

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);

export const invoiceTotal = (invoice: Invoice) =>
  invoice.lineItems.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );

export const invoiceOutstanding = (invoice: Invoice) =>
  Math.max(invoiceTotal(invoice) - invoice.amountPaid, 0);

/**
 * Days until the invoice's due date relative to `now`. Negative when the
 * invoice is past due. Returns NaN when the due date is malformed.
 */
export const invoiceDaysUntilDue = (
  invoice: Invoice,
  now: Date = new Date(),
) => {
  if (!invoice.dueDate) return Number.NaN;
  const due = new Date(`${invoice.dueDate}T23:59:59`);
  if (Number.isNaN(due.getTime())) return Number.NaN;
  const millisPerDay = 86_400_000;
  return Math.floor((due.getTime() - now.getTime()) / millisPerDay);
};

/**
 * An invoice is overdue when its outstanding balance is positive, the due
 * date has passed, and it hasn't been marked paid. Draft invoices are
 * never overdue — they haven't been sent yet. The prior CRM only treated
 * an invoice as overdue when the user manually flipped the status dropdown
 * to "overdue", so this fills the dormant "automated past-due alert" that
 * a real billing flow needs.
 */
export const invoiceIsOverdue = (invoice: Invoice, now: Date = new Date()) => {
  if (invoice.status === "paid") return false;
  if (invoice.status === "draft") return false;
  if (invoiceOutstanding(invoice) <= 0) return false;
  const daysLeft = invoiceDaysUntilDue(invoice, now);
  return Number.isFinite(daysLeft) && daysLeft < 0;
};

export const overdueInvoices = (state: PracticeState, now: Date = new Date()) =>
  state.invoices.filter((invoice) => invoiceIsOverdue(invoice, now));

export const overdueSummary = (
  state: PracticeState,
  now: Date = new Date(),
) => {
  const overdue = overdueInvoices(state, now);
  const totalDue = overdue.reduce(
    (total, invoice) => total + invoiceOutstanding(invoice),
    0,
  );
  return {
    count: overdue.length,
    totalDue,
    worstDaysOverdue: overdue.reduce((worst, invoice) => {
      const days = -invoiceDaysUntilDue(invoice, now);
      return Number.isFinite(days) && days > worst ? days : worst;
    }, 0),
  };
};

export const addDays = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const taxSummary = (state: PracticeState): TaxSummaryRow[] => {
  const rows = new Map<TaxCategory, TaxSummaryRow>();

  for (const invoice of state.invoices) {
    const total = invoiceTotal(invoice);
    for (const item of invoice.lineItems) {
      const lineTotal = item.quantity * item.unitPrice;
      const paidShare =
        total === 0 ? 0 : invoice.amountPaid * (lineTotal / total);
      const existing =
        rows.get(item.taxCategory) ??
        ({
          category: item.taxCategory,
          invoiced: 0,
          paid: 0,
          outstanding: 0,
        } satisfies TaxSummaryRow);

      existing.invoiced += lineTotal;
      existing.paid += Math.min(paidShare, lineTotal);
      existing.outstanding += Math.max(lineTotal - paidShare, 0);
      rows.set(item.taxCategory, existing);
    }
  }

  return [...rows.values()].sort((a, b) =>
    a.category.localeCompare(b.category),
  );
};

export const nextInvoiceNumber = (state: PracticeState) => {
  const year = new Date().getFullYear();
  const count = state.invoices.filter((invoice) =>
    invoice.number.startsWith(`${year}-`),
  ).length;
  return `${year}-${String(count + 1).padStart(4, "0")}`;
};

export const statusCounts = (state: PracticeState) => ({
  leads: state.leads.length,
  proposals: state.proposals.length,
  contracts: state.contracts.length,
  invoices: state.invoices.length,
  paidInvoices: state.invoices.filter((invoice) => invoice.status === "paid")
    .length,
});
