# Phase 3 Codebase Health Audit

Date: 2026-05-10

Initial pass before implementation, followed by the Phase 3 health update.

## DRY Violations

| Area                                 | Paths                                                           | Finding                                                     | Decision                                                                     |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Date helpers                         | `PracticeApp.tsx`, `documents.ts`, `seed.ts`, `calculations.ts` | Multiple `todayIso`/ISO date helpers with slight variation. | Consolidate where it does not disturb domain tests.                          |
| Download/export payload construction | `PracticeApp.tsx`, `lib/provenance.ts`, `lib/duckdb.ts`         | UI builds several export payloads inline.                   | Improved by shared backup parser, tax CSV helper, and printable helper.      |
| Activity/toast/error messages        | `PracticeApp.tsx`                                               | Repeated `setToast`/fallback patterns.                      | Accepted; toasts are simple UI boundary behavior, not core duplication.      |
| Validation anomaly shape             | `validation.ts`, `inference.ts`                                 | Both create `IntakeAnomaly` with similar fields.            | Accept duplication for now; inference and validation have different domains. |

## SOLID Violations

| Module                                  | Evidence                                                                                   | Risk                                                | Decision                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/features/practice/PracticeApp.tsx` | Large component; state, input, output, rendering, settings, and debug UI in one component. | Every UI change touches one file.                   | IO/import/export helpers split out; full component split deferred.              |
| `src/features/practice/inference.ts`    | 876 lines; normalization, CSV parsing, classification, field extraction, scoring.          | Hard to reason about, but Phase 2 engine is locked. | Document and avoid engine refactor in Phase 3.                                  |
| `src/lib/storage.ts`                    | Parses, migrates, serializes, persists Yjs.                                                | Boundary code needs stronger backup import schema.  | Completed through `workspaceImport.ts`; storage remains local persistence only. |

## Dead Code

| Item                                          | Evidence                                  | Decision                    |
| --------------------------------------------- | ----------------------------------------- | --------------------------- |
| `src/assets/react.svg`, `src/assets/vite.svg` | Not referenced by app.                    | Deleted.                    |
| `src/assets/hero.png`                         | Not referenced by app or docs screenshot. | Deleted.                    |
| `decryptTextWithPassphrase`                   | Exported but unused.                      | Used for encrypted restore. |

## TODO/FIXME/XXX/HACK

No production TODO/FIXME/XXX/HACK markers found outside third-party/generated assets.

## Type Safety Holes

| Pattern      | Count/evidence                                           | Decision                                                            |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------------- |
| `as` casts   | Present in boundary code and event value unions.         | Keep event-union casts; add zod schemas for backup/import boundary. |
| `unknown`    | Used in storage parse catch boundary and error handling. | Accept where narrowed.                                              |
| `any`        | No app-source `any` found.                               | Keep zero.                                                          |
| `@ts-ignore` | None found.                                              | Keep zero.                                                          |

## Inconsistent Patterns

1. Export actions now share backup parser and copy/print helpers where useful.
2. Reset language now says "Start fresh" and clears transient state.
3. README and postmortem still need final payment-status wording updates.

## Test Coverage Holes

1. Restore/import tests now cover current envelope, legacy raw state, malformed JSON, and invalid shape.
2. File-style input helpers and share encoding are unit tested; smoke loads a real fixture through file input.
3. Printable HTML escaping is unit tested; clipboard remains browser-permission dependent.
4. Smoke does not exercise restore because browser file download/confirm flows would make it slower and brittle.
5. DuckDB fallback is not forced in tests.

Before health metrics: 4 DRY findings, 3 SOLID findings, 3 dead-code candidates, 0 TODO markers, 0 `any`, 0 `@ts-ignore`.

After health metrics: 2 accepted DRY findings, 2 accepted SOLID findings, 0 dead-code candidates, 0 TODO markers, 0 `any`, 0 `@ts-ignore`.
