# Phase 3 Output Pathway Audit

Date: 2026-05-10

| Output pathway         | Status before | Status after | Evidence                                                                                   | Phase 3 disposition                                     |
| ---------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| JSON workspace backup  | yellow        | green        | Downloads provenance envelope and restores current or legacy raw state through one parser. | Finished with restore and round-trip tests.             |
| age-encrypted backup   | yellow        | green        | Downloads encrypted text and restores after passphrase decrypt.                            | Finished.                                               |
| Tax CSV                | green         | green        | `Tax CSV` button downloads deterministic rows with provenance.                             | Keep and test.                                          |
| DuckDB CSV             | yellow        | green        | Works when DuckDB-WASM loads; fallback CSV exists if the WASM module cannot initialize.    | Kept with failure-safe behavior.                        |
| Markdown document      | yellow        | green        | Downloads and copies proposal/contract/invoice Markdown with provenance.                   | Copy-to-clipboard added.                                |
| Pandoc HTML document   | yellow        | green        | Downloads standalone HTML if CDN module loads; Markdown remains the explicit fallback.     | Kept with fallback docs.                                |
| ICS reminder           | green         | green        | Downloads calendar file for active lead.                                                   | Keep and test.                                          |
| Copy-to-clipboard      | gray          | green        | Current document, tax CSV, and automation JSON can be copied with permission fallback.     | Built for current document, tax CSV, and JSON state.    |
| Shareable URL          | gray          | green        | Raw-intake share action copies a size-limited `#intake=` URL.                              | Built raw-intake share link with documented size limit. |
| Print/PDF view         | gray          | green        | Current document opens in a focused printable window using escaped document text.          | Built print current document.                           |
| Screenshot             | gray          | gray         | No claim and not needed for business workflow.                                             | Out of scope.                                           |
| Embed code             | gray          | gray         | No claim and not applicable.                                                               | Out of scope.                                           |
| API/curl-ready output  | red/yellow    | green        | Automation JSON envelope can be copied and restored through the same parser.               | Stable JSON envelope documented in README and docs.     |
| Signed contract export | green         | green        | Markdown export includes signature if contract active.                                     | Keep.                                                   |

Before summary: 3 green, 6 yellow/red, 5 gray.

Current summary after output work: 12 green, 2 intentionally unsupported gray.

Success target: every claimed export has either a working action and round-trip path or a documented fallback/out-of-scope rationale.
