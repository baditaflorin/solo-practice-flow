# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Browser-only apps still need predictable recovery for storage, export, and lazy module failures.

## Decision

Return typed success/error results from service functions where practical. UI actions catch errors and render concise toasts. Export operations always offer a plain fallback when DuckDB, Pandoc, age, or local LLM calls fail.

## Consequences

Users can keep working when optional power features are unavailable. Unit tests can cover expected fallback behavior.

## Alternatives Considered

Throwing uncaught errors was rejected because it would make optional browser capability failures feel like app crashes.
