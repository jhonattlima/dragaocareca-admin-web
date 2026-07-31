---
phase: 06-browser-download-release-validation
plan: 01
subsystem: ui
tags: [angular, httpclient, blob, browser-download, artifact-jobs, jasmine]

# Dependency graph
requires:
  - phase: 05-episode-download-modal
    provides: Episodes artifact modal, authenticated job polling, terminal snapshots, and preparation retry
provides:
  - Authenticated HttpResponse<Blob> artifact download transport with API-origin URL normalization
  - Exactly-once native ZIP delivery with validated server-authoritative filenames and object-URL cleanup
  - Same-job delivery retry, explicit reset, and recoverable modal delivery error states
affects: [06-02-browser-validation, release-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: [HttpClient observe-response Blob contract, completed-job identity delivery guard, native anchor/object-URL lifecycle]

key-files:
  created: [.planning/phases/06-browser-download-release-validation/06-01-SUMMARY.md]
  modified:
    - src/app/core/api.service.ts
    - src/app/core/api.service.spec.ts
    - src/app/pages/manage/manage.component.ts
    - src/app/pages/manage/manage.component.html
    - src/app/pages/manage/manage.component.spec.ts

key-decisions:
  - "Resolve relative snapshot download URLs against the configured API origin while preserving absolute API URLs, then issue the request through injected HttpClient so AuthInterceptor remains authoritative."
  - "Treat the completed job identity and immutable download URL as the exactly-once delivery key; manual retry removes only that delivery marker and never starts preparation again."
  - "Accept only validated Content-Disposition filename or filename* values, rejecting missing, malformed, path-like, and control-character names without deriving a client fallback."

patterns-established:
  - "Native delivery creates one temporary object URL per attempt and revokes it in finally after anchor activation or thrown activation."
  - "Preparation retry remains separate from completed-archive delivery retry; reset deliberately clears completed view and delivery markers for a new flow."

requirements-completed: [UI-07, UI-08, VAL-03]

coverage:
  - id: D1
    description: "Completed authenticated artifact snapshots trigger one native ZIP anchor activation using the server Content-Disposition filename and clean up the temporary object URL."
    requirement: UI-07
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts#UI-07 delivers a completed archive once with the server filename and revokes its object URL"
        status: unknown
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Karma compiled but could not launch because this environment has no ChromeHeadless binary; browser activation remains part of Phase 6 manual validation."
  - id: D2
    description: "The artifact modal preserves completed partial/error state and supports same-job delivery retry, reset, missing/unsafe filename recovery, and network/auth/expiry messaging."
    requirement: UI-08
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts#UI-08 recovery and delivery failure cases"
        status: unknown
    human_judgment: true
    rationale: "The focused suite compiled, but runtime browser execution is unavailable in this environment."
  - id: D3
    description: "The API and ManageComponent focused suites compile against the Blob/header contract and the production build remains successful without new dependencies."
    requirement: VAL-03
    verification:
      - kind: other
        ref: "npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts' --include='src/app/pages/manage/manage.component.spec.ts'"
        status: unknown
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "The test runner reached Karma and compiled all focused specs, then stopped because ChromeHeadless is not installed."

# Metrics
duration: 8min
completed: 2026-07-31
status: complete
---

# Phase 6 Plan 1: Browser Download Delivery Summary

**Authenticated native ZIP delivery with server-authoritative filenames, exactly-once activation, cleanup, and same-job recovery**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-31T13:36:00Z
- **Completed:** 2026-07-31T13:44:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `ApiService.downloadEpisodeArtifact()` returning `HttpResponse<Blob>` with response headers and API-origin normalization for relative snapshot URLs.
- Added automatic completed-job delivery guarded by job identity/URL, validated `Content-Disposition` filename handling including RFC 5987 `filename*`, native anchor activation, and guaranteed object-URL revocation.
- Added distinct delivery error, same-job retry, reset/new-selection, partial warning, expired/auth/network, and missing/unsafe filename modal states without changing preparation polling or Add episode state.
- Added focused API and ManageComponent coverage for transport headers, exactly-once behavior, reopen behavior, cleanup, retry request counts, reset, and failure boundaries.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the authenticated Blob response contract and tests** - `552c00d` (feat)
2. **Task 2: Deliver completed jobs once and expose modal recovery actions** - `1e12445` (feat)

## Files Created/Modified

- `src/app/core/api.service.ts` - Typed authenticated Blob download method and relative API URL resolution.
- `src/app/core/api.service.spec.ts` - Relative/absolute URL, Blob response type, ZIP body, and header visibility tests.
- `src/app/pages/manage/manage.component.ts` - Completion delivery guard, filename policy, object URL cleanup, retry/reset state, and error classification.
- `src/app/pages/manage/manage.component.html` - Archive delivery status, retry-download, and start-new-archive controls.
- `src/app/pages/manage/manage.component.spec.ts` - Native delivery and recovery boundary tests.

## Decisions Made

- Kept all archive preparation and authorization backend-owned; the frontend only requests the opaque completed URL through the existing interceptor path.
- Used response `Content-Disposition` as the sole filename authority and rejected unsafe or absent names instead of deriving a fallback from episode data.
- Preserved completed snapshots across close/reopen and made delivery retry reuse the same URL without POSTing a second preparation job.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected a strict Jasmine expectation type in focused recovery coverage**
- **Found during:** Task 2 verification
- **Issue:** The test compared `string | null` snapshot URLs against a strict spy-call expectation and failed TypeScript compilation.
- **Fix:** Narrowed the test fixture URL to `string` at the assertion boundary; production behavior was unchanged.
- **Files modified:** `src/app/pages/manage/manage.component.spec.ts`
- **Verification:** Focused suite compiled successfully; runtime remained environment-blocked by missing ChromeHeadless.
- **Committed in:** `1e12445`

**Total deviations:** 1 auto-fixed (Rule 1 bug in test typing).
**Impact on plan:** No scope expansion; the fix was required for the planned test suite to compile.

## Issues Encountered

- The focused Karma commands reached the Karma server and compiled successfully, but could not execute because no ChromeHeadless binary is installed (`No binary for ChromeHeadless browser on your platform`). No package was installed, preserving the no-new-dependency constraint.
- `npm run build` passed. Existing Angular metrics stylesheet and initial bundle budget warnings remain unchanged.

## User Setup Required

None - no external service configuration was introduced. Browser execution and the DC 334 fixture remain in Plan 06-02.

## Next Phase Readiness

Plan 06-02 can run the full frontend regression/build gates and manually validate the DC 334 Season 3 archive in a browser-capable environment. The implementation is complete and preserves `authBypass`, Phase 5 polling/preparation behavior, and Add episode isolation.

## Self-Check: PASSED

- All five planned application files exist and contain the required transport, delivery, cleanup, recovery, and test symbols.
- Task commits `552c00d` and `1e12445` exist in git history.
- `npm run build` passed.
- The combined focused Karma suite compiled and attempted to run; only the missing ChromeHeadless binary prevented execution.
- No package files changed and no unrelated user changes were present.

---
*Phase: 06-browser-download-release-validation*
*Completed: 2026-07-31*
