# 0067 - State Management Convention

## Status

Accepted

## Context

The app has two state classes: durable workspace state persisted through Yjs/IndexedDB and transient browser state such as raw intake text, busy flags, toasts, backup passphrases, and drag state.

## Decision

Durable practice data remains in `PracticeState` and persists through `usePracticeWorkspace`. Transient inputs stay in component state unless they are explicitly exported or loaded from a share URL. "Start fresh" resets both durable workspace state and transient intake state.

## Consequences

Users do not lose generated proposals, contracts, invoices, and signatures across reloads. Short-lived secrets such as passphrases are never persisted.

## Alternatives Considered

Persisting raw intake text automatically was rejected because intake may contain sensitive client material that is not needed once the user approves inferred lead data.
