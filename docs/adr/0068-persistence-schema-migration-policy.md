# 0068 - Persistence Schema And Migration Policy

## Status

Accepted

## Context

Backups need to survive app releases. v0.2 exports a provenance envelope containing `state`, while some users may save raw `PracticeState` JSON from development builds.

## Decision

The import boundary accepts the current provenance envelope and legacy raw practice state. It normalizes imported state with the same migration path used by IndexedDB load. Breaking persisted shape changes require a schema version bump and a test fixture proving old state is either migrated or rejected with an actionable error.

## Consequences

JSON backup restore and encrypted backup restore use the same parser. Future changes get one migration point rather than ad hoc import patches.

## Alternatives Considered

Only accepting the latest envelope was rejected because it would make early backups unrecoverable.
