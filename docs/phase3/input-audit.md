# Phase 3 Input Pathway Audit

Date: 2026-05-10

Mode: A, GitHub Pages only.

Status meanings: green = works fully, yellow = works partially, red = claimed but broken, gray = not built and not claimed.

| Input pathway                            | Status before | Evidence                                                                              | Phase 3 disposition                                                           |
| ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Typed raw intake text                    | green         | `Raw intake` textarea analyzes pasted/typed text with confidence and evidence.        | Keep and test.                                                                |
| Browser paste into textarea              | green         | Native paste works because the field is a textarea.                                   | Keep and document.                                                            |
| File upload for intake text/CSV/Markdown | gray          | No file picker exists. Users must open files elsewhere and copy text.                 | Build.                                                                        |
| Drag/drop file intake                    | gray          | No drop target exists.                                                                | Build.                                                                        |
| Multi-file/batch intake                  | gray          | No batch path exists.                                                                 | Build as concatenated batch with per-file summary.                            |
| Mobile Files picker                      | gray          | No file input exists.                                                                 | Covered by file input once built; direct device test unavailable in this run. |
| Clipboard read button                    | gray          | No `navigator.clipboard.readText()` path exists.                                      | Build with permission fallback to textarea paste.                             |
| HTML paste/import                        | yellow        | Textarea accepts rendered text but there is no HTML label or route.                   | Support as text; document that rendered HTML should be pasted.                |
| Image paste/OCR                          | gray          | No OCR claim and no image parser.                                                     | Permanently out of scope for Mode A v3; no OCR engine.                        |
| URL input                                | gray          | No URL field exists; Pages cannot fetch arbitrary sites because of CORS.              | Document as out of scope; tell users to paste rendered page text/HTML.        |
| Folder import                            | gray          | No folder picker.                                                                     | Out of scope for a single-workspace Mode A app.                               |
| Sample/demo data                         | yellow        | Seed demo lead exists, but real fixture sample loader is not first-class.             | Build a load-sample-intake control.                                           |
| Deep links                               | gray          | No hash/query state input.                                                            | Build small raw-intake share link only.                                       |
| Imported JSON backup                     | red           | JSON backup export exists; restore is absent.                                         | Build.                                                                        |
| Imported encrypted backup                | red           | age-encrypted export exists; decrypt/restore path absent despite encryption claim.    | Build.                                                                        |
| Restored autosave                        | green         | IndexedDB/Yjs workspace restores on reload.                                           | Keep and test.                                                                |
| Clear/start fresh                        | yellow        | Reset demo exists but label implies demo reset, not a real start-fresh/factory reset. | Rename/clarify and clear transient intake.                                    |

Before summary: 3 green, 4 yellow/red, 10 gray.

Success target: all claimed pathways green; URL/image/folder pathways explicitly out of scope in ADR 0061 and README limitations.
