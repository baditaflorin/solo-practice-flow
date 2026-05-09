# Phase 3 Output Pathway Audit

Date: 2026-05-10

| Output pathway         | Status before | Status after | Evidence                                                                                   | Phase 3 disposition                                        |
| ---------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| JSON workspace backup  | yellow        | green        | Downloads provenance envelope and restores current or legacy raw state through one parser. | Finished with restore and round-trip tests.                |
| age-encrypted backup   | yellow        | green        | Downloads encrypted text and restores after passphrase decrypt.                            | Finished.                                                  |
| Tax CSV                | green         | green        | `Tax CSV` button downloads deterministic rows with provenance.                             | Keep and test.                                             |
| DuckDB CSV             | yellow        | yellow       | Works when DuckDB-WASM loads; fallback CSV exists. Not validated by smoke.                 | Keep; add failure-safe docs.                               |
| Markdown document      | yellow        | yellow       | Downloads proposal/contract/invoice Markdown with provenance. No copy option.              | Add copy-to-clipboard.                                     |
| Pandoc HTML document   | yellow        | yellow       | Downloads standalone HTML if CDN module loads. No offline HTML fallback beyond Markdown.   | Keep with docs; Markdown remains fallback.                 |
| ICS reminder           | green         | green        | Downloads calendar file for active lead.                                                   | Keep and test.                                             |
| Copy-to-clipboard      | gray          | gray         | No output copy controls.                                                                   | Build for current document and tax CSV.                    |
| Shareable URL          | gray          | gray         | No hash/share output.                                                                      | Build raw-intake share link with documented size limit.    |
| Print/PDF view         | gray          | gray         | Browser can print page, but no print-focused document action.                              | Build print current document.                              |
| Screenshot             | gray          | gray         | No claim and not needed for business workflow.                                             | Out of scope.                                              |
| Embed code             | gray          | gray         | No claim and not applicable.                                                               | Out of scope.                                              |
| API/curl-ready output  | red/yellow    | yellow       | Backup schema is now round-trippable; docs and copy action still pending.                  | Document stable JSON envelope and add copyable JSON state. |
| Signed contract export | green         | green        | Markdown export includes signature if contract active.                                     | Keep.                                                      |

Before summary: 3 green, 6 yellow/red, 5 gray.

Current summary after restore work: 5 green, 4 yellow, 5 gray.

Success target: every claimed export has either a working action and round-trip path or a documented fallback/out-of-scope rationale.
