# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live Pages URL is a first-class deliverable from the initial commit.

## Decision

Publish from `main` branch `/docs`. Vite builds with `base: "/solo-practice-flow/"`, hashed assets, and a copied `404.html` for SPA fallback. `docs/` is committed and intentionally not gitignored. The build cleanup removes generated assets only, preserving documentation under `docs/adr/`.

## Consequences

Every successful build can be pushed directly to Pages without GitHub Actions. Stale generated assets are cleaned while docs remain in place.

## Alternatives Considered

A `gh-pages` branch was rejected because it complicates local-only hooks. Publishing from repository root was rejected because source and build output would be mixed.
