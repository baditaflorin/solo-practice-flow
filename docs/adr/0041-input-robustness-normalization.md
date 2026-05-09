# 0041 - Input Robustness And Normalization Policy

## Status

Accepted

## Context

Inputs contain BOMs, CRLF, smart quotes, NBSP, odd punctuation, CSV quoting, invalid dates, and partial payloads.

## Decision

Normalize boundaries first: strip BOM, normalize line endings to LF, collapse NBSP and repeated spaces, preserve source snippets, normalize smart punctuation for parsing while keeping original evidence, and treat parse failures as recoverable anomalies.

## Consequences

The parser can be deterministic and forgiving. Users see domain-specific anomalies instead of stack traces.

## Alternatives Considered

Letting each downstream function parse raw text was rejected because it creates inconsistent failures.
