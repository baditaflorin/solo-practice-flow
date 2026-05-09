# 0046 - Performance Budgets

## Status

Accepted

## Context

Smart intake must feel immediate on common inputs and honest on large inputs.

## Decision

Target under 1s median analysis for inputs up to 100KB. Show progress or busy state for actions over 300ms. Huge-input cliff and measurements are documented under `docs/phase2-substance/perf.md`.

## Consequences

The first implementation remains main-thread deterministic heuristics, with a documented future worker path if huge inputs exceed budget.

## Alternatives Considered

Moving all parsing to a worker immediately was deferred because fixture inputs are small enough and browser worker plumbing would slow the first substance pass.
