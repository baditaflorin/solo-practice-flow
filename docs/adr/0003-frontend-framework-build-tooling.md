# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The frontend is the product and must work on GitHub Pages with strict TypeScript and a small first-load payload.

## Decision

Use React, TypeScript strict mode, Vite, and Tailwind CSS v4. React gives ergonomic stateful workflow screens. Vite handles fast local development and hashed production assets. Tailwind is available for utility styling, while custom CSS handles the dense application layout.

## Consequences

The build is static and Pages-friendly. Initial JS must stay under 200KB gzipped, with WASM and document libraries lazy-loaded.

## Alternatives Considered

Svelte and Vue were viable, but React's ecosystem for testing, local state, and existing user familiarity made it the conservative choice.
