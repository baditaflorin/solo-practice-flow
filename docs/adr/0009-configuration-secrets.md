# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets. Optional local LLM settings are user-controlled and not sensitive by default.

## Decision

Commit `.env.example` with placeholders only. Build-time constants expose public URLs, app version, and commit SHA. The app stores optional local LLM endpoint and model in the local workspace. No API keys, private keys, `.pem`, `.key`, or real `.env` files may be committed. `gitleaks` runs in pre-commit.

## Consequences

The app can be built and published publicly. Users are responsible for protecting exported encrypted backups and any signing key material they choose to export.

## Alternatives Considered

Embedding encrypted secrets in the frontend was rejected because obfuscation still ships secrets to every browser.
