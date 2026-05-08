# 0001 - Deployment Mode

## Status

Accepted

## Context

The project must default to GitHub Pages and avoid a runtime backend unless browser-only delivery cannot satisfy v1. The v1 workflow stores private freelance practice data, drafts, signatures, invoices, and exports for one user.

## Decision

Use Mode A: Pure GitHub Pages. The app is static, served from `main` branch `/docs`, and runs all v1 behavior in the browser. Persistence uses IndexedDB. Heavy capabilities are lazy-loaded: DuckDB-WASM for tax reports, Pandoc-WASM for document conversion, age for encrypted backup exports, Ed25519 for local signatures, and ICS generation for calendar reminders. Local LLM generation is optional through a user-supplied local endpoint; deterministic templates are the default.

## Consequences

No server, Docker image, nginx, runtime database, or server metrics are required in v1. Client data stays on the user's device. Browser constraints apply: no secrets in frontend code, no payment webhooks, no hosted sync, and no guaranteed access to a user's local LLM endpoint.

## Alternatives Considered

Mode B was unnecessary because v1 has no shared public dataset to prebuild. Mode C was rejected because hosted auth, webhooks, shared workspaces, and secret-bearing runtime APIs are non-goals.
