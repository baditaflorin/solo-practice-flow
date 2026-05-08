# 0012 - Metrics And Observability

## Status

Accepted

## Context

Mode A has no backend and the app handles client/business data that may be sensitive.

## Decision

Ship no analytics in v1. The only visible operational metadata is app version, commit SHA, and local workspace counts in the UI.

## Consequences

There is no usage telemetry. Privacy is simple and the app does not send client records to third-party analytics.

## Alternatives Considered

Plausible or a Cloudflare Worker beacon was considered and rejected for v1 because success can be validated through local smoke tests and user feedback.
