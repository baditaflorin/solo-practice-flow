# Phase 2 Substance Plan

Ranked by real-data user impact from `docs/phase2-substance/realdata-audit.md`.

## Selected Substance Items

1. #6 Auto-detect structure from raw intake text, CSV-like tables, contracts, payments, and transcripts.
2. #7 Auto-classify fields: names, emails, companies, dates, budgets, terms, invoice/payment amounts, tax categories.
3. #8 Useful first guess on first input via smart intake analysis.
4. #9 Format normalization by default for dates, money, whitespace, encodings, and CSV cells.
5. #16 Confidence scores on every inference.
6. #19 Explain decisions with evidence snippets and reasons.
7. #18 Surface anomalies: missing email, impossible date, budget range, malformed rows, suspicious unicode.
8. #17 Suggest fixes for low-confidence or malformed inputs.
9. #12 Domain-aware validation for lead/proposal/contract/invoice/payment states.
10. #14 Domain-aware export with provenance and confidence.
11. #15 Domain conventions: delimiter sniffing, semantic field names, line-item category inference.
12. #1 Fuzz the parser with real fixtures and synthetic edge cases.
13. #2 Encoding and format variants normalization policy.
14. #4 Partial inputs degrade meaningfully.
15. #5 Adversarial input handling.
16. #22 Stable IDs for inferred entities.
17. #24 Enumerate reachable states.
18. #25 No stuck states.
19. #27 Concurrency safety for repeated generate/sign/export actions.
20. #31 Cache expensive derived inference work in React.
21. #32 Actionable errors with what/why/next.
22. #33 Validate at boundaries.
23. #35 Deterministic outputs for fixture inference.
24. #36 Inspectable activity log.
25. #37 Debug surface with `?debug=1`.
26. #38 Output provenance in exported artifacts.
27. #39 Remember user corrections within session.

## Implementation Order

1. Done: intake normalization and inference engine.
2. Done: fixture test harness and deterministic expected properties.
3. Done: UI wiring for smart intake, confidence, evidence, anomalies, and suggested fixes.
4. Done: domain validation and actionable errors.
5. Done: export provenance, stable IDs, activity log, and debug surface.
6. Done: performance/state docs and Phase 2 postmortem.

## Non-Goals

No backend, hosted sync, payment API, legal advice engine, visual redesign, or unrelated polish.
