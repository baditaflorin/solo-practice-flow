# 0040 - Real-Data Audit Findings And Substance Metrics

## Status

Accepted

## Context

The v1 flow works after manual transcription, but real users bring messy inquiries, CSVs, RFPs, contract drafts, payment exports, and transcripts.

## Decision

Use the 10 real-data fixtures in `test/fixtures/realdata/` as the Phase 2 grading rubric. The primary success metric is a useful first guess on at least 7/10 fixtures, with deterministic normalized output and no crashes.

## Consequences

Substance work is judged by fixture behavior, not demo smoothness. Any regression in fixture pass rate blocks shipping unless another ADR explains the tradeoff.

## Alternatives Considered

Ad hoc manual QA was rejected because it is not repeatable. Synthetic-only tests were rejected because they would recreate the Phase 1 toy problem.
