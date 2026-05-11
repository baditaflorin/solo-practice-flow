import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
import {
  invoiceDaysUntilDue,
  invoiceIsOverdue,
  invoiceOutstanding,
  invoiceTotal,
  nextInvoiceNumber,
  overdueInvoices,
  overdueSummary,
  taxSummary,
} from "./calculations";
import type { Invoice } from "./types";

const invoice: Invoice = {
  id: "invoice-test",
  proposalId: "proposal-test",
  number: "2026-0001",
  issueDate: "2026-05-08",
  dueDate: "2026-05-22",
  status: "sent",
  amountPaid: 600,
  paidDate: "",
  memo: "",
  lineItems: [
    {
      id: "line-1",
      description: "Consulting",
      quantity: 2,
      unitPrice: 500,
      taxCategory: "consulting_income",
    },
    {
      id: "line-2",
      description: "Software setup",
      quantity: 1,
      unitPrice: 200,
      taxCategory: "software_income",
    },
  ],
};

describe("practice calculations", () => {
  it("totals invoices and outstanding balance", () => {
    expect(invoiceTotal(invoice)).toBe(1200);
    expect(invoiceOutstanding(invoice)).toBe(600);
  });

  it("summarizes tax categories proportionally by paid amount", () => {
    const state = { ...createInitialPracticeState(), invoices: [invoice] };
    expect(taxSummary(state)).toEqual([
      {
        category: "consulting_income",
        invoiced: 1000,
        paid: 500,
        outstanding: 500,
      },
      {
        category: "software_income",
        invoiced: 200,
        paid: 100,
        outstanding: 100,
      },
    ]);
  });

  it("increments invoice numbers inside the current year", () => {
    const state = { ...createInitialPracticeState(), invoices: [invoice] };
    expect(nextInvoiceNumber(state)).toMatch(/^\d{4}-000[12]$/);
  });

  it("detects an invoice that's past due and still unpaid", () => {
    const overdue: Invoice = {
      ...invoice,
      status: "sent",
      dueDate: "2026-05-22",
    };
    const now = new Date("2026-06-05T12:00:00");
    expect(invoiceDaysUntilDue(overdue, now)).toBeLessThan(0);
    expect(invoiceIsOverdue(overdue, now)).toBe(true);
  });

  it("does not flag paid or fully-collected invoices as overdue", () => {
    const paidStatus: Invoice = { ...invoice, status: "paid" };
    const fullyCollected: Invoice = {
      ...invoice,
      status: "sent",
      amountPaid: invoiceTotal(invoice),
    };
    const now = new Date("2026-06-05T12:00:00");
    expect(invoiceIsOverdue(paidStatus, now)).toBe(false);
    expect(invoiceIsOverdue(fullyCollected, now)).toBe(false);
  });

  it("does not flag a draft invoice as overdue even if the due date passed", () => {
    const draft: Invoice = {
      ...invoice,
      status: "draft",
      dueDate: "2024-01-01",
    };
    const now = new Date("2026-06-05T12:00:00");
    expect(invoiceIsOverdue(draft, now)).toBe(false);
  });

  it("summarizes overdue invoices with count, balance, and worst lag", () => {
    const state = {
      ...createInitialPracticeState(),
      invoices: [
        {
          ...invoice,
          id: "i-1",
          status: "sent" as const,
          dueDate: "2026-05-20",
        },
        {
          ...invoice,
          id: "i-2",
          status: "sent" as const,
          dueDate: "2026-05-01",
          amountPaid: 0,
          number: "2026-0002",
        },
        {
          ...invoice,
          id: "i-3",
          status: "paid" as const,
          dueDate: "2026-05-22",
          number: "2026-0003",
        },
      ],
    };
    const now = new Date("2026-06-05T12:00:00");
    const overdue = overdueInvoices(state, now);
    expect(overdue.map((entry) => entry.id).sort()).toEqual(["i-1", "i-2"]);
    const summary = overdueSummary(state, now);
    expect(summary.count).toBe(2);
    expect(summary.totalDue).toBeGreaterThan(0);
    // i-2 was due 2026-05-01, so by 2026-06-05 it's > 30 days overdue.
    expect(summary.worstDaysOverdue).toBeGreaterThan(30);
  });
});
