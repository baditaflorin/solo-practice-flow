# 0062 - Output Pathway Coverage Policy

## Status

Accepted

## Context

The v0.2 app can download Markdown, HTML, ICS, CSV, JSON backup, and encrypted backup files, but it cannot restore backups or copy/print/share outputs directly.

## Decision

The app will support round-trippable JSON backup restore, encrypted age backup restore, copy-to-clipboard for current document and CSV output, printable current document output, small hash-based intake sharing, and a documented automation-ready JSON envelope. Screenshot, embed code, and hosted share links are out of scope.

## Consequences

Exported state becomes portable and inspectable. Hash share links remain size-limited and contain only the user's own raw intake text.

## Alternatives Considered

A hosted short-link service was rejected because it requires server-side state and would violate the Phase 1 static deployment mode.
