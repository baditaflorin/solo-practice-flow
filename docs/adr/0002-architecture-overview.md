# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs a coherent workflow without a backend: lead capture, proposals, contracts, signing, invoices, payment tracking, and exports.

## Decision

Use a feature-oriented frontend. `features/practice` owns domain types, calculations, document generation, and React panels. `lib` owns reusable browser services such as storage, crypto, document conversion, downloads, and calendar export. `components` owns shell-level reusable UI. Build output lands in `docs/`.

## Consequences

Domain logic can be unit-tested without rendering the whole app. Heavy browser capabilities can stay behind feature actions and dynamic imports.

## Alternatives Considered

A route-per-feature app was rejected for v1 because the workflow benefits from a single operational screen. A backend-centered architecture was rejected by ADR 0001.
