# Phase 3 Postmortem

Date: 2026-05-10

Release: v0.3.0

Live app: https://baditaflorin.github.io/solo-practice-flow/

Repository: https://github.com/baditaflorin/solo-practice-flow

Support: https://www.paypal.com/paypalme/florinbadita

## Audit Grids

| Audit    | Before                           | After                                           |
| -------- | -------------------------------- | ----------------------------------------------- |
| Inputs   | 3 green, 4 yellow/red, 10 gray   | 14 green, 3 intentionally unsupported gray      |
| Outputs  | 3 green, 6 yellow/red, 5 gray    | 12 green, 2 intentionally unsupported gray      |
| Controls | 16 green, 9 yellow, 0 red        | 33 green, 1 documented yellow limitation, 0 red |
| Claims   | 5 shipped, 6 partial/not shipped | 12 shipped, 0 partial/not shipped               |
| Code     | 3 dead-code candidates, 0 `any`  | 0 dead-code candidates, 0 `any`, 0 `@ts-ignore` |

## Half-Baked Feature Triage

| Feature                            | Outcome  | Rationale                                                                      |
| ---------------------------------- | -------- | ------------------------------------------------------------------------------ |
| JSON backup export without import  | finished | Restore now accepts the provenance envelope and legacy raw state.              |
| age backup export without restore  | finished | Encrypted restore decrypts with the passphrase and uses the same parser.       |
| Smart intake only through textarea | finished | File, drag/drop, multi-file, clipboard, sample, and share-url intake now work. |
| Payment tracking claim             | reworded | The app tracks invoice paid amount/status, not a payment ledger.               |
| Reset demo label                   | finished | Start fresh now clears durable workspace and transient intake/passphrase.      |

## Codebase Health

| Metric        | Before | After      |
| ------------- | ------ | ---------- |
| Core DRY gaps | 4      | 2 accepted |
| SOLID risks   | 3      | 2 accepted |
| Dead code     | 3      | 0          |
| TODO markers  | 0      | 0          |
| `any`         | 0      | 0          |
| `@ts-ignore`  | 0      | 0          |
| Test files    | 6      | 9          |
| Unit tests    | 22     | 31         |

## Stranger Test

The stranger test passed in a fresh browser context on real fixture data. It covered file intake, smart lead capture, proposal, contract, Ed25519 signature, invoice, document copy, share URL restore, print view, automation JSON copy, JSON restore, and age-encrypted restore.

The top three issues were low-severity:

1. The first automated run waited on a transient toast instead of loaded raw text. The test was corrected.
2. Start fresh is behind settings. Accepted because it is destructive and now clearly labeled.
3. Encrypted restore reuses the passphrase field. Accepted because the field is adjacent to encrypted backup/restore controls.

## Documentation Fixes

README claims were reworded from payment tracking to invoice payment-status review. OPFS wording was removed. Backup restore, file intake, copy/print/share outputs, limitations, repo link, PayPal link, version, and build-time commit behavior are documented.

## What Surprised Me

The biggest usability win was not a new screen; it was making input and output paths symmetrical. Once file intake and backup restore existed, the app stopped feeling like a demo tied to its textarea.

The browser clipboard path is useful but permission-sensitive. Every copy action needs a download or manual fallback, and the app now reports that clearly.

## Still Open

1. Dedicated payment ledger with gross, fee, net, transaction ID, and invoice matching.
2. Multi-line invoice editor instead of one proposal-derived line item.
3. Real mobile-device QA for file picker and clipboard permission behavior.
4. Forced DuckDB failure test for the fallback path.
5. Larger component split for `PracticeApp.tsx` once the workflow surface grows again.

## Honest Take

A stranger can now use the app for real solo-consulting admin work end to end if their workflow is lead to proposal to contract to invoice to export. It no longer feels like a toy on the core path because users can bring files in, get a useful first guess, recover from backups, copy or print outputs, and restore state elsewhere.

It is still not a full accounting system. Payment processor reconciliation, multi-line invoice editing, and team sync remain real limitations, not hidden features.
