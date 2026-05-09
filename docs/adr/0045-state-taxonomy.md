# 0045 - State Taxonomy And State Machine

## Status

Accepted

## Context

Phase 2 requires no half-loaded, half-saved, or stuck states.

## Decision

Document reachable states in `docs/phase2-substance/states.md`. Long-running actions use explicit `busy` keys, buttons disable duplicate actions, errors become recoverable messages, and every visible state has an exit.

## Consequences

The UI remains simple but intentional. Concurrency bugs are treated as logic bugs.

## Alternatives Considered

Adding a formal state machine library was rejected for v2 unless state complexity grows further.
