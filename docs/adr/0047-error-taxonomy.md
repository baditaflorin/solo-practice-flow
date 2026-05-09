# 0047 - Error Taxonomy And Messaging

## Status

Accepted

## Context

Errors must say what failed, why, and what the user can do next.

## Decision

Classify errors as recoverable input issues, recoverable capability issues, or fatal storage/runtime issues. Input issues become anomalies and suggested fixes. Capability issues keep fallback exports. Fatal issues preserve local work where possible.

## Consequences

The app avoids `Error: undefined`-style messages and keeps user work intact.

## Alternatives Considered

Throwing exceptions through UI handlers was rejected because it creates stuck states.
