# Phase 3 Controls Audit

Date: 2026-05-10

| Control                               | Status before | Handler/evidence                                                                                 | Decision                                          |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Star repo link                        | green         | Opens GitHub repository.                                                                         | Keep.                                             |
| PayPal link                           | green         | Opens PayPal support URL.                                                                        | Keep.                                             |
| Raw intake textarea                   | green         | Updates analysis through `analyzeIntake`.                                                        | Keep.                                             |
| Smart intake Apply                    | green         | Copies inferred fields into lead draft.                                                          | Keep.                                             |
| Capture                               | green         | Saves lead to IndexedDB/Yjs workspace.                                                           | Keep.                                             |
| Lead cards                            | green         | Select active lead.                                                                              | Keep.                                             |
| Lead status select                    | green         | Persists status.                                                                                 | Keep.                                             |
| Generate proposal                     | green         | Builds evidence-aware proposal, local LLM optional.                                              | Keep.                                             |
| Proposal title/scope/deliverables/fee | green         | Persist edits.                                                                                   | Keep.                                             |
| Draft contract                        | green         | Creates contract from proposal.                                                                  | Keep.                                             |
| Contract Markdown editor              | green         | Persists edits and clears stale signature.                                                       | Keep.                                             |
| Sign                                  | green         | Ed25519 signs current Markdown.                                                                  | Keep.                                             |
| Verify                                | green         | Verifies stored signature.                                                                       | Keep.                                             |
| Create invoice                        | yellow        | Creates one generated line item only; invoice CSV analysis is not converted into editable lines. | Keep as proposal invoice; document limitation.    |
| Invoice status/paid/category          | green         | Persists and tax-category correction memory works.                                               | Keep.                                             |
| JSON backup                           | yellow        | Downloads backup but no restore control.                                                         | Finish.                                           |
| Tax CSV                               | green         | Downloads CSV.                                                                                   | Keep.                                             |
| DuckDB CSV                            | yellow        | Downloads when WASM available, fallback if not.                                                  | Keep.                                             |
| Markdown                              | yellow        | Downloads but no copy/print.                                                                     | Finish output helpers.                            |
| Pandoc HTML                           | yellow        | Lazy CDN conversion, no offline HTML fallback.                                                   | Keep with Markdown fallback.                      |
| ICS                                   | green         | Downloads reminder when active lead exists.                                                      | Keep.                                             |
| age passphrase + Encrypted backup     | yellow        | Exports only; no decrypt/restore.                                                                | Finish.                                           |
| Practice settings fields              | green         | Business, owner, payment, currency, tax year, local LLM settings persist.                        | Keep.                                             |
| Reset demo                            | yellow        | Resets whole workspace, but label is ambiguous and transient intake remains.                     | Rename to Start fresh and clear transient intake. |
| Debug panel (`?debug=1`)              | green         | Shows metadata.                                                                                  | Keep behind query flag.                           |

Before summary: 16 green, 9 yellow, 0 red.
