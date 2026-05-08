# 0006 - WASM Modules

## Status

Accepted

## Context

The requested replacement flow names DuckDB and Pandoc, both of which have browser-capable WASM builds.

## Decision

Use DuckDB-WASM lazily for tax-categorized exports and Pandoc-WASM lazily from a pinned public module URL for Markdown-to-HTML document conversion. Do not load either on first paint. If a WASM module fails in a constrained browser, show a clear fallback and keep plain JSON/CSV/Markdown exports available.

## Consequences

The first load stays small, while power features remain available in the browser. GitHub Pages cannot set COOP/COEP headers, so the implementation must use compatible non-threaded paths or graceful fallback.

## Alternatives Considered

Server-side conversion was rejected by ADR 0001. Hand-written SQL/report parsing was rejected because DuckDB is a proven engine.
