# 0044 - Confidence Model

## Status

Accepted

## Context

Silent wrongness is worse than visible uncertainty.

## Decision

Every inferred field carries a numeric confidence from 0 to 1, a level (`high`, `medium`, `low`), evidence, and a reason. Derived entities carry aggregate confidence from their fields and anomalies. Exports preserve confidence.

## Consequences

The UI can expose uncertainty without blocking progress. Tests can assert confidence thresholds on real fixtures.

## Alternatives Considered

Only showing global confidence was rejected because users need to know which specific fields require review.
