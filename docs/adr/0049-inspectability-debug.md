# 0049 - Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and maintainers need to understand why the app inferred something.

## Decision

Expose reasoning inline for inferred fields and enable a compact debug surface when the URL contains `?debug=1`. Debug shows state counts, last analysis kind, anomalies, and activity log entries.

## Consequences

Support gets easier without adding default UI noise.

## Alternatives Considered

Always-visible internals were rejected because they would distract users with implementation detail.
