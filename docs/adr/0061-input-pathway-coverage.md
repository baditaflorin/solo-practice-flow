# 0061 - Input Pathway Coverage Policy

## Status

Accepted

## Context

The v0.2 app accepts real intake text, but the primary route is a textarea. Real users bring emails, RFP snippets, CSV exports, Markdown notes, and downloaded HTML as files or clipboard contents.

## Decision

The app will support textarea paste, file picker, drag and drop, multi-file text intake, clipboard read with permission fallback, demo fixture loading, hash-based small intake restore, and autosaved workspace restore. URL scraping, folder upload, and image/OCR intake are explicitly unsupported in this static Pages app and must be documented.

## Consequences

Users can start from their own files without a backend. Multi-file input is concatenated with filename boundaries so provenance is visible to the user and the inference engine still receives plain text.

## Alternatives Considered

Fetching arbitrary URLs from the browser was rejected because CORS failures would be common and a proxy would require a runtime backend.
