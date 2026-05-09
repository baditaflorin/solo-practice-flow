# Phase 2 Substance Performance Notes

Date: 2026-05-09

## Budgets

| Operation                                      |                      Budget | Implementation                                                                         |
| ---------------------------------------------- | --------------------------: | -------------------------------------------------------------------------------------- |
| Paste-to-preview intake inference up to 100 KB |                  median <1s | Synchronous deterministic parser, memoized by React on raw input                       |
| Real-data fixture worst case                   |                         <1s | Tested by `src/features/practice/inference.performance.test.ts`                        |
| Operations over 300 ms                         |          visible busy state | Proposal, signature, age, DuckDB, and Pandoc paths set `busy`                          |
| Operations over 5 s                            | cancellable if long-running | No Phase 2 inference path reaches this threshold; runtime backend remains out of scope |

## Measurements

Command:

```sh
npm run test -- src/features/practice/inference.performance.test.ts src/features/practice/validation.test.ts
```

Observed on 2026-05-09:

| Measurement                                                   |                     Result |
| ------------------------------------------------------------- | -------------------------: |
| Real-data fixture performance test                            |                     passed |
| Fixtures analyzed                                             |                         10 |
| Median assertion                                              |                   <1000 ms |
| Worst-case assertion                                          |                   <1000 ms |
| Vitest reported test-body time for perf plus validation tests | 19-76 ms across local runs |

The huge transcript fixture is intentionally treated as a large/partial input and remains under the same synchronous budget locally. If a future fixture crosses 300 ms, the next implementation should move inference into a Web Worker and surface progress rather than making the main thread wait.

## Hot Paths

The current hot paths are:

1. CSV row parsing and malformed-row recovery.
2. Repeated regular-expression extraction for money, dates, contact details, and clauses.
3. Evidence/anomaly assembly for large transcript text.

These are still small enough for the Phase 2 fixture set. The performance test is the regression tripwire.
