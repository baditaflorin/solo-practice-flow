# 0065 - Module Boundaries And Dependency Direction

## Status

Accepted

## Context

The app is a static frontend with domain logic under `features/practice` and shared utilities under `lib`. New Phase 3 code needs clear boundaries so import, export, persistence, and UI concerns do not collapse into one file.

## Decision

Dependency direction is UI -> feature helpers -> shared lib -> primitives. Domain helpers may import shared utilities and schemas; shared utilities must not import UI components. Browser APIs such as `File`, `navigator.clipboard`, and `window.print` remain at UI or browser-helper boundaries.

## Consequences

The code stays testable in Vitest and avoids browser globals in pure parsing modules.

## Alternatives Considered

Moving every helper into `lib` was rejected because practice-specific state parsing belongs with the practice feature.
