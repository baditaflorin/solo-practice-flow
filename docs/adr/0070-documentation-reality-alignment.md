# 0070 - Documentation Reality Alignment Process

## Status

Accepted

## Context

The Phase 3 audit found README and ADR language that was directionally true but broader than the product. This causes real users to expect payment processor tracking, OPFS persistence, or restore support before those flows exist.

## Decision

The README will include a verified feature checklist, limitations section, and complete live/repo/PayPal/version information. Claims without matching UI or tests are removed or reworded. Future feature claims must cite the user path or test that proves them.

## Consequences

The public project page stays honest and support burden drops.

## Alternatives Considered

Leaving aspirational claims in docs was rejected because Phase 3 is specifically about making the shipped surface complete.
