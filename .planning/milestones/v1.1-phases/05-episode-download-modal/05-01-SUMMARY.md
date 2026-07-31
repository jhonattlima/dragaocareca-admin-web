---
phase: 05-episode-download-modal
plan: 01
subsystem: api
tags: [angular, httpclient, artifact-jobs, karma]

requires:
  - phase: 04-artifact-job-contract
    provides: Authenticated artifact job start/status routes and public job snapshot shape
provides:
  - Typed canonical artifact selector union and Phase 4 job snapshot contract
  - ApiService start and status methods for episode artifact jobs
  - Focused HttpClient contract tests for selector payloads, routes, and completed URLs
affects: [05-02-modal-orchestration, 05-03-modal-ui]

tech-stack:
  added: []
  patterns: [Typed Angular HttpClient orchestration, HttpClientTestingModule route contract tests]

key-files:
  created: [src/app/core/api.service.spec.ts]
  modified: [src/app/core/api.service.ts]

key-decisions:
  - "Keep artifact selectors as a closed TypeScript union and send only canonical selector strings to the backend."
  - "Expose downloadUrl through the status snapshot as opaque state data; native ZIP delivery remains deferred to Phase 6."

patterns-established:
  - "Artifact job methods use the existing environment.apiBaseUrl and HttpClient/auth-interceptor boundary."
  - "HTTP tests assert exact endpoint paths and request bodies without backend filesystem dependencies."

requirements-completed: [UI-03, UI-06]

coverage:
  - id: D1
    description: "ApiService provides the five-selector union, typed job snapshot, and start/status methods."
    requirement: UI-03
    verification:
      - kind: other
        ref: "test -f src/app/core/api.service.ts && rg -n selector/snapshot/start/status contract"
        status: pass
    human_judgment: false
  - id: D2
    description: "Focused HttpClient tests cover canonical payload ordering, exact routes, and opaque completed download URL handling."
    requirement: UI-06
    verification:
      - kind: unit
        ref: "src/app/core/api.service.spec.ts"
        status: unknown
    human_judgment: true
    rationale: "The spec compiled, but Karma could not launch because no Chrome/Chromium binary is installed in the execution environment."

duration: 6min
completed: 2026-07-30
status: complete
---

# Phase 5 Plan 1: Episode Artifact Job API Contract Summary

**Typed Angular artifact-job orchestration with canonical selectors, exact Phase 4 routes, and focused HTTP boundary coverage**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-31T02:53:48Z
- **Completed:** 2026-07-31T03:00:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added the closed `EpisodeArtifactSelector` union for `episode`, `trailer`, `image`, `image-low`, and `transcript`.
- Added the typed `EpisodeArtifactJobSnapshot` and authenticated `ApiService` start/status methods.
- Added focused Angular HTTP tests proving canonical selector ordering, exact POST/GET routes, and completed `downloadUrl` data handling without invoking native delivery.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the typed artifact job contract** - `dbd4d2e` (feat)
2. **Task 2: Test the artifact job HTTP boundary** - `c221b8e` (test)

## Files Created/Modified

- `src/app/core/api.service.ts` - Artifact selector/snapshot types and start/status API methods.
- `src/app/core/api.service.spec.ts` - HttpClientTesting contract tests for artifact jobs.

## Decisions Made

- Kept selector validation and artifact resolution backend-owned; the client sends canonical selector arrays only.
- Treated `downloadUrl` as opaque snapshot data and did not add Blob, object URL, file-saver, or native download behavior.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The first commit attempt required elevated repository write access because `.git` is read-only in the default sandbox; the required commits succeeded after escalation.
- The focused test compiled successfully but could not execute because Karma could not find a ChromeHeadless binary (`No binary for ChromeHeadless browser on your platform`). No package was installed because the plan does not authorize adding dependencies.
- `npm run build` passed. Existing Angular stylesheet and initial bundle budget warnings remain unchanged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The Manage-page modal plans can consume the typed start/status methods and snapshot state. Before relying on the focused Karma result, provide a Chrome/Chromium binary or CI browser runtime; no implementation blocker remains.

## Self-Check: PASSED

- `src/app/core/api.service.ts` exists and contains the required contract symbols/routes.
- `src/app/core/api.service.spec.ts` exists and is included in the Task 2 commit.
- Commits `dbd4d2e` and `c221b8e` exist in git history.
- `npm run build` passed.
- No ZIP delivery, Blob, object URL, or file-saver behavior was introduced.

---
*Phase: 05-episode-download-modal*
*Completed: 2026-07-30*
