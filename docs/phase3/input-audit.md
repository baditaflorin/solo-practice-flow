# Phase 3 Input Pathway Audit

Date: 2026-05-10

Mode: A, GitHub Pages only.

Status meanings: green = works fully, yellow = works partially, red = claimed but broken, gray = not built and not claimed.

| Input pathway                            | Status before | Status after | Evidence                                                                            | Phase 3 disposition                                                           |
| ---------------------------------------- | ------------- | ------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Typed raw intake text                    | green         | green        | `Raw intake` textarea analyzes pasted/typed text with confidence and evidence.      | Kept and covered by smoke.                                                    |
| Browser paste into textarea              | green         | green        | Native paste works because the field is a textarea.                                 | Kept.                                                                         |
| File upload for intake text/CSV/Markdown | gray          | green        | A multi-file picker loads text-like files directly into the intake path.            | Built.                                                                        |
| Drag/drop file intake                    | gray          | green        | Drop zone loads the same text-like file set as the picker.                          | Built.                                                                        |
| Multi-file/batch intake                  | gray          | green        | Multiple files are concatenated with visible per-file boundaries.                   | Built as concatenated batch with per-file summary.                            |
| Mobile Files picker                      | gray          | green        | Standard file input opens the platform file picker; direct phone test unavailable.  | Covered by file input; device-specific QA documented as a limitation.         |
| Clipboard read button                    | gray          | green        | Clipboard button uses `navigator.clipboard.readText()` with textarea fallback.      | Built with permission fallback.                                               |
| HTML paste/import                        | yellow        | green        | HTML is labeled by format detection and passed through the same intake engine.      | Supported as text; docs say to paste rendered HTML when URL fetch is blocked. |
| Image paste/OCR                          | gray          | gray         | No OCR claim and no image parser.                                                   | Permanently out of scope for Mode A v3; no OCR engine.                        |
| URL input                                | gray          | gray         | No URL field exists; Pages cannot fetch arbitrary sites because of CORS.            | Document as out of scope; tell users to paste rendered page text/HTML.        |
| Folder import                            | gray          | gray         | No folder picker.                                                                   | Out of scope for a single-workspace Mode A app.                               |
| Sample/demo data                         | yellow        | green        | A sample intake button loads a real fixture-like inquiry into the same intake path. | Built.                                                                        |
| Deep links                               | gray          | green        | `#intake=` hashes restore small raw-intake payloads.                                | Built for small raw-intake share links only.                                  |
| Imported JSON backup                     | red           | green        | JSON backups restore through the shared backup parser and replace local workspace.  | Built with round-trip unit tests.                                             |
| Imported encrypted backup                | red           | green        | age backups decrypt with the passphrase and restore through the same parser.        | Built with shared parser and actionable passphrase errors.                    |
| Restored autosave                        | green         | green        | IndexedDB/Yjs workspace restores on reload.                                         | Keep and test.                                                                |
| Clear/start fresh                        | yellow        | green        | Start fresh resets the workspace and clears transient intake/passphrase state.      | Renamed and completed.                                                        |

Before summary: 3 green, 4 yellow/red, 10 gray.

Current summary after start-fresh work: 14 green, 3 intentionally unsupported gray.

Success target: all claimed pathways green; URL/image/folder pathways explicitly out of scope in ADR 0061 and README limitations.
