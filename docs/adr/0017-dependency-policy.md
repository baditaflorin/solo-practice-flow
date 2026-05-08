# 0017 - Dependency Policy

## Status

Accepted

## Context

The app uses complex capabilities that should not be custom-implemented.

## Decision

Use production-oriented libraries: Vite, React, TypeScript, Zod, Yjs, idb, TanStack Query, DuckDB-WASM, Pandoc-WASM, age-encryption, noble Ed25519, ics, Vitest, Playwright, Prettier, ESLint, and gitleaks. Keep heavy modules lazy-loaded and run `npm audit` before release.

## Consequences

The code avoids bespoke cryptography, SQL engines, document converters, and calendar serialization. Dependency updates need smoke testing because browser WASM packages can have asset-path constraints.

## Alternatives Considered

Hand-written encryption/signature/document logic was rejected as unsafe and unnecessary.
