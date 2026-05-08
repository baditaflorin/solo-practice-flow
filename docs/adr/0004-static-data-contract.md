# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A does not fetch shared application data from a server. The durable data contract is the user's local workspace and exported backup format.

## Decision

The v1 workspace is a versioned JSON document with `schemaVersion`, `profile`, `settings`, `leads`, `proposals`, `contracts`, and `invoices`. Backups export that shape as JSON, optionally age-encrypted by passphrase. Tax exports are CSV and JSON derived from invoices. Breaking changes increment `schemaVersion` and add migration logic before release.

## Consequences

Users can inspect and back up their own data. The app can import future-compatible backups by checking schema version.

## Alternatives Considered

SQLite-as-file was considered, but JSON is friendlier for v1 backup inspection and keeps DuckDB as a report engine rather than the primary store.
