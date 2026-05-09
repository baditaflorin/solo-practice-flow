# 0071 - Stranger Test Findings And Response

## Status

Accepted

## Context

Phase 3 requires testing the app as a fresh user in a private browsing window with real input data, then fixing the top three observed issues before declaring completion.

## Decision

The stranger test will use a private-browser local build, load a real fixture through the new file pathway, complete lead approval, proposal, contract, signature, invoice, backup export, backup restore, copy, and print preview checks. Findings and fixes will be recorded in `docs/phase3/stranger-test.md` and summarized in the Phase 3 postmortem.

The completed run used an isolated Chromium context after the in-app browser runtime was unavailable. It passed file intake, smart capture, proposal, contract, signature, invoice, document copy, raw-intake share URL, print view, automation JSON copy, JSON restore, and age-encrypted restore.

## Consequences

The final usability assessment is grounded in a real workflow instead of a happy-path memory of the code.

The remaining issues are low-severity and documented: Start fresh is intentionally inside settings, age restore reuses the passphrase field, and clipboard behavior depends on browser permissions.

## Alternatives Considered

Relying only on unit and smoke tests was rejected because they do not catch wording and dead-end confusion.
