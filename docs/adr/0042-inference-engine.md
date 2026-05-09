# 0042 - Inference Engine

## Status

Accepted

## Context

The app needs useful first guesses without a backend or hosted model.

## Decision

Use a deterministic browser inference engine based on normalization, pattern matching, lightweight scoring, field evidence, and domain heuristics. Optional local LLM remains enrichment only; deterministic inference is the source of truth for tests and exports.

## Consequences

Inference is fast, inspectable, and reproducible. It will not understand every input, so confidence and anomalies must be visible.

## Alternatives Considered

Relying on local LLM output was rejected because it is non-deterministic and not always available.
