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

## Cross-Milestone Trends

| Trend | Observation |
|---|---|
| Backend ownership | Both shipped milestones keep business logic and authoritative state in the API. |
| UI evolution | Features extend the existing sectioned manage workflow rather than replacing it. |
| Validation | Automated evidence is strong; live fixture identity and release-owner scope remain important gates. |
