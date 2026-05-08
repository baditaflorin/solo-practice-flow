# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap spec defines Go backend expectations for Modes B and C.

## Decision

Skip the Go backend in v1 because ADR 0001 chooses Mode A. The repository does not include `cmd/`, `internal/`, Docker, migrations, or runtime API code.

## Consequences

There is less operational surface area and no server-side secret handling. If v2 needs hosted sync or webhooks, a separate ADR will introduce a backend layout before code.

## Alternatives Considered

Adding an unused backend skeleton was rejected because it creates maintenance burden and violates the GitHub Pages-first bias.
