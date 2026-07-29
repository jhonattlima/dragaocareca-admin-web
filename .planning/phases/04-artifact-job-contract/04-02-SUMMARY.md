---
phase: 04-artifact-job-contract
plan: 02
subsystem: api
tags: [express, openapi, authentication, artifact-jobs, zip-download]
requires:
  - phase: 04-artifact-job-contract
    provides: SQLite-persisted artifact jobs, four-state lifecycle, worker processing, and canonical artifact preflight
provides:
  - Authenticated artifact-job start, status, and completed-download REST operations
  - Strict canonical selector JSON request validation and safe partial ZIP response contract
  - OpenAPI documentation for the three locked operations and public job snapshot
affects: [04-03-artifact-download-verification, frontend-artifact-download-modal]
tech-stack:
  added: []
  patterns: [Express auth middleware with no-store headers, Zod strict request validation, OpenAPI binary response schemas]
key-files:
  created: []
  modified:
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/docs/openapi.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts
key-decisions:
  - "D-01 through D-04: expose separate authenticated start, status, and completed-download operations with an opaque job snapshot."
  - "D-08 through D-11: validate only canonical selectors, preflight before row creation, preserve partial availability, and never accept client paths."
  - "Expired, unknown, and mismatched jobs use the same 404 contract; pending, processing, and failed downloads use 409."
patterns-established:
  - "Cache-Control: no-store middleware runs before authentication and validation on every artifact-job operation."
  - "Location points to the status operation; completed snapshots expose only the new jobs download URL."
requirements-completed: [API-01, API-03, API-04, API-05]
coverage:
  - id: D1
    description: "Authenticated start, status, and download routes enforce the locked lifecycle, ownership, validation, and safe binary delivery contract."
    requirement: API-01
    verification:
      - kind: integration
        ref: "npm run verify:episode-artifact-downloads"
        status: pass
    human_judgment: false
  - id: D2
    description: "OpenAPI publishes the three operations, canonical selector enum, four-state snapshot, no-store headers, ZIP headers, and documented errors."
    requirement: API-03
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false
duration: 10min
completed: 2026-07-29
status: complete
---

# Phase 4 Plan 2: Artifact Job Contract Summary

**Authenticated asynchronous artifact-job routes and a synchronized OpenAPI contract for safe partial ZIP downloads.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-29T20:08:45Z
- **Completed:** 2026-07-29T20:18:45Z
- **Tasks:** 2
- **Files modified:** 3 in the API workspace

## Accomplishments

- Replaced legacy preparation routes with authenticated `POST /v1/episodes/:episodeId/artifacts/jobs`, status polling, and completed ZIP download operations.
- Added strict Zod validation for the JSON `{ artifacts: [...] }` body, canonical selector normalization, `Location`, no-store responses, stable 400/404/409 handling, partial-artifact headers, and stream-error cleanup.
- Published the four-state public snapshot and three-operation OpenAPI contract, including 45-minute TTL, binary ZIP delivery, safe filename, and no internal filesystem fields.

## Task Commits

Each task was committed atomically in the sibling API repository:

1. **Task 1: Wire the authenticated artifact-job routes** - `3c6ce7b` (feat)
2. **Task 2: Publish the three-operation OpenAPI contract** - `4e2ba23` (feat)

The web repository contains only this planning summary and state metadata; no Angular source files were changed.

## Files Created/Modified

- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` - authenticated job start/status/download handlers.
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/docs/openapi.ts` - locked REST paths, schemas, headers, and errors.
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` - new download URL and job-scoped regular-file validation.

## Decisions Made

- Kept the existing persisted preparation service as the implementation boundary while exposing the new public `artifacts/jobs` contract.
- Returned 200 only for a reused completed job and 202 with `Location` for newly pending or active jobs.
- Used the selected 404 policy for expired jobs and no-available-artifact requests, avoiding ownership or filesystem disclosure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Hardened persisted archive path validation**
- **Found during:** Task 1 (Wire the authenticated artifact-job routes)
- **Issue:** The existing validated-download helper checked only that the persisted path was a regular file; a tampered database path could point outside the job archive root.
- **Fix:** Require the persisted path to equal the server-generated job-scoped archive path and return a not-found result for missing files.
- **Files modified:** `src/services/episode-artifact-preparation.service.ts`
- **Verification:** `npm run typecheck && npm run build && npm run verify:episode-artifact-downloads`
- **Committed in:** `3c6ce7b`

**Total deviations:** 1 auto-fixed (Rule 2: 1 missing critical security mitigation)
**Impact on plan:** Required directly by threat model T-04-02-04; no architectural scope was added.

## Issues Encountered

- The sandbox-mounted sibling API `dist` and `.git` paths reported `EROFS`; the exact required build, verifier, and commits completed successfully through the approved elevated API workspace access.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The API contract is ready for the direct-router authenticated verification in plan 04-03 and for the later Angular modal/download phases. The API checkout is clean on its existing `v1.3` branch; the frontend checkout remains unchanged.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/04-artifact-job-contract/04-02-SUMMARY.md`.
- API commits `3c6ce7b` and `4e2ba23` exist and contain no unintended deletions.
- `npm run typecheck`, `npm run build`, and `npm run verify:episode-artifact-downloads` passed.
- Stub scan found no placeholder or UI data-source stubs in the modified API files.
- No new trust-boundary surface beyond the planned authenticated routes and binary response was introduced.

---
*Phase: 04-artifact-job-contract*
*Completed: 2026-07-29*
