---
phase: 04-artifact-job-contract
plan: 01
subsystem: api
tags: [sqlite, artifact-jobs, workers, archiver, progress]
requires:
  - phase: 03-transcript-summary-integration
    provides: backend media layout, canonical episode artifact selectors, and worker startup conventions
provides:
  - SQLite-backed artifact job metadata and typed transition repository
  - Persisted pending/processing/completed/failed preparation lifecycle with stage-weighted progress
  - Restart recovery, 45-minute retention cleanup, atomic archive finalization, and deterministic verifier controls
affects: [04-02-authenticated-artifact-rest-contract, 04-03-artifact-download-verification]
tech-stack:
  added: []
  patterns: [DatabaseSync schema initialization, parameterized repository transitions, serialized worker processing, verifier stage barriers]
key-files:
  created:
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/repositories/artifact-job.repository.ts
  modified:
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/sqlite.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/workers/episode-artifact-preparation.worker.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/server.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts
key-decisions:
  - "D-12/D-13: persist opaque job metadata in SQLite with bounded four-state status and internal path metadata excluded from public snapshots."
  - "D-05 through D-07: use preflight/snapshot 25, archive assembly 65, and finalization 10 progress stages, publishing completed only after close, rename, and regular-file validation."
  - "D-14/D-15: coalesce active normalized selector requests and remove snapshots/partial output on failure; retain completed archives for 45 minutes."
patterns-established:
  - "All job status and transition writes pass through artifactJobRepository."
  - "Verifier stage barriers and failure injection are exported seams, never request-controlled inputs."
requirements-completed: [API-02]
coverage:
  - id: D1
    description: "SQLite-backed artifact jobs expose durable pending, processing, completed, and failed snapshots with monotonic bounded progress."
    requirement: API-02
    verification:
      - kind: integration
        ref: "npm run verify:episode-artifact-downloads"
        status: pass
    human_judgment: false
  - id: D2
    description: "Deterministic verifier control proves archive failure persistence, cleanup, recovery, and retention without worker timing luck."
    requirement: API-02
    verification:
      - kind: integration
        ref: "npm run verify:episode-artifact-downloads"
        status: pass
    human_judgment: false
duration: 24min
completed: 2026-07-29
status: complete
---

# Phase 4 Plan 1: Artifact Job Contract Summary

**SQLite-persisted artifact jobs with a strict four-state lifecycle, stage-weighted progress, restart recovery, and deterministic archive-failure cleanup.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-29T20:00:17Z
- **Completed:** 2026-07-29T20:24:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added the `artifact_jobs` schema, indexes, typed row mapping, parameterized CRUD, lifecycle transitions, FIFO pending selection, active duplicate lookup, and expiry cleanup.
- Replaced JSON-manifest preparation with persisted `pending -> processing -> completed|failed` processing, canonical preflight/archive entries, 25/65/10 progress stages, job-scoped files, atomic rename, and 45-minute retention.
- Added verifier-only stage barriers and failure injection, plus isolated verifier fixtures covering duplicate coalescing, deterministic failure error/cleanup, startup recovery, and expiry.
- Updated the artifact worker/server startup path so persisted jobs recover and expired artifacts are cleaned during serialized polling while respecting `DISABLE_BACKGROUND_WORKERS`.

## Task Commits

1. **Task 1: Establish SQLite job persistence and deterministic failure seam** - `733f985` (`feat`)
2. **Task 2: Convert preparation processing to the persisted four-state lifecycle** - `03cba5e` (`feat`)

The task commits live in the sibling API repository; no Angular application files were changed.

## Files Created/Modified

- `dragaocareca-admin-api/src/database/sqlite.ts` - `artifact_jobs` schema and lifecycle indexes.
- `dragaocareca-admin-api/src/database/repositories/artifact-job.repository.ts` - Typed SQLite persistence and state-transition boundary.
- `dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` - Persisted processor, public mapper, stage controller, archive finalization, cleanup, recovery, and retention.
- `dragaocareca-admin-api/src/workers/episode-artifact-preparation.worker.ts` - Serialized startup recovery and polling cleanup.
- `dragaocareca-admin-api/src/server.ts` - Explicit persisted artifact-worker ownership at startup.
- `dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts` - Isolated deterministic lifecycle verifier.

## Decisions Made

- Kept the existing canonical selector preflight and server-resolved media paths as the only source of archive candidates.
- Stored path metadata only for internal worker/download validation; public status snapshots expose no filesystem paths or storage roots.
- Kept cancellation deferred per D-16; failed jobs retain a sanitized nonempty error and terminal progress observed at the failure stage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Prevented status polling from deleting an active archive temporary file**
- **Found during:** Task 2 verification
- **Issue:** The shared initialization path removed every `.part` archive on each status read, causing an in-flight archive rename to fail with `ENOENT`.
- **Fix:** Limit stale `.part` cleanup to startup/recovery initialization; polling still performs expired-job cleanup without touching active output.
- **Files modified:** `src/services/episode-artifact-preparation.service.ts`
- **Verification:** `npm run verify:episode-artifact-downloads`
- **Committed in:** `733f985`

**2. [Rule 1 - Bug] Made verifier stage assertions completion-aware and fixture cleanup retry-safe**
- **Found during:** Task 1/Task 2 verifier execution
- **Issue:** Immediate snapshot reads raced asynchronous stage work, and isolated directory reset could observe transient open-file removal ordering.
- **Fix:** Added controller completion signals and bounded retry cleanup helpers; verifier captures snapshots after explicit stage release/completion.
- **Files modified:** `src/services/episode-artifact-preparation.service.ts`, `src/scripts/verify-episode-artifact-downloads.ts`
- **Verification:** `npm run typecheck && npm run build && npm run verify:episode-artifact-downloads`
- **Committed in:** `733f985`

**Total deviations:** 2 auto-fixed (Rule 1: 2 bugs)
**Impact on plan:** Both fixes were directly required for deterministic lifecycle correctness; no architectural scope was added.

## Issues Encountered

The supplied API checkout was writable only under the approved elevated workspace access, as anticipated by the plan prerequisite. Verification was run there successfully. No package installation or authentication gate was required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The route layer can now use the exported create/status/process/download/cleanup methods and the exact four-state public lifecycle. The existing route contract still uses the pre-Phase-4 preparation names and is intentionally left for plan 04-02; the Angular application remains unchanged.

## Self-Check: PASSED

- Created repository file exists in the API checkout.
- API task commits `733f985` and `03cba5e` exist.
- `npm run typecheck`, `npm run build`, and `npm run verify:episode-artifact-downloads` passed after the final changes.
- Stub scan found no placeholder/TODO/empty UI-flow stubs in the six plan files.
- No new unplanned HTTP endpoint or trust-boundary surface was introduced; route exposure is deferred to plan 04-02.

---
*Phase: 04-artifact-job-contract*
*Completed: 2026-07-29*
