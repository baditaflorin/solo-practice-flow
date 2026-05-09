# Postmortem

Date: 2026-05-08

Live app: https://baditaflorin.github.io/solo-practice-flow/

Repository: https://github.com/baditaflorin/solo-practice-flow

## What Was Built

Solo Practice Flow v0.1.0 is a Mode A GitHub Pages app for solo freelance operations. It includes lead capture, proposal generation with optional local LLM support, contract drafting, Ed25519 signing and verification, invoice creation, payment tracking, tax-categorized CSV export, DuckDB-WASM tax report export, age-encrypted JSON backup, Pandoc-WASM HTML export through a pinned lazy public module, ICS follow-up reminders, IndexedDB/Yjs local persistence, PWA files, local hooks, tests, smoke checks, ADRs, and deployment docs.

The live app exposes the repository link, PayPal support link, version, and latest public `main` commit.

## Was Mode A Correct?

Yes. In hindsight, v1 could stay in Mode A. The core data is private single-user workspace state, and the requested workflow does not require hosted sync, webhooks, server-side secrets, or shared accounts. DuckDB, signing, age encryption, ICS generation, and document export can all run from the browser with graceful fallback.

The only compromise is Pandoc-WASM. Bundling its large WASM binary was not appropriate for the asset budget or the local workspace disk constraints, so it is lazy-loaded from a pinned public module URL and Markdown export remains available as the no-network fallback.

## What Worked

GitHub Pages from `main`/`docs` worked cleanly, and the public URL was live from the first scaffold. The local quality gate is fast enough for hooks: lint, unit tests, build, and Playwright smoke stay comfortably under a minute on this machine.

The static-first architecture also kept secrets simple: no backend, no API keys, no private credentials in git, and no frontend secrets.

## What Did Not Work

Bundling Pandoc-WASM directly failed because the binary was too large for the available local disk during build and would have added a large Pages asset. The implementation changed to a lazy CDN import with fallback.

The first smoke script used a fixed port, which collided with a leftover local server. It now chooses an open port automatically.

## What Surprised Us

The installed future Vite/Rolldown toolchain handled the app well, but its WASM behavior made the Pandoc packaging problem obvious. Also, a static build cannot embed the commit created by the commit that includes the build output, so the app shows the build-time commit and keeps the Pages surface free of unauthenticated API calls.

## Accepted Tech Debt

The app has no import flow for encrypted backups yet, only export. Local LLM support targets Ollama-style `/api/generate` endpoints and does not include a model manager. The DuckDB report uses the jsDelivr bundle helper, so the plain CSV export is the offline fallback. The UI is a dense single-screen workspace; deeper navigation can wait until the workflow grows.

## Next Improvements

1. Add backup restore, including age-encrypted restore with schema migration.
2. Add reusable proposal and contract template packs by practice type.
3. Add richer invoice/payment history with partial payments, receipts, and quarterly tax views.

## Time

Estimated: 60-90 minutes for a functional v1 scaffold with publication.

Actual: about 70 minutes from empty workspace to live Pages app, tests, hooks, docs, and postmortem.
