# Phase 3 Controls Audit

Date: 2026-05-10

| Control                               | Status before | Status after | Handler/evidence                                                                                 | Decision                                       |
| ------------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Star repo link                        | green         | green        | Opens GitHub repository.                                                                         | Keep.                                          |
| PayPal link                           | green         | green        | Opens PayPal support URL.                                                                        | Keep.                                          |
| Load files                            | gray          | green        | Loads one or more text-like files into raw intake.                                               | Built.                                         |
| Clipboard                             | gray          | green        | Reads clipboard text when permission is granted; falls back to textarea paste guidance.          | Built.                                         |
| Sample                                | yellow        | green        | Loads a realistic inquiry into the same raw intake path as user data.                            | Built.                                         |
| Share                                 | gray          | green        | Copies size-limited raw-intake `#intake=` URL.                                                   | Built.                                         |
| Raw intake textarea                   | green         | green        | Updates analysis through `analyzeIntake` and format detection.                                   | Keep.                                          |
| Smart intake Apply                    | green         | green        | Copies inferred fields into lead draft.                                                          | Keep.                                          |
| Capture                               | green         | green        | Saves lead to IndexedDB/Yjs workspace.                                                           | Keep.                                          |
| Lead cards                            | green         | green        | Select active lead.                                                                              | Keep.                                          |
| Lead status select                    | green         | green        | Persists status.                                                                                 | Keep.                                          |
| Generate proposal                     | green         | green        | Builds evidence-aware proposal, local LLM optional.                                              | Keep.                                          |
| Proposal title/scope/deliverables/fee | green         | green        | Persist edits.                                                                                   | Keep.                                          |
| Draft contract                        | green         | green        | Creates contract from proposal.                                                                  | Keep.                                          |
| Contract Markdown editor              | green         | green        | Persists edits and clears stale signature.                                                       | Keep.                                          |
| Sign                                  | green         | green        | Ed25519 signs current Markdown.                                                                  | Keep.                                          |
| Verify                                | green         | green        | Verifies stored signature.                                                                       | Keep.                                          |
| Create invoice                        | yellow        | yellow       | Creates one generated line item only; invoice CSV analysis is not converted into editable lines. | Keep as proposal invoice; document limitation. |
| Invoice status/paid/category          | green         | green        | Persists and tax-category correction memory works.                                               | Keep.                                          |
| JSON backup                           | yellow        | green        | Downloads backup and has matching restore control.                                               | Finished.                                      |
| Restore JSON                          | gray          | green        | Validates and restores current envelope or legacy raw state.                                     | Built.                                         |
| Tax CSV                               | green         | green        | Downloads CSV.                                                                                   | Keep.                                          |
| Copy CSV                              | gray          | green        | Copies tax CSV to clipboard with browser-permission fallback.                                    | Built.                                         |
| DuckDB CSV                            | yellow        | green        | Downloads when WASM available, fallback if not.                                                  | Keep.                                          |
| Markdown                              | yellow        | green        | Downloads with provenance; copy/print are available separately.                                  | Finished output helpers.                       |
| Copy doc                              | gray          | green        | Copies current proposal/contract/invoice Markdown with provenance.                               | Built.                                         |
| Print                                 | gray          | green        | Opens escaped current document in a print-focused window.                                        | Built.                                         |
| Pandoc HTML                           | yellow        | green        | Lazy CDN conversion, Markdown fallback remains explicit.                                         | Keep with Markdown fallback.                   |
| ICS                                   | green         | green        | Downloads reminder when active lead exists.                                                      | Keep.                                          |
| age passphrase + Encrypted backup     | yellow        | green        | Exports encrypted backup and restores encrypted backup with same passphrase field.               | Finished.                                      |
| Restore age                           | gray          | green        | Decrypts age file, validates JSON, and restores workspace.                                       | Built.                                         |
| Practice settings fields              | green         | green        | Business, owner, payment, currency, tax year, local LLM settings persist.                        | Keep.                                          |
| Start fresh                           | yellow        | green        | Resets workspace and clears transient intake/passphrase state.                                   | Renamed and completed.                         |
| Debug panel (`?debug=1`)              | green         | green        | Shows metadata.                                                                                  | Keep behind query flag.                        |

Before summary: 16 green, 9 yellow, 0 red.

After summary: 33 green, 1 documented yellow limitation, 0 red.
