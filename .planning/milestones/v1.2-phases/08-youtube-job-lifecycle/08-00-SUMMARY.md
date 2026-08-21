---
phase: 08-youtube-job-lifecycle
plan: 00
subsystem: testing
tags: [angular, jasmine, karma, youtube, lifecycle, red-tests]

requires:
  - phase: 07-final-trailer-video-upload
    provides: finalized local trailer-video source and source identity boundary
provides:
  - Wave 0 backend RED verifier assertions for metadata, safe private URL, recovery, retry, cancellation, and DTO boundaries
  - Wave 0 Angular RED fixtures for lifecycle wrappers, state mapping, teardown, stale protection, and no Angular publish controls
affects: [08-01, 08-02, 08-03, 08-04]

tech-stack:
  added: []
  patterns: [acceptance-first RED scaffolding, HttpTestingController contract fixtures, API-owned lifecycle verification]

key-files:
  created: [.planning/phases/08-youtube-job-lifecycle/08-00-SUMMARY.md]
  modified:
    - ../dragaocareca-admin-api/src/scripts/verify-youtube-trailer-job-lifecycle.ts
    - src/app/core/api.service.spec.ts
    - src/app/pages/manage/manage.component.spec.ts

key-decisions:
  - "Keep the existing API publish route as an API-owned idempotency seam; Phase 8 RED coverage asserts its presence and Angular exposes no publish control."
  - "Keep the Wave 0 checks intentionally failing until Plans 01, 03, and 04 implement the locked contracts."

patterns-established:
  - "Metadata-bearing YouTube start accepts only title and summary; source and provider details remain server-owned."
  - "Browser-visible lifecycle fixtures allow only sanitized privateWatchUrl and operator-safe state fields."

requirements-completed: []

coverage:
  - id: D1
    description: "Backend RED verifier locks metadata start, private URL sanitization, current lookup, same-job retry, retained-private cancellation, and sensitive-field omissions."
    verification:
      - kind: integration
        ref: "npm run verify:youtube-trailer-job-lifecycle"
        status: fail
    human_judgment: true
    rationale: "This Wave 0 deliverable is intentionally RED; later implementation plans must turn it green."
  - id: D2
    description: "Angular RED specs lock metadata wrappers, safe DTO fixtures, lifecycle state mapping, teardown, stale-source protection, and the no-publish boundary."
    verification:
      - kind: unit
        ref: "npm test -- --watch=false --browsers=ChromeHeadless --include=src/app/core/api.service.spec.ts --include=src/app/pages/manage/manage.component.spec.ts"
        status: fail
    human_judgment: true
    rationale: "The tests are intentionally RED before wrapper and Manage implementation; ChromeHeadless also cannot bind in the sandbox."
---

# Phase 8 Plan 00: Wave 0 RED Acceptance Scaffold Summary

**Executable failing acceptance coverage now defines the Phase 8 YouTube metadata, private-first lifecycle, recovery, cancellation, safe DTO, and Angular boundary contracts.**

## Performance

- **Duration:** approximately 25 min
- **Started:** 2026-08-11T22:00:00Z
- **Completed:** 2026-08-11T22:16:00Z
- **Tasks:** 2
- **Files modified:** 3 across the web and sibling API checkouts

## Accomplishments

- Added backend RED assertions for title/summary start input, nullable sanitized privateWatchUrl, current-job recovery, same-job retry, retained-private cancellation guidance, and safe DTO omissions.
- Added Angular RED fixtures for exact start/current/status/retry/cancel routes, metadata bodies, safe lifecycle fields, state mapping, teardown, stale-source protection, and no Angular publish controls.
- Preserved the existing API-owned publish route as an idempotency contract instead of encoding a false no-publish-route assumption.

## Task Commits

1. **Task 1: Add backend RED coverage for literal metadata, private URL, publish idempotency, and safety** - `c9ddaf3` (test)
2. **Task 2: Add Angular RED coverage for wrappers and lifecycle state** - `9492216` (test)

## Files Created/Modified

- `../dragaocareca-admin-api/src/scripts/verify-youtube-trailer-job-lifecycle.ts` - backend lifecycle RED verifier additions.
- `src/app/core/api.service.spec.ts` - Angular HTTP contract and safe DTO RED fixtures.
- `src/app/pages/manage/manage.component.spec.ts` - Manage lifecycle state/polling RED expectations.

## Decisions Made

- The scaffold treats the API publish route as existing and API-owned; Angular publish controls remain explicitly absent from Phase 8.
- The checks fail before implementation by design, providing the acceptance gate for Plans 01-04.

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- The sibling API build initially could not write its existing `dist/` output under the default sandbox; rerunning with approved elevated execution completed the build, then the verifier failed at the intended old empty-body assertion (`400 !== 202`).
- The specified Angular Karma command could not start ChromeHeadless because the sandbox denied binding port 9876. The production `npm run build` completed successfully, with the repository's existing bundle/style budget warnings.
- The sibling verifier file already contained an unrelated user change to the API publish-route expectation when this plan started; it was preserved and included in the file's scoped commit rather than reverted.

## Next Phase Readiness

Plans 01-04 can implement against executable RED expectations. The backend and Angular RED commands should be rerun as acceptance suites after implementation; browser assertion sign-off remains pending until a permitted ChromeHeadless runner is available.

## Self-Check: PASSED

- Summary file exists.
- Task commits `9492216` exists in this checkout and sibling API task commit `c9ddaf3` exists in `../dragaocareca-admin-api`.
- All three plan files are present and the frontend production build passed.

---
*Phase: 08-youtube-job-lifecycle*
*Completed: 2026-08-11*
