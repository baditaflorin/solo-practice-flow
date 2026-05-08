# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs and must avoid noisy production console output.

## Decision

Use minimal browser console logging only for exceptional developer-facing failures during lazy capability loading. User-facing errors appear in the UI with recovery options.

## Consequences

Production remains quiet. Debuggability relies on clear UI messages and reproducible local actions.

## Alternatives Considered

Remote logging was rejected because it would introduce analytics-like collection and possible PII handling.
