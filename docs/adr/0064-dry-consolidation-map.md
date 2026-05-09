# 0064 - DRY Consolidation Map

## Status

Accepted

## Context

The audit found that new Phase 3 work could easily add more IO logic to the already large `PracticeApp.tsx` component. Existing core duplication is low, but import/export boundaries need a single source of truth.

## Decision

Phase 3 will add dedicated import/export helper modules for intake file handling, share-link encoding, state backup parsing, and user-facing IO errors. UI code will call these helpers instead of duplicating parsing or formatting logic inline.

## Consequences

The god component does not get meaningfully worse while still avoiding a broad refactor of the Phase 2 engine.

## Alternatives Considered

Splitting the whole practice application component was rejected for Phase 3 because it would be high-risk refactoring unrelated to the completeness gaps.
