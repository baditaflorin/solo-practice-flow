# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B requires offline data generation, but this project is Mode A.

## Decision

No data-generation pipeline is included in v1. `make data` is intentionally documented as not applicable for Mode A.

## Consequences

The repository has no scheduled backend, generated dataset, or release-hosted artifact contract. Future templates or sample datasets can be added as static files if needed.

## Alternatives Considered

Prebuilding example data was rejected because it does not advance the private local-first workflow.
