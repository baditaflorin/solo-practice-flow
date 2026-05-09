# Phase 3 Completeness Plan

Date: 2026-05-10

## Priority Order

This plan prioritizes work that lets a stranger bring their own inquiry data into the app, complete the existing practice flow, and take a durable result back out. The implementation keeps the Phase 2 inference engine intact.

| Rank | Catalog Item                                | Decision                                  | User Impact                                                                      | Evidence                     |
| ---- | ------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- |
| 1    | 1. File upload, drag/drop, paste pathways   | implement                                 | Users can start from their own files instead of hand-copying into the textarea.  | Input audit red/yellow rows  |
| 2    | 6. Clipboard read with fallback             | implement                                 | Paste becomes one click when browser permissions allow it.                       | Input audit clipboard row    |
| 3    | 4. Multi-file input                         | implement                                 | Consultants can combine emails, RFP notes, and CSV snippets in one intake.       | Input audit multi-file row   |
| 4    | 2. Format detection on input                | implement                                 | Users see what the app thinks they loaded and can correct by pasting plain text. | Input audit format gap       |
| 5    | 7. Sample and user data equally first-class | implement                                 | Demo remains useful without being the only polished path.                        | Input audit sample row       |
| 6    | 8. Resume/start fresh                       | implement                                 | "Start fresh" clears real workspace state and transient intake.                  | Controls audit reset row     |
| 7    | 9. Export/import round-trip                 | implement                                 | Backup export becomes real portability.                                          | Output audit JSON backup row |
| 8    | 11. Downloadable state file                 | implement                                 | State file captures enough metadata to restore later.                            | ADR 0004 mismatch            |
| 9    | 16. Finish encrypted restore                | implement                                 | age backup claim becomes complete.                                               | Output audit age row         |
| 10   | 36. Validate import boundaries              | implement                                 | Broken backups fail clearly without corrupting the workspace.                    | Codebase audit boundary gap  |
| 11   | 39. Persistence migrations                  | implement                                 | Older backups continue to load as the schema evolves.                            | Persistence completeness     |
| 12   | 41. Export/import deterministic round-trip  | implement                                 | The app can prove state portability.                                             | Phase 3 metric               |
| 13   | 10. Copy-to-clipboard outputs               | implement                                 | Users can paste proposal, contract, invoice, and CSV into other tools.           | Output audit copy row        |
| 14   | 13. Print current document                  | implement                                 | Proposals/contracts/invoices can be printed or saved to PDF.                     | Output audit print row       |
| 15   | 12. Shareable URL for small intake          | implement with limit                      | Lightweight handoff works without a server.                                      | Output audit share row       |
| 16   | 14. Automation-ready JSON                   | implement as documented envelope          | Scripts can consume a stable JSON export.                                        | Output audit API row         |
| 17   | 15. Half-baked feature triage               | implement                                 | Users stop seeing claims that are only partially true.                           | Findings table               |
| 18   | 18. Settings completeness                   | implement by keeping settings limited     | No placeholder toggles.                                                          | Controls audit               |
| 19   | 19. Help/docs alignment                     | implement                                 | README and ADRs stop overpromising.                                              | Feature claims audit         |
| 20   | 20. DRY consolidation                       | implement for import/export helpers       | New IO code has one source of truth.                                             | Codebase audit               |
| 21   | 23. Shared validation schemas               | implement                                 | Export and import agree on state boundaries.                                     | Codebase audit               |
| 22   | 24. Split god module where cheap            | implement targeted extraction only        | New import/export logic stays out of `PracticeApp.tsx`.                          | Codebase audit               |
| 23   | 28. Delete dead assets                      | implement                                 | Starter files no longer distract audits.                                         | Codebase audit               |
| 24   | 31. Error-handling convention               | implement for new user-facing IO paths    | Failed imports give what/why/next step.                                          | Phase 3 bar                  |
| 25   | 32. State-management convention             | document and apply to restore/start-fresh | Transient intake and persisted workspace are intentionally separated.            | ADR 0067                     |
| 26   | 35. Maintain zero `any`                     | implement                                 | Type holes stay closed.                                                          | Codebase audit               |
| 27   | 38. Save really saves                       | test                                      | Restore and reset persist across reload.                                         | Persistence completeness     |
| 28   | 40. Clear-state operation                   | implement                                 | Users can start over deliberately.                                               | Controls audit               |
| 29   | 42. README verified checklist               | implement                                 | Claims have matching app/test coverage.                                          | Feature claims audit         |
| 30   | 43. Quickstart works                        | verify                                    | New user reaches the core flow locally.                                          | Documentation audit          |
| 31   | 45. Honest limitations                      | implement                                 | Users know CORS, OCR, payment ledger, and legal limits up front.                 | Findings                     |
| 32   | 46. Stranger test                           | execute                                   | Private-window workflow catches dead ends.                                       | Mandatory                    |
| 33   | 47. Fix top 3 stranger issues               | implement                                 | The final pass closes the worst observed usability gaps.                         | Mandatory                    |

## Explicit Out Of Scope

URL scraping, folder upload, image OCR, payment processor synchronization, a hosted sharing service, cross-device sync, legal advice, visual redesign, and inference engine rewrites remain out of scope for Phase 3. Each out-of-scope input/output row will be green only by being explicitly documented as unsupported in the UI or docs.

## Commit Strategy

1. Commit audits.
2. Commit this plan.
3. Commit ADR batch.
4. Commit input completeness.
5. Commit restore/import completeness.
6. Commit output completeness.
7. Commit code health and docs alignment.
8. Commit tests, smoke updates, version bump, postmortem, and Pages build.
