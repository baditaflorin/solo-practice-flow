# Phase 3 Codebase Health Audit

Date: 2026-05-10

Measurement-only pass before implementation.

## DRY Violations

| Area                                 | Paths                                                           | Finding                                                     | Decision                                                                     |
| ------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Date helpers                         | `PracticeApp.tsx`, `documents.ts`, `seed.ts`, `calculations.ts` | Multiple `todayIso`/ISO date helpers with slight variation. | Consolidate where it does not disturb domain tests.                          |
| Download/export payload construction | `PracticeApp.tsx`, `lib/provenance.ts`, `lib/duckdb.ts`         | UI builds several export payloads inline.                   | Extract import/export envelope boundary helpers.                             |
| Activity/toast/error messages        | `PracticeApp.tsx`                                               | Repeated `setToast`/fallback patterns.                      | Centralize only if it reduces code; do not over-abstract.                    |
| Validation anomaly shape             | `validation.ts`, `inference.ts`                                 | Both create `IntakeAnomaly` with similar fields.            | Accept duplication for now; inference and validation have different domains. |

## SOLID Violations

| Module                                  | Evidence                                                                              | Risk                                                | Decision                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/features/practice/PracticeApp.tsx` | 1643 lines; state, input, output, rendering, settings, and debug UI in one component. | Every UI change touches one file.                   | Split IO/import/export helpers first; full component split deferred unless low-risk. |
| `src/features/practice/inference.ts`    | 876 lines; normalization, CSV parsing, classification, field extraction, scoring.     | Hard to reason about, but Phase 2 engine is locked. | Document and avoid engine refactor in Phase 3.                                       |
| `src/lib/storage.ts`                    | Parses, migrates, serializes, persists Yjs.                                           | Boundary code needs stronger backup import schema.  | Add import/restore boundary helpers.                                                 |

## Dead Code

| Item                                          | Evidence                                  | Decision                         |
| --------------------------------------------- | ----------------------------------------- | -------------------------------- |
| `src/assets/react.svg`, `src/assets/vite.svg` | Not referenced by app.                    | Delete.                          |
| `src/assets/hero.png`                         | Not referenced by app or docs screenshot. | Delete if unreferenced by build. |
| `decryptTextWithPassphrase`                   | Exported but unused.                      | Use for encrypted restore.       |

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

1. Export actions build provenance inline while storage parsing uses a separate boundary.
2. Reset language says "demo" even though it resets real workspace data.
3. README and postmortem call payment tracking broader than the UI actually supports.

## Test Coverage Holes

1. No restore/import tests.
2. No file/clipboard input tests.
3. No copy/print/share output tests.
4. Smoke does not exercise reset/start-fresh or restore.
5. DuckDB fallback is not forced in tests.

Before health metrics: 4 DRY findings, 3 SOLID findings, 3 dead-code candidates, 0 TODO markers, 0 `any`, 0 `@ts-ignore`.
