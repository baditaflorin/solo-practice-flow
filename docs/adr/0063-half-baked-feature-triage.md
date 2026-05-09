# 0063 - Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

The audit identified five partial features or claims that make the app feel less trustworthy: backup export without import, encrypted export without restore, textarea-only smart intake, broad payment tracking wording, and an ambiguous reset control.

## Decision

JSON backup restore, encrypted backup restore, and richer intake pathways will be finished. Payment tracking will be reworded as invoice payment-status tracking because a payment ledger is a new feature. The reset control will become an explicit "Start fresh" operation that clears persisted workspace state and transient intake.

## Consequences

The production UI keeps only controls that do what their labels say. Users get honest language instead of aspirational feature names.

## Alternatives Considered

Keeping export-only backups was rejected because it creates a false sense of portability.
