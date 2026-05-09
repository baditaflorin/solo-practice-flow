# 0066 - Error Handling Convention

## Status

Accepted

## Context

Phase 3 adds import and restore paths where failures are expected: unsupported file contents, malformed JSON, wrong passphrases, browser permission denial, and oversized share URLs.

## Decision

New user-facing IO paths will return structured results with `ok`, `message`, and optional `detail` fields. Messages follow what/why/next-step wording. Pure helpers must not throw for expected user input errors; unexpected exceptions are caught at the UI boundary and converted into a toast.

## Consequences

Broken imports do not corrupt persisted state and users learn what to try next.

## Alternatives Considered

Throwing plain `Error` objects through the UI was rejected because it tends to produce implementation-language messages.
