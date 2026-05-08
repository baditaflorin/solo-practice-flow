import { describe, expect, it } from "vitest";
import { createInitialPracticeState } from "./seed";
import {
  invoiceOutstanding,
  invoiceTotal,
  nextInvoiceNumber,
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
});
