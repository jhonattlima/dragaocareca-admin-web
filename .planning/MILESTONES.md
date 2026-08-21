# Project Milestones: Dragao Careca Admin Web

## v1.3 Publication UX Fixes (Shipped: 2026-08-21)

**Phases completed:** 1 phase, 2 plans

**Key accomplishments:**

- Added immediate-versus-scheduled Save success popup feedback.
- Cleared File Management and trailer state after successful Save without false cancellation messaging.
- Corrected numbered trailer title preview and YouTube commit composition.
- Rebalanced the episode identity row to give Title more width.
- Formally verified 13/13 requirements, 5/5 UAT scenarios, 95/95 ChromeHeadless specs, build, and TypeScript checks.

**Deferred:** v1.1 artifact recovery validation debt and v1.2 sibling API verifier/operational follow-up remain documented.

## v1.2 Trailer Video YouTube Publishing (Shipped: 2026-08-21)

**Phases completed:** 6 phases, 22 plans, 41 tasks

**Key accomplishments:**

- Authenticated draft reservations now gate immediate MP4 staging, save-time promotion, and rollback-safe final trailer replacement in the sibling API.
- Angular now stages trailer MP4s immediately against server-issued draft reservations, exposes byte progress and recoverable lifecycle states, and promotes the staged video only through successful Save/create.
- Canonical Angular/API trailer-video docs and a requirement-complete validation matrix now reflect draft staging, Save-time promotion, rollback ownership, and the explicit no-YouTube Phase 7 boundary.
- Executable failing acceptance coverage now defines the Phase 8 YouTube metadata, private-first lifecycle, recovery, cancellation, safe DTO, and Angular boundary contracts.
- Durable authenticated YouTube trailer jobs now accept persisted title/summary metadata, recover the current source safely, reuse provider work on retry, and expose only an operator-safe private watch URL.
- The sibling API lifecycle verifier now proves the private YouTube job contract and the phase coverage boundary explicitly, including metadata input, recovery, cancellation reconciliation, idempotent publication seams, and sensitive-data exclusion.
- 1. [Rule 3 - Blocking issue] Converted the existing RED scaffold to the exported service contract
- Manage now owns a recoverable, private-first YouTube trailer lifecycle with guarded polling and a sectioned operator card.
- Executable RED contracts for FORM-01 through FORM-05, including backend-confirmed audio metadata and fixed two-decimal decimal-MB presentation.
- 1. [Rule 1 - Bug] Corrected byte-validation error wording used by the verifier
- 1. [Rule 1 - Bug] Cleared stale upload success on incomplete audio metadata
- Canonical episode-form contract documentation, FORM traceability, and independent frontend/API gates recorded with an explicit ChromeHeadless limitation.
- Four ordered participant defaults are now shipped across all Angular environments, with focused coverage protecting catalog intersection and edit preservation.
- Duration and Bytes now use a clearly perceptible, scoped readonly treatment while preserving native bindings and excluding Spotify ID from the gap fix.
- API-owned Save/start/commit metadata persistence with shared Unicode title validation and one-hour normalized hashtag lookup caching
- Angular summary-driven hashtag authoring with additive suggestions, Unicode title validation, cancellable lookup feedback, and canonical YouTube metadata payloads
- Sectioned Angular episode form with editable hashtag authoring, read-only Unicode-validated trailer title preview, and accessible lookup feedback.
- Manage edit restoration now resumes the persisted transcript-to-summary stage with one guarded poller and preserves operator-authored summaries.
- Save-time episode persistence and YouTube commit now report honest, stale-safe outcomes while retaining recoverable editor and private-link context.
- Focused auth and Manage compatibility regressions are committed, final compilation/build gates are recorded, and the required paired-auth/provider lifecycle checkpoint passed.

---

## v1.2 Trailer Video YouTube Publishing (Implementation complete; release closeout pending)

**Phases:** 7-9 implemented and verified; Phases 10-11 remain roadmap placeholders because the existing workflow already contains the integration and artifact capability.

**Delivered:** Final trailer-video upload/replacement UI, private-first YouTube job lifecycle, title/hashtag authoring, debounced approximate hashtag lookup, Save-time metadata orchestration, provider-aware transcript/summary/hashtag progress messages, and the adjusted episode-form field layout.

**Verification:** Complete ChromeHeadless suite passed 70/70, focused suites passed 61/61, frontend build passed, and the sibling API hashtag-authoring verifier passed. Live OAuth/channel publication and external provider quota remain operational follow-up.

**Provider contract:** The UI displays the provider reported by the API for each step. It does not infer or hard-code Gemini/Groq; summary and hashtag fallback decisions remain backend-owned.

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
