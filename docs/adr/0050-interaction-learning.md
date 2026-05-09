# 0050 - Interaction Learning Policy

## Status

Accepted

## Context

If the user corrects a guess, similar inputs should improve during the same session without feeling spooky.

## Decision

Remember lightweight correction preferences in local workspace state: source labels, tax-category overrides by phrase, and preferred payment terms. Show defaults transparently as normal editable fields.

## Consequences

The app becomes more useful without remote learning or hidden personalization.

## Alternatives Considered

Server-side learning and opaque model adaptation were rejected by Mode A and privacy constraints.
