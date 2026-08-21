# Dragao Careca Admin Web

## What This Is

An Angular admin client for the Dragao Careca podcast operations workflow. It provides a sectioned, legacy-inspired UI for authentication, episode editing, media staging, feed inspection, runtime health, metrics, transcript/summary generation, and backend-generated episode artifact downloads.

The frontend stays thin: it orchestrates API calls and presents state, while the backend remains the source of truth for feed decisions, persistence, artifact resolution, and auth validation.

## Core Value

Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## Current State

**Shipped:** v1.3 Publication UX Fixes on 2026-08-21.

The admin workflow now presents immediate-versus-scheduled publication feedback, resets File Management and trailer state after successful Save, previews the complete numbered trailer title, and preserves the sectioned responsive form layout with a wider Title field.

**Next:** Start the next cycle with `$gsd-new-milestone`.

## Previous Milestone: v1.3 Publication UX Fixes — Shipped 2026-08-21

See `.planning/milestones/v1.3-ROADMAP.md` for the archived scope and verification.

## Earlier Milestone: v1.2 Trailer Video YouTube Publishing — Shipped 2026-08-21

**Delivered:** Operators can upload a final trailer video from New Episode, monitor and cancel transfers, stage it privately on YouTube, review the returned link, publish it publicly, and download it later from Episodes.

**Delivered features:**
- add a trailer-video upload box to New Episode File Management with upload progress, cancel, retry, and replacement behavior
- add API-owned YouTube upload/publish jobs with progress polling and safe cancellation boundaries
- fill the existing YouTube link field after the non-public YouTube upload and provide an explicit Publish button
- add public YouTube hashtag search-count lookup beside the YouTube link and generate an editable, 100-character-safe trailer title
- include the final trailer video in the Episodes artifact-download modal

**Cross-repository provider contract:** The API owns Gemini-first/Groq-fallback selection for transcript-adjacent summary and hashtag authoring. The UI consumes the provider reported in each existing status DTO and displays it in the existing workflow messages; it never infers provider identity or calls Gemini/Groq directly.

Operators can select episode artifacts from the Episodes list, monitor backend ZIP preparation, and receive an authenticated native browser download. The release includes the SQLite-backed API job lifecycle, canonical selector validation, accessible modal, progress polling, server-authoritative filenames, retry/reset behavior, CORS header exposure, DC334 full-selection evidence, and green frontend build/test gates.

The happy path was accepted as the release scope. The broader live recovery matrix was intentionally not performed; UI-08 and VAL-02 remain documented validation debt.

v1.2 extends the existing final trailer-video API upload contract with private-first YouTube jobs, Save-time publication metadata, editable hashtag/title authoring, robust episode-form defaults, operator recovery states, and finalized trailer artifact downloads. The UI remains backend-driven and preserves the existing sectioned workflow.

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
- ✓ Provider-aware transcript, summary, and hashtag progress messaging consumes the API's actual provider fields.
- ✓ Episode form field layout was reconciled: Title is in the identity row; Duration and Explicit are in the publish row; the label is Publish.

### v1.2 Trailer Video YouTube Publishing

- ✓ TRAILER-01–TRAILER-05: MP4 staging, progress, cancellation, retry, replacement, and Save-time promotion.
- ✓ YOUTUBE-01–YOUTUBE-07: private-first transfer, durable recovery, safe link population, metadata commit, publication, and cleanup boundaries.
- ✓ TITLE-01–TITLE-04: editable hashtags, approximate lookup feedback, Unicode-safe title preview, and cached/rate-limited lookup.
- ✓ ARTIFACT-01–ARTIFACT-02: finalized trailer selection and canonical `trailer.mp4` ZIP inclusion.
- ✓ OPS-01–OPS-05: API-owned provider/auth behavior, stale protection, recovery, and existing workflow compatibility.
- ✓ FORM-01–FORM-05: publication defaults, backend-confirmed audio metadata, participant defaults, music-credit validation, and read-only field styling.

## Deferred Validation

- UI-08: complete live partial/failure/authentication/retry/reset/reopen/repeated-completion recovery matrix.
- VAL-02: complete manual validation of visible progress and ZIP contents for a correctly matched live fixture.

## Known Technical Debt

- Three stale verifier expectations remain in the sibling API repository and should be reconciled before the next provider-contract change.
- The v1.1 UI-08 and VAL-02 live recovery checks remain carried-forward validation debt.

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
| Keep provider choice backend-owned and expose actual provider per step | Prevent misleading UI status when Gemini falls back to Groq | ✓ Good |

---
*Last updated: 2026-08-21 after v1.3 milestone archival*
