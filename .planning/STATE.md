---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Trailer Video YouTube Publishing
current_phase: 9
current_phase_name: Title, Hashtags & Publishing
status: planning
stopped_at: Phase 9 plans created and verified
last_updated: "2026-08-14T13:28:20.950Z"
last_activity: 2026-08-14
last_activity_desc: Phase 08.1 complete, transitioned to Phase 9
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 17
  completed_plans: 14
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md

**Core value:** Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.
**Current focus:** Phase 08.1 — Episode Form Stability Patch

## Current Position

Phase: 9 — Title, Hashtags & Publishing
Plan: Not started
Status: Ready to plan
Last activity: 2026-08-14 — Phase 08.1 complete, transitioned to Phase 9

Progress: ░░░░░░░░░░ [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 in v1.2
- Average duration: n/a
- Total execution time: 0.0 hours

**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 07-final-trailer-video-upload P01 | 32min | 3 tasks | 9 files |
| Phase 07-final-trailer-video-upload P02 | 20min | 3 tasks | 5 files |
| Phase 07 P03 | 12min | 2 tasks | 4 files |
| Phase 08-youtube-job-lifecycle P00 | 25 | 2 tasks | 3 files |
| Phase 08 P01 | 12 | 2 tasks | 5 files |
| Phase 08-youtube-job-lifecycle P02 | 25 | 2 tasks | 2 files |
| Phase 08 P03 | 8 | 2 tasks | 2 files |
| Phase 08 P04 | 8 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- Keep the existing sibling trailer-video route and finalized local media as the source for artifact downloads.
- Keep YouTube OAuth, resumable provider transfer, persistence, retries, cancellation boundaries, and publication rules API-owned.
- Use private-first YouTube state and a separate explicit publish command.
- Keep Angular as thin `ApiService` orchestration in the existing sectioned layout; honor `authBypass`.
- Bind jobs to episode and trailer source identity so stale responses cannot affect a newer replacement.
- [Phase 7]: Use owner-bound opaque UUID trailer draft reservations with 24-hour SQLite expiry and pre-Multer authorization.
- [Phase 7]: Keep trailer video staged until authenticated create consumes the same reservation; use canonical server paths and rollback-safe promotion.
- [Phase ?]: Phase 7 frontend acquires a server-issued trailer-video draft immediately before upload and reuses it through New Episode create.
- [Phase ?]: Phase 7 frontend retains staged and last-known-good trailer-video state while generation tokens guard replacement, reset, and teardown races.
- [Phase ?]: Document the server-issued opaque trailer-video draft reservation, X-Episode-Draft-Id staging, and Save-time promotion consistently across canonical frontend docs.
- [Phase ?]: Keep ChromeHeadless-unavailable results explicit and leave browser assertion/sign-off pending rather than treating bundle compilation as test success.
- [Phase ?]: Keep YouTube transfer, processing, publishing, hashtags, title generation, and trailer artifact downloads outside Phase 7.
- [Phase ?]: Wave 0 keeps the API publish route as an API-owned idempotency seam while Angular remains publish-control-free in Phase 8.
- [Phase ?]: Wave 0 RED checks intentionally fail until the downstream API and Angular implementation plans complete the contract.
- [Phase ?]: Phase 8 Plan 1 uses the existing durable metadata_snapshot_json field for initial title/summary job input and keeps provider/session/source evidence API-owned.
- [Phase ?]: Phase 8 Plan 1 exposes only a validated privateWatchUrl and normalized operator error categories in the browser DTO.
- [Phase ?]: Phase 8 Plan 2 verifies accepted title/summary input, private URL sanitization, recovery, cancellation, retry, and API publication boundaries in the existing sibling fake-provider verifier.
- [Phase ?]: Phase 8 coverage explicitly opts browser OAuth/direct provider calls, Angular publish controls, automatic publication/deletion, richer metadata, hashtags, artifact downloads, and final workflow integration to their owning boundaries.
- [Phase ?]: Expose typed YouTube lifecycle wrappers with metadata-bearing start, current/status lookup, same-job retry, and cancellation; keep retry/cancel bodies empty.
- [Phase ?]: Allowlist browser DTO fields to lifecycle progress, cancellation, normalized errors, retry timing, timestamps, and sanitized privateWatchUrl; exclude provider/session/source/raw-error/publication fields.
- [Phase ?]: Keep YouTube job state separate from local MP4 upload state and guard callbacks by episode, job, source generation, and source filename.
- [Phase ?]: Expose private-ready and provider-video-retained reconciliation only; Angular has no publish control or raw provider fields.
- [Phase 8.1]: Add Episode publication date is latest episode date/time plus seven calendar days, falling back to current date/time when no prior episode exists.
- [Phase 8.1]: Populate episode-audio Duration and decimal-MB Bytes only after backend-confirmed upload completion; metadata failure fails the upload.
- [Phase 8.1]: Configure default participants in frontend environment/configuration and select only configured names present in the participant catalog.
- [Phase 8.1]: Require at least one music credit with both name and reference link before Save.
- [Phase 8.1]: Present Duration, Bytes, and Spotify ID as read-only through light-gray styling without hints.

### Pending Todos

- Confirm exact sibling API route/DTO names, OAuth channel and scopes, local MP4 limits, Unicode counting policy, and provider cleanup semantics during Phase 7/8 planning.

### Blockers/Concerns

- v1.2 implementation depends on coordinating the new YouTube job and publication contracts with the sibling API repository.
- Provider quota, resumable-session recovery, and live cancellation/reconciliation require explicit verification before release.

### Roadmap Evolution

- Phase 8.1 inserted after Phase 8: Episode Form Stability Patch: fix Add Episode defaults, audio metadata, validation, and read-only field presentation (URGENT)

## Deferred Items

| Category | Item | Status | Deferred At |
|---|---|---|---|
| validation | v1.1 UI-08 recovery matrix and VAL-02 live artifact validation | Carried forward; outside v1.2 roadmap scope | 2026-07-31 |

## Session Continuity

Last session: 2026-08-14T13:28:20.942Z
Stopped at: Phase 9 plans created and verified
Resume file: .planning/phases/09-title-hashtag-authoring/09-01-PLAN.md
