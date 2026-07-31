# Dragao Careca Admin Web

## What This Is

An Angular admin client for the Dragao Careca podcast operations workflow. It provides a sectioned, legacy-inspired UI for authentication, episode editing, media staging, feed inspection, runtime health, metrics, transcript/summary generation, and backend-generated episode artifact downloads.

The frontend stays thin: it orchestrates API calls and presents state, while the backend remains the source of truth for feed decisions, persistence, artifact resolution, and auth validation.

## Core Value

Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## Current State

**Shipped:** v1.1 Episode Artifact Downloads (2026-07-31)

Operators can select episode artifacts from the Episodes list, monitor backend ZIP preparation, and receive an authenticated native browser download. The release includes the SQLite-backed API job lifecycle, canonical selector validation, accessible modal, progress polling, server-authoritative filenames, retry/reset behavior, CORS header exposure, DC334 full-selection evidence, and green frontend build/test gates.

The happy path was accepted as the release scope. The broader live recovery matrix was intentionally not performed; UI-08 and VAL-02 remain documented validation debt.

## Validated Requirements

### v1.0 Transcript Summary Integration

- ✓ Transcript and summary generation progress is shown in the new episode workflow.
- ✓ Generated summaries auto-fill the Summary field and remain editable.
- ✓ Late polling updates do not overwrite operator edits.

### v1.1 Episode Artifact Downloads

- ✓ API-01–API-05: authenticated, validated asynchronous artifact ZIP jobs.
- ✓ UI-01–UI-07: episode-row action, accessible modal, canonical selectors, progress, duplicate protection, and native download.
- ✓ VAL-01: supplied DC334 fixture staged and restored during retained validation.
- ✓ VAL-03: frontend tests/build and dependency gates pass.
- ✓ VAL-04: API lifecycle, security, failure, partial-result, cleanup, and OpenAPI verification.

## Deferred Validation

- UI-08: complete live partial/failure/authentication/retry/reset/reopen/repeated-completion recovery matrix.
- VAL-02: complete manual validation of visible progress and ZIP contents for a correctly matched live fixture.

## Out of Scope

- Reimplementing backend business rules in the frontend.
- Replacing the sectioned admin UI with a minimalist placeholder.
- Client-side ZIP creation or arbitrary filesystem path selection.
- Separate browser downloads for each artifact.
- Canceling in-progress jobs, batch downloads, or download history (future requirements).

## Context and Constraints

The app is Angular 15 with TypeScript 4.8, Bootstrap 5.3.8, template-driven forms, a shared `ApiService`, auth guard/interceptor plumbing, and routed manage/feed/metrics/health/login screens. Canonical behavioral assumptions live in `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/CONFIGURATION.md`.

- Keep business logic in the sibling API.
- Respect `environment.authBypass`.
- Preserve the legacy-inspired sectioned layout.
- Keep `npm run build` green.

## Key Decisions

| Decision | Rationale | Outcome |
|---|---|---|
| Keep artifact resolution and ZIP creation backend-owned | Prevent filesystem/path leakage and duplicate business logic | ✓ Good |
| Use canonical artifact selectors only | Stable API vocabulary and safe validation boundary | ✓ Good |
| Use persisted asynchronous jobs with progress polling | ZIP creation can outlive a request and needs visible state | ✓ Good |
| Use native authenticated Blob delivery | Avoid unnecessary client ZIP/file-saver dependencies | ✓ Good |
| Preserve the existing Episodes-tab workflow | Add capability without disrupting episode editing | ✓ Good |
| Fail closed when the live fixture identity is mismatched | Avoid mutating unrelated production-like data to force validation | ✓ Good |

---
*Last updated: 2026-07-31 after v1.1 milestone*
