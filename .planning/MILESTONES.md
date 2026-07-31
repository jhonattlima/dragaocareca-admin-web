# Project Milestones: Dragao Careca Admin Web

## v1.1 Episode Artifact Downloads (Shipped: 2026-07-31)

**Phases completed:** 3 phases, 11 plans, 25 tasks

**Key accomplishments:**

- SQLite-persisted artifact jobs with a strict four-state lifecycle, stage-weighted progress, restart recovery, and deterministic archive-failure cleanup.
- Authenticated asynchronous artifact-job routes and a synchronized OpenAPI contract for safe partial ZIP downloads.
- Deterministic direct-router verification for the authenticated artifact ZIP lifecycle, with duplicate and restart cleanup hardening.
- Typed Angular artifact-job orchestration with canonical selectors, exact Phase 4 routes, and focused HTTP boundary coverage
- Per-episode artifact picker state and guarded asynchronous ZIP-job orchestration in ManageComponent
- Episodes-tab artifact picker with accessible native controls, modal-local job progress, recoverable partial/failure states, and keyboard focus lifecycle
- Episode-scoped artifact-job start guarding with asynchronous duplicate-confirmation regression coverage
- Authenticated native ZIP delivery with server-authoritative filenames, exactly-once activation, cleanup, and same-job recovery
- Real DC 334 browser ZIP delivery validated with CORS-readable server filename, canonical archive entries, and reversible fixture cleanup; recovery matrix remains explicitly partial.
- ManageComponent artifact progress labels now mirror the authoritative API's 25% preparation and 90% finalization boundaries, with browser-qualified evidence reconciled without changing download or recovery behavior.
- Green full ChromeHeadless regression gates plus a bounded fail-closed real-DC334 recovery harness, with live unsupported scenarios preserved as release evidence.

---

## v1.0 Transcript Summary Integration (Shipped: 2026-07-29)

**Delivered:** Backend-generated episode summaries are now tracked from transcript completion through UI progress, automatic Summary textarea population, manual editing, and visible failure states.

**Phases completed:** 1-3 (6 plans total)

**Key accomplishments:**

- Added generated-summary API and editor state plumbing.
- Reused the existing progress bar for transcript and summary generation.
- Auto-filled generated summaries while protecting operator edits.
- Added failure handling, tests, documentation, and live API/browser verification.

**Stats:** 3 phases, 6 plans, 7 UAT checks; frontend tests 8/8 passed; frontend build and API typecheck passed.

**What's next:** Start the next cycle with `$gsd-new-milestone`, carrying forward MNT-01 and MNT-02.
