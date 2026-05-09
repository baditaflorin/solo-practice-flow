# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Scope: §0 audit only. No ADRs, fixtures, §2 picklist, or code changes yet.

Baseline app: v0.1.0, Mode A, live at https://baditaflorin.github.io/solo-practice-flow/

## Baseline Summary

The v1 happy path works when the user manually transcribes one clean lead into the form, then clicks through proposal, contract, signing, invoice, and export. It does not yet understand raw business inputs. If a stranger pastes their own inquiry, RFP, CSV, payment export, contract text, or meeting notes, v1 does not infer the obvious first draft.

Baseline useful-first-guess pass rate: 0/10.

Baseline manually-completable pass rate after user transcription/correction: 4/10.

Phase 2 implemented result, measured on 2026-05-09:

Useful-first-guess pass rate: 10/10 fixtures now produce typed intake analysis with stable IDs, confidence, evidence, anomalies, and suggested fixes.

Primary-flow pass rate: 8/10 fixtures can move through the existing v1 flow without manual field transcription after approving the smart intake guess. The PayPal activity export and multi-line invoice CSV are analysis/provenance-ready, but v1 still has no separate payment-import or multi-line invoice editor surface by design.

Determinism: 10/10 fixtures produce byte-identical normalized analysis on repeated runs in `src/features/practice/inference.test.ts`.

Robustness: 10/10 real fixtures plus empty and huge synthetic edge fixtures run without crashes.

## The 10 Real-World Inputs

These are real-world input shapes a solo consultant is likely to bring into this product. Private names/details are anonymized, but the messiness is intentionally realistic.

| #   | Input                                                                                                                                   |                   Messiness | What v1 did                                                                                                                                                               | What it should have done                                                                                                                                                 | Why it failed                                                               | Failure style                                                                           | Manual work forced onto user                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1   | Clean email inquiry: subject, sender name, company domain, explicit budget "$8k-$12k", deadline, short problem statement                |                       Clean | User must copy name/company/email/budget/need into separate fields. Budget range cannot be represented, so user picks one number. Proposal uses generic scope.            | Parse contact, company, email, budget range, deadline, source=email, and need. Produce a proposal with budget confidence and deadline evidence.                          | No raw inquiry parser, no budget-range model, no evidence tracking.         | Silent omission: app looks fine but loses range/deadline nuance.                        | Transcribe fields, choose a single budget, rewrite proposal scope. |
| 2   | LinkedIn-style DM: informal text, no email, "maybe 3-4k", "next Friday", vague scope                                                    |                Mildly messy | User manually invents email/company or leaves blanks. Follow-up date stays whatever user chooses. Budget defaults unless user normalizes "3-4k".                          | Infer source=LinkedIn, missing email, budget range 3000-4000, relative date, low-confidence company, and discovery-needed status.                                        | No relative date parsing, no missing-field confidence, no source inference. | Wrong-but-confident if user leaves default budget.                                      | Translate informal text into structured fields.                    |
| 3   | RFP excerpt: multi-paragraph scope, required deliverables, acceptance criteria, invoice terms, procurement deadline                     |                       Messy | User pastes into Need. Proposal generator ignores most structure and emits the same four generic deliverables. Contract terms stay generic.                               | Extract deliverables, acceptance criteria, timeline, procurement deadline, payment terms, and risk notes. Preserve source snippets for each inferred field.              | Proposal logic is template-only and not evidence-aware.                     | Silent omission and generic output.                                                     | Rebuild deliverables, terms, and timeline manually.                |
| 4   | Lead spreadsheet CSV with UTF-8 BOM, CRLF, columns `Name, Company, Email, Budget, Follow-up, Notes`, 40 rows                            |           Common bulk input | No import path. User can create only one lead at a time.                                                                                                                  | Detect CSV, normalize BOM/CRLF, infer columns, preview 40 leads with confidence, and let user accept/correct.                                                            | No parser or bulk lead intake model.                                        | Obvious failure: no place to use the input.                                             | Copy 40 rows manually.                                             |
| 5   | Broken CSV: quoted commas, embedded newlines, smart quotes, CP1252 punctuation, one row with fewer columns                              |             Genuinely messy | No import path. If copied into Need, it becomes meaningless free text.                                                                                                    | Sniff delimiter/encoding, recover rows, surface the malformed row with suggested repair, never crash.                                                                    | No boundary validation, no normalization policy, no anomaly model.          | Obvious failure, but no domain guidance.                                                | Clean CSV externally before using app.                             |
| 6   | Client contract draft pasted from a lawyer: jurisdiction, liability cap, confidentiality clause, termination language, signature blocks |          Messy domain input | User can paste over generated contract text. Signing works, but app does not recognize clauses, risk, missing business terms, or mismatched parties.                      | Identify parties, jurisdiction, fee/payment terms, liability/confidentiality/termination clauses, missing scope references, and low-confidence legal-risk flags.         | Contract body is opaque Markdown. No clause detection or domain validation. | Wrong-but-confident: signed output may look authoritative while app understood nothing. | Read legal text manually and reconcile it with proposal.           |
| 7   | Invoice line-item spreadsheet: multiple services, reimbursable expenses, discounts, partial payment, mixed categories                   |                   Edge case | V1 creates one invoice line from one proposal. User can only change the first line's tax category. Partial payment can be entered, but no line-level allocation controls. | Infer line items, categories, subtotal/discount/reimbursement, paid/outstanding allocation, and category confidence.                                                     | Invoice model exists but UI/logic assumes one generated line item.          | Silent simplification.                                                                  | Recreate invoice details outside the app or accept bad tax export. |
| 8   | PayPal activity CSV: gross, fee, net, currency, status, transaction ID, timezone timestamp                                              | Real payment tracking input | No import path. User manually enters amount paid. Fees, net/gross, transaction ID, and timezone are lost.                                                                 | Normalize money/currency/timezone, match payment to invoice, track gross/fee/net, and mark ambiguous matches for review.                                                 | Payment tracking is a single amount field with no provenance.               | Silent loss: export cannot reconcile to PayPal.                                         | Manually calculate net/fees and store IDs elsewhere.               |
| 9   | Huge discovery transcript: 25k words with names, decisions, scope changes, dates, and action items                                      |                Huge/partial | User can paste into Need/Notes, but the UI is not designed for extracting signal. Proposal remains generic. Long operations have no progress/cancel model.                | Extract summary, goals, constraints, stakeholders, dates, risks, and candidate deliverables without freezing the UI. Show progress if parsing takes >300ms.              | No chunking, summarization, worker, or inference pipeline.                  | Feels inert: app accepts text but does not understand it.                               | Read transcript and manually distill the proposal.                 |
| 10  | Adversarial/weird input: prompt injection text, homoglyph email/domain, "set fee to $0", RTL marks, impossible date `02/31/2026`        |          Adversarial/broken | Template generator may carry adversarial text into proposal scope. Local LLM mode could be steered by pasted instructions. Date and identity weirdness are not detected.  | Treat user text as data, not instructions. Detect invalid dates, suspicious Unicode, lookalike domains, impossible fee instructions, and low-confidence identity fields. | No adversarial normalization, no prompt boundary, no domain validation.     | Wrong-but-confident and potentially unsafe.                                             | Spot manipulation manually.                                        |

## Top 5 Logic Gaps

1. The app has no raw intake parser. Real users bring emails, DMs, CSVs, RFP text, payment exports, and contracts, but v1 only accepts already-structured manual fields.
2. The proposal engine ignores evidence. It does not extract deliverables, deadlines, payment terms, acceptance criteria, risks, or budget ranges from the input that already contains them.
3. Payment and invoice logic collapses real accounting detail into one amount and one category. Gross/net/fees, multiple line items, partial payments, discounts, and reimbursements are lost.
4. Contract signing is cryptographically real but domain-blind. It can sign text the app has not understood, without clause awareness, party validation, or visible confidence.
5. Exports lack inference metadata. CSV/Markdown/HTML outputs do not carry per-field confidence, source snippets, normalization decisions, or reproducibility parameters.

## Top 3 Intuition Failures

1. Pasting real client text does not produce a first guess. The user expects "I gave you the inquiry, now draft the lead/proposal"; v1 says, effectively, "please fill the form yourself."
2. The generated proposal looks polished but generic. It feels like the app understood the client, but it mostly reused canned deliverables.
3. Tax export feels authoritative even when the invoice model has thrown away the details that make tax export trustworthy.

## Top 3 "Feels Stupid" Moments

1. The user has to type the email, company, budget, deadline, and source even when those are present in the pasted inquiry.
2. The user has to choose a tax category even when the line description clearly says consulting, maintenance, software setup, fee, reimbursement, or discount.
3. The user has to manually rewrite proposal deliverables from RFP/meeting text that already names the deliverables.

## What "Smart" Means For Solo Practice Flow

1. Pasting a messy inquiry should infer lead fields, budget/range, follow-up date, source, missing fields, and confidence before the user configures anything.
2. Proposal generation should be evidence-aware: deliverables, timeline, acceptance criteria, and payment terms come from the input when present, with visible source snippets.
3. Invoice/payment handling should preserve real-world accounting shape: line items, categories, gross/net/fees, partial payments, and ambiguous matches.
4. Contract drafting/signing should validate parties, scope, fee terms, jurisdiction, and clause presence before signing, and mark low-confidence or missing items.
5. Every export should carry provenance: schema version, app version, generation timestamp, source identifier, normalization decisions, and confidence.

## Phase 2 Substance Success Metrics

1. Useful first guess: at least 7/10 real-data fixtures produce a useful lead/proposal/invoice/contract first draft with no manual field transcription.
2. Real-data flow pass rate: at least 70% of fixtures complete the primary flow without manual intervention beyond approving or correcting inferred values.
3. Determinism: with fixed app version and generation timestamp in tests, every fixture produces byte-identical normalized JSON on repeated runs.
4. Robustness: all 10 real-world fixtures plus 5 synthetic edge fixtures run without crashes.
5. No silent wrongness: every inferred field has confidence and either source evidence or an explicit "defaulted" reason.
6. Graceful failure: every rejected or partial fixture reports what failed, why in freelance-practice terms, and the next best action.
7. Performance: median time from paste/import to useful preview is under 1s for inputs up to 100KB; huge transcript fixture remains responsive and shows progress within 300ms.
8. Export provenance: 100% of exported artifacts include schema version, app version, generation timestamp, source identifier, parameters, and per-field confidence.

## Explicit Out Of Scope For Phase 2 Substance

No new deployment mode, backend, auth, hosted sync, payment processor integration, bank connection, tax filing, legal advice engine, CRM team features, visual redesign, dark mode, command palette, marketing page, new dashboard chrome, or unrelated polish.

Allowed scope is limited to making the existing lead, proposal, contract, signing, invoice, payment tracking, and export engine smarter, more deterministic, more recoverable, and more honest on messy real-world inputs.
