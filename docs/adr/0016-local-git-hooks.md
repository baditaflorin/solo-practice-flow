# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project must avoid GitHub Actions and run checks locally.

## Decision

Use plain `.githooks/` wired through `git config core.hooksPath .githooks`. Pre-commit runs formatting checks, lint, TypeScript build checks, and `gitleaks protect --staged`. Commit-msg validates Conventional Commits. Pre-push runs `make test`, `make build`, and `make smoke`.

## Consequences

Contributors must run `make install-hooks` locally. Hooks are idempotent shell scripts and can be run manually through Make targets.

## Alternatives Considered

Lefthook was considered, but plain hooks are simpler for a small Mode A project.
