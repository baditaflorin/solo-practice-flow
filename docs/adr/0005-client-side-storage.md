# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app needs offline persistence without accounts or hosted sync.

## Decision

Store the workspace in IndexedDB using `idb`. Use Yjs as the in-memory collaborative document model and persist encoded Yjs updates to IndexedDB. Keep small UI preferences in the workspace settings rather than `localStorage`.

## Consequences

The state model can evolve toward sync later without forcing a server in v1. Users retain control of their local data.

## Alternatives Considered

`localStorage` was rejected for size and reliability. OPFS is attractive for large files but unnecessary for v1 structured records.
