# 0069 - Type Safety Policy At Boundaries

## Status

Accepted

## Context

The codebase currently has no `any` or `@ts-ignore` in app source. Phase 3 adds JSON imports, clipboard text, file text, and URL hash decoding, all of which are untrusted boundaries.

## Decision

Untrusted values enter as `unknown` or `string`, are parsed through zod or explicit guards, and only then become domain types. Unsafe casts and `any` remain forbidden outside narrow third-party adapter code with comments explaining the boundary.

## Consequences

Import failures stay localized and tests can assert invalid input behavior.

## Alternatives Considered

Casting parsed JSON to `PracticeState` was rejected because it would reintroduce silent wrongness at the backup boundary.
