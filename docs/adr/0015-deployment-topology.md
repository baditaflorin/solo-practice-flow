# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode C deployment artifacts are only needed for a runtime backend.

## Decision

Use GitHub Pages only. There is no `deploy/` directory, Docker Compose stack, nginx config, GHCR image, Prometheus endpoint, or server runbook in v1.

## Consequences

Deployment is a git push to `main` after `make build`. Rollback is a git revert of the publishing commit.

## Alternatives Considered

Adding Docker for local static serving was rejected because `make pages-preview` and the smoke server cover the need.
