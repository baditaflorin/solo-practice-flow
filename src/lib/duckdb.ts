import type { PracticeState } from '../features/practice/types'
import { invoiceTotal } from '../features/practice/calculations'

export const buildTaxRows = (state: PracticeState) =>
  state.invoices.flatMap((invoice) =>
    invoice.lineItems.map((item) => ({
      invoice_number: invoice.number,
      issue_date: invoice.issueDate,
      paid_date: invoice.paidDate,
      status: invoice.status,
      description: item.description,
      tax_category: item.taxCategory,
      invoiced: item.quantity * item.unitPrice,
      paid:
        invoiceTotal(invoice) === 0
          ? 0
          : invoice.amountPaid * ((item.quantity * item.unitPrice) / invoiceTotal(invoice)),
    })),
  )

export const buildDuckDbTaxCsv = async (state: PracticeState) => {
  const duckdb = await import('@duckdb/duckdb-wasm')
  const bundles = duckdb.getJsDelivrBundles()
  const bundle = await duckdb.selectBundle(bundles)
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], { type: 'text/javascript' }),
  )
  const worker = new Worker(workerUrl)
  const logger = new duckdb.ConsoleLogger()
  const db = new duckdb.AsyncDuckDB(logger, worker)

  try {
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    URL.revokeObjectURL(workerUrl)
    await db.registerFileText('tax_rows.json', JSON.stringify(buildTaxRows(state)))
    const connection = await db.connect()
    await connection.insertJSONFromPath('tax_rows.json', { name: 'tax_rows' })
    const table = await connection.query(`
      SELECT
        tax_category,
        round(sum(invoiced), 2) AS invoiced,
        round(sum(paid), 2) AS paid,
        round(sum(invoiced - paid), 2) AS outstanding
      FROM tax_rows
      GROUP BY tax_category
      ORDER BY tax_category
    `)
    const rows = table.toArray().map((row) => row.toJSON() as Record<string, string | number>)
    await connection.close()

    if (rows.length === 0) {
      return 'tax_category,invoiced,paid,outstanding\n'
    }

    const headers = Object.keys(rows[0])
    return [
      headers.join(','),
      ...rows.map((row) => headers.map((header) => String(row[header] ?? '')).join(',')),
    ].join('\n')
  } finally {
    await db.terminate()
    worker.terminate()
  }
}
