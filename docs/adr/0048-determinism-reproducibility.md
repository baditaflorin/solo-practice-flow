# 0048 - Determinism And Reproducibility

## Status

Accepted

## Context

Same input must produce same normalized output in tests.

## Decision

Inference uses deterministic ordering, stable IDs from input hashes, explicit timestamps supplied by callers for tests, and locale-independent parsing/formatting. Exports include provenance metadata.

## Consequences

Fixture tests can compare output properties and stable IDs. Runtime exports remain traceable even when generated at different times.

## Alternatives Considered

Using random UUIDs for inferred entities was rejected for inference output.
