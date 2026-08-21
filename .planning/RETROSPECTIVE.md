# Project Retrospective

## Milestone: v1.1 — Episode Artifact Downloads

**Shipped:** 2026-07-31
**Phases:** 3 | **Plans:** 11

### What Was Built

- Backend-owned asynchronous artifact ZIP jobs with persisted lifecycle, progress, validation, security, cleanup, and OpenAPI parity.
- Episodes-tab artifact picker with canonical selectors, availability defaults, accessibility behavior, duplicate protection, polling, retry, and reset.
- Authenticated native Blob delivery with server-controlled filenames, CORS header exposure, object-URL cleanup, and retained DC334 full-selection ZIP evidence.

### What Worked

- Keeping ZIP assembly and filesystem resolution in the API kept the Angular client thin and reduced security ambiguity.
- Deterministic API verifier seams and a bounded browser harness made cleanup and unsupported live scenarios explicit.
- API-owned progress thresholds were reconciled with focused boundary tests.

### What Was Inefficient

- The live API episode 334 identity did not match the supplied DC334 fixture, preventing safe execution of the broader recovery matrix.
- Browser test execution initially required locating and explicitly configuring the existing Playwright Chromium binary.

### Patterns Established

- Canonical selector unions at the frontend boundary.
- Episode-scoped in-flight tokens for duplicate job prevention.
- Native Blob delivery with validated server filenames and guaranteed object-URL revocation.
- Fail-closed validation when external fixture state is mismatched.

### Key Lessons

- Fixture identity should be preflighted before any stateful validation run.
- Automated recovery specs can establish state-machine coverage, but release acceptance should distinguish them from live browser evidence.
- A documented happy-path acceptance can close a milestone while preserving broader validation as explicit debt.

### Deferred

- UI-08 live partial/failure/authentication/retry/reset/reopen/repeated-completion matrix.
- VAL-02 complete manual validation of visible progress and ZIP contents for a correctly matched live fixture.

## Milestone: v1.2 — Trailer Video YouTube Publishing

**Shipped:** 2026-08-21
**Phases:** 6 | **Plans:** 22

### What Was Built

- Final trailer MP4 staging with progress, cancellation, retry, replacement, draft promotion, and rollback-safe persistence.
- Durable private-first YouTube transfer jobs with sanitized status, recovery, cancellation boundaries, Save-time metadata commit, and publication.
- Editable YouTube hashtag authoring, approximate lookup feedback, one-hour caching, Unicode-safe trailer title preview, and summary-driven metadata.
- Episode form stability fixes for publication defaults, backend-confirmed audio metadata, participant defaults, music-credit validation, and readonly presentation.
- Finalized trailer-video artifact selection and canonical `trailer.mp4` ZIP/native download integration.

### What Worked

- Keeping provider credentials, job state, publication, artifact resolution, and business rules in the sibling API kept Angular orchestration-focused.
- Episode/source-generation guards and persisted polling recovery prevented stale asynchronous responses from corrupting the active editor.
- Cross-phase integration auditing caught the authored-hashtag reload issue before archive and led to a focused regression fix.

### What Was Inefficient

- Verification artifacts became stale as later phases corrected earlier lifecycle contracts, requiring a closeout reconciliation pass.
- ChromeHeadless was unavailable locally, so browser verification had to rely on accepted UAT and API/build evidence.
- Provider and API contract changes crossed repositories, making verifier ownership and contract drift harder to track.

### Patterns Established

- Private-first external publication with Save-time commit as the single metadata/publication boundary.
- Sanitized browser DTOs with API-owned provider identity and normalized failure categories.
- Finalized-artifact selectors reused through the existing authenticated ZIP job instead of introducing a parallel download path.
- Readable UAT and verification records that distinguish source/API evidence, user acceptance, and environment limitations.

### Key Lessons

- Persisted authoring metadata must be restored on edit, not only retained in the active component session.
- Milestone audits should compare current source behavior with historical phase reports before treating old failures as active blockers.
- Browser-environment limitations should be recorded explicitly and kept separate from functional pass claims.

### Deferred

- Install/configure ChromeHeadless and rerun focused/complete Angular browser suites.
- Reconcile three stale verifier expectations in the sibling API repository.
- Complete the carried-forward v1.1 UI-08 and VAL-02 live recovery checks when a matching fixture is available.

## Cross-Milestone Trends

| Trend | Observation |
|---|---|
| Backend ownership | Both shipped milestones keep business logic and authoritative state in the API. |
| UI evolution | Features extend the existing sectioned manage workflow rather than replacing it. |
| Validation | Automated evidence is strong; live fixture identity and release-owner scope remain important gates. |
