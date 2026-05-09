# Phase 3 Findings Synthesis

Date: 2026-05-10

## Top 5 Usability Gaps

1. Users cannot load files directly; they must manually open and paste content.
2. Users can export JSON/age backups but cannot restore them.
3. Current document output cannot be copied, printed, or shared without downloading first.
4. Reset wording is ambiguous for a real workspace.
5. Payment tracking is overclaimed; the UI tracks paid amount/status, not a ledger.

## Top 5 Half-Baked Features

| Feature                            | Decision    | Rationale                                                        |
| ---------------------------------- | ----------- | ---------------------------------------------------------------- |
| JSON backup export without import  | finish      | Export-only backup is not real data portability.                 |
| age backup export without restore  | finish      | Encryption claim is incomplete without decrypt/restore.          |
| Smart intake only through textarea | finish      | Real users start with files and clipboard.                       |
| Payment tracking claim             | hide/reword | A payment ledger is new scope; reword as invoice payment status. |
| Reset demo label                   | finish      | Real users need a clear start-fresh action.                      |

## Top 5 Codebase Pain Points

1. `PracticeApp.tsx` is a god component.
2. Import/export boundaries are weaker than export generation.
3. Date helpers are scattered.
4. Dead starter assets remain.
5. README/docs drift forces users to guess what is actually shipped.

## Top 5 Documentation/Reality Mismatches

1. "Payment tracking" sounds like PayPal/ledger import; current app only tracks invoice paid amount.
2. "IndexedDB/OPFS-friendly" implies OPFS usage; current app uses IndexedDB/Yjs.
3. ADR 0004 says backup import is possible; implementation lacks it.
4. Phase 2 docs mention payment/invoice CSV intelligence but the UI only reviews, not imports them.
5. The v1 postmortem wording around visible commit is stronger than a static Pages build can guarantee.

## Fully Usable Definition

1. A consultant can load a real inquiry/RFP/CSV from paste, file, drag/drop, clipboard, or sample fixture.
2. They can approve the inferred lead, generate proposal/contract/invoice, sign, and export without leaving the app.
3. They can restore a saved workspace backup, including encrypted backup, on another browser.
4. They can copy, print, download, and share reasonable outputs.
5. The README tells the truth about limitations before a user hits them.

## Phase 3 Success Metrics

1. Input audit: every claimed input green; URL/image/folder explicitly out of scope.
2. Output audit: every claimed output green or documented fallback/out-of-scope.
3. Restore round-trip test passes for JSON envelope and encrypted backup helpers.
4. Smoke test covers smart intake, file-like data path, document generation, and exports.
5. Codebase health: dead starter assets removed; `any` and `@ts-ignore` remain zero; TODO remains zero.

## Out Of Scope

No backend, hosted sync, OCR, URL scraping proxy, payment processor integration, payment ledger, bank import, legal advice engine, visual redesign, dark mode, command palette, or inference engine rewrite.
