# Phase 2 Substance Postmortem

Date: 2026-05-09

## Pass Rate

| Fixture             | Before |        After | Evidence                                                                            |
| ------------------- | -----: | -----------: | ----------------------------------------------------------------------------------- |
| Clean email inquiry |   fail |         pass | Extracts contact, company, email, budget range, follow-up date                      |
| LinkedIn DM         |   fail |         pass | Infers source, budget range, missing email, relative-date warning                   |
| RFP excerpt         |   fail |         pass | Extracts deliverables, payment terms, budget, procurement contact                   |
| Lead CSV            |   fail |         pass | Normalizes BOM/CRLF and infers lead rows                                            |
| Broken CSV          |   fail |         pass | Recovers quoted commas/newlines and surfaces malformed row                          |
| Client contract     |   fail |         pass | Detects jurisdiction and core clauses, warns about missing email                    |
| Invoice line CSV    |   fail | partial pass | Detects line count, total, paid amount, categories; no full multi-line editor in v1 |
| PayPal activity CSV |   fail | partial pass | Detects gross/fee/net/currency/transaction; no dedicated payment import in v1       |
| Huge transcript     |   fail |         pass | Produces deliverable/risk first guess with large-input warning                      |
| Adversarial input   |   fail |         pass | Detects prompt injection, suspicious Unicode, invalid date, bad fee instruction     |

Useful first guess: 0/10 before, 10/10 after.

Primary flow without manual transcription: 4/10 before, 8/10 after.

## Logic Gaps Closed

1. Raw intake parser: added deterministic intake analysis for emails, DMs, RFPs, CSVs, contracts, invoices, payments, transcripts, and adversarial text.
2. Evidence-aware proposal generation: proposals now inherit inferred deliverables, timeline, payment terms, confidence, and evidence.
3. Accounting detail: invoice/payment CSVs are recognized and shown in intake review; tax category correction memory and export provenance were added. Full payment import remains deliberately out of v1 scope.
4. Contract blind signing: contract intake detects jurisdiction and clause presence; signature validation now appears in flow checks.
5. Export metadata: JSON, encrypted backup, Markdown, HTML, tax CSV, DuckDB CSV, and invoices now carry app/schema/source/parameter provenance.

## Smart Behaviors

The app now feels smart when it:

1. Produces a useful first guess immediately after a messy paste.
2. Explains each inferred value with confidence, evidence, and a reason.
3. Names anomalies in practice terms: missing email, malformed CSV row, pending payment, suspicious fee instruction.
4. Carries confidence into proposal evidence and exports.
5. Remembers tax category corrections for similar regenerated invoices.

## Determinism

`src/features/practice/inference.test.ts` runs every real-data fixture twice and requires byte-identical analysis JSON. All 10 pass.

## Performance

`src/features/practice/inference.performance.test.ts` asserts median and worst fixture analysis under 1000 ms. It passes locally; Vitest reported 19-76 ms of test-body time across local perf/validation runs.

## Surprises

CSV messiness mattered more than expected: quoted commas, embedded newlines, and smart punctuation are the difference between a useful invoice/lead guess and nonsense. The adversarial fixture was also a good forcing function; without explicit anomaly surfacing, a local LLM prompt could treat malicious pasted text as instruction instead of data.

## Still Open

1. Dedicated multi-line invoice import/editor.
2. Dedicated payment ledger with PayPal gross/fee/net reconciliation.
3. Web Worker inference if real transcripts exceed the current synchronous budget.
4. More jurisdiction-aware contract validation without pretending to provide legal advice.
5. Round-trip import for the new provenance-wrapped backup envelope.

## Honest Take

It no longer feels like a toy for lead intake, proposal drafting, contract review signals, signing, and tax export provenance. It still has toy-like edges around payment reconciliation and multi-line invoice editing because the engine can now understand those inputs, but the v1 surface only shows the guess instead of turning it into a full editable ledger.
