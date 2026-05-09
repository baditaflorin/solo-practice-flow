# Phase 3 Stranger Test

Date: 2026-05-10

Tester: self-as-stranger in a fresh Playwright browser context, plus an attempted in-app browser run. The in-app browser runtime was unavailable, so the executable test used an isolated Chromium context with no prior storage.

Input: `test/fixtures/realdata/01-clean-email.txt`.

## Workflow Covered

1. Opened the local app in a fresh browser context.
2. Loaded the real email fixture through `Load files`.
3. Applied the smart intake guess.
4. Captured the Northstar Ops lead.
5. Generated the proposal.
6. Drafted and signed the contract.
7. Created the invoice.
8. Copied the current document and verified clipboard contents.
9. Copied a raw-intake share URL and opened it in a second fresh tab.
10. Opened the print view and verified the printable document contains provenance.
11. Copied automation JSON, wrote it to a temporary file, started fresh, and restored JSON.
12. Encrypted the backup JSON as an age file with a passphrase, then restored the encrypted backup through the UI.

## Result

Passed.

Observed measurements:

- Share URL length: 448 bytes.
- Backup JSON size: 13,086 bytes.
- JSON restore: passed.
- age restore: passed.
- Clipboard copy: passed with explicit browser clipboard permissions.
- Print view: passed.

## Confusions And Fixes

| Finding                                                                    | Severity | Response                                                                                          |
| -------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------- |
| The first automated run waited for a transient file-loaded toast too soon. | low      | The test now waits for workspace readiness and asserts the loaded raw intake text instead.        |
| Start fresh lives inside Practice settings, so it is not visually loud.    | low      | Accepted. The control is destructive enough to belong behind settings and its label is now clear. |
| age restore requires knowing to reuse the passphrase field.                | low      | Accepted for Phase 3. The label is adjacent to encrypted backup and restore controls.             |

No blocking stranger-test issues remained after the run.
