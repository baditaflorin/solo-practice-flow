# 0013 - Testing Strategy

## Status

Accepted

## Context

Checks must run locally through hooks, with no GitHub Actions.

## Decision

Use Vitest for unit tests, Testing Library for component tests, and Playwright for smoke tests against the built `docs/` site. `make test` runs unit tests. `make smoke` builds and serves the static app, then verifies the happy path.

## Consequences

The test suite stays fast enough for pre-push. Browser-only APIs need small adapters so core logic remains unit-testable.

## Alternatives Considered

Full e2e coverage for every workflow branch was deferred to keep v1 focused and fast.
