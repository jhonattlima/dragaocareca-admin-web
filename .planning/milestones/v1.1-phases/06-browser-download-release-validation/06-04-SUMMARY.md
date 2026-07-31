---
phase: 06-browser-download-release-validation
plan: 04
subsystem: testing
tags: [angular, karma, chromeheadless, playwright, dc334, release-validation]

# Dependency graph
requires:
  - phase: 06-browser-download-release-validation
    provides: native Blob delivery, recovery state model, progress thresholds, and prior DC334 full-selection evidence
provides:
  - green focused and full ChromeHeadless ManageComponent regression coverage
  - bounded no-new-dependency real-DC334 Playwright validation harness
  - reconciled Phase 6 validation, verification, UAT, requirements, and milestone audit evidence
affects: [phase-6-release-validation, v1.1-milestone-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: [explicit test Observable setup, direct-instantiated component teardown, fail-closed bounded Playwright evidence]

key-files:
  created: [scripts/phase6-validation.js]
  modified: [src/app/pages/manage/manage.component.spec.ts, src/app/pages/manage/phase6-validation.spec.ts, .planning/phases/06-browser-download-release-validation/06-VALIDATION.md, .planning/phases/06-browser-download-release-validation/06-VERIFICATION.md, .planning/phases/06-browser-download-release-validation/06-UAT.md, .planning/v1.1-MILESTONE-AUDIT.md, .planning/REQUIREMENTS.md]

key-decisions:
  - "Repair the proven Karma fixture/polling lifecycle seam in tests without changing production artifact contracts."
  - "Treat unsupported live recovery scenarios as unsupported, never as passes, when the current API row does not match the immutable DC334 source and no reversible verifier control exists."
  - "Use the existing Playwright package and Chromium binary only; do not add dependencies or mutate the sibling API/source during bounded validation."

patterns-established:
  - "Restore DOM fixtures after synchronous ngOnInit test loads when asserting row-scoped UI contracts."
  - "Destroy direct-instantiated Angular components in recovery specs so polling intervals cannot leak across ChromeHeadless suites."
  - "Record real-browser scenario status, request/error counters, fixture pre-state, and cleanup in a deterministic JSON/Markdown report."

requirements-completed: [UI-01, UI-06, UI-07, UI-08, VAL-01, VAL-02, VAL-03]

coverage:
  - id: D1
    description: "ManageComponent UI-01/UI-06, polling cleanup, delivery/retry/reset/reopen/repeated-completion, and Add episode isolation coverage is green in ChromeHeadless."
    requirement: UI-06
    verification:
      - kind: automated_ui
        ref: "CHROME_BIN=... npm test -- --watch=false --browsers=ChromeHeadless --include=manage.component.spec.ts --include=phase6-validation.spec.ts --include=phase6-progress-threshold.spec.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Bounded real-DC334 browser harness preflights the live auth-bypass pairing, records empty-selection and modal focus/cleanup, and fails closed for unsupported recovery scenarios."
    requirement: VAL-02
    verification:
      - kind: automated_ui
        ref: "/tmp/phase6-validation-final-2/phase6-validation.json"
        status: pass
    human_judgment: true
    rationale: "The live API episode-334 row is currently DC 319 metadata and does not match the supplied immutable DC334 source; no safe completed job was available for the remaining recovery matrix."
  - id: D3
    description: "Full release gates and evidence artifacts agree on Karma, build, dependency, fixture, browser, and cleanup results."
    requirement: VAL-03
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
      - kind: other
        ref: "git diff --exit-code -- package.json package-lock.json && npm ls --depth=0"
        status: pass
    human_judgment: true
    rationale: "Release acceptance still depends on human disposition of the explicitly unsupported live recovery scenarios."

# Metrics
duration: 48min
completed: 2026-07-31
status: complete
---

# Phase 6 Plan 04: Browser Recovery Gap Closure Summary

**Green full ChromeHeadless regression gates plus a bounded fail-closed real-DC334 recovery harness, with live unsupported scenarios preserved as release evidence.**

## Performance

- **Duration:** 48 min
- **Started:** 2026-07-31T14:27:00Z
- **Completed:** 2026-07-31T15:15:00Z
- **Tasks:** 3/3
- **Files modified:** 8 tracked files (plus ignored raw harness reports under `/tmp`)

## Accomplishments

- Repaired the existing full ManageComponent Karma contract by restoring the row after synchronous list initialization, defining the status-poll Observable, and explicitly destroying direct-instantiated recovery components.
- Final focused ChromeHeadless passed 22/22; final full frontend ChromeHeadless passed 28/28 with no UI-01/UI-06 failure, `undefined.subscribe`, or Chrome disconnect.
- Added and ran a no-new-dependency bounded Playwright harness. Against the live auth-bypass frontend/API and mounted immutable source it passed empty-selection disabled-state, modal focus restoration, preflight, and no-mutation cleanup; it recorded all unavailable recovery scenarios as unsupported.
- Ran `npm run build` (exit 0), clean package/lockfile diff, and `npm ls --depth=0` (exit 0), then reconciled validation, verification, UAT, requirements, and milestone audit documents.

## Task Commits

1. **Task 1: Repair the full ManageComponent Karma contract and lifecycle cleanup** - `9dd8c15` (fix)
2. **Task 2: Build and execute the bounded real-DC334 browser recovery harness** - `32ddb16` (test)
3. **Task 3: Run release gates and reconcile all Phase 6 evidence** - `f96b628` (docs)

**Plan metadata:** pending final metadata commit.

## Files Created/Modified

- `src/app/pages/manage/manage.component.spec.ts` - Stabilizes row/focus DOM setup and artifact polling Observable setup.
- `src/app/pages/manage/phase6-validation.spec.ts` - Tears down direct-instantiated polling components after each test.
- `scripts/phase6-validation.js` - Bounded Playwright preflight, real UI observations, scenario matrix, redaction, counters, and finally cleanup.
- `.planning/phases/06-browser-download-release-validation/06-VALIDATION.md` - Exact final gate commands and authoritative harness facts.
- `.planning/phases/06-browser-download-release-validation/06-VERIFICATION.md` - Reconciled must-haves and remaining human blocker.
- `.planning/phases/06-browser-download-release-validation/06-UAT.md` - Partial UAT status matching actual live evidence.
- `.planning/v1.1-MILESTONE-AUDIT.md`, `.planning/REQUIREMENTS.md` - Updated requirement and milestone disposition.

## Decisions Made

- The observed failures were test lifecycle/setup failures, so production ManageComponent and API behavior were left unchanged.
- The current real API ID 334 row (`DC 319`, episode number 319, `episode_334.mp3`) does not match the supplied DC334 source. The harness did not stage or mutate it and did not fabricate recovery results.
- Prior full-selection ZIP evidence remains historical evidence; this run only claims the two live scenarios and cleanup it actually observed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test DOM lifecycle assumptions and leaked polling setup**
- **Found during:** Task 1
- **Issue:** `ngOnInit()` synchronously replaced the test episode row with `of([])`, causing UI-01 null DOM and UI-06 detached-focus failures; an unconfigured status spy caused `undefined.subscribe` and Chrome disconnect.
- **Fix:** Restore the row after initial change detection, define the status Observable, and destroy direct-instantiated recovery components after each spec.
- **Files modified:** `src/app/pages/manage/manage.component.spec.ts`, `src/app/pages/manage/phase6-validation.spec.ts`
- **Verification:** Focused 22/22 and full 28/28 ChromeHeadless passes.
- **Committed in:** `9dd8c15`

**Total deviations:** 1 auto-fixed (Rule 1 bug). **Impact:** Necessary test correctness/lifecycle repair; no production/API/dependency scope expansion.

## Issues Encountered

- Initial sandbox Karma run could not bind port 9876; the required elevated run with the existing `CHROME_BIN` executed successfully.
- The live API/frontend pair was not initially running; the documented API verification mode and existing frontend were used. No source/API mutation was performed by the harness.
- The mounted source was available, but the current API row metadata did not match it. Remaining live recovery scenarios are explicitly unsupported and remain human-needed.

## User Setup Required

None - no external service configuration or dependency installation was required.

## Next Phase Readiness

The full frontend regression/build gates are ready for release review, and the harness is reusable with explicit frontend/API/fixture paths. Milestone archival remains blocked on a correctly matched DC334 runtime or approved reversible verifier controls for partial, failed, network/401/403/404/409, reopen, same-job retry, reset, and repeated-completion browser evidence.

## Self-Check: PASSED

- `scripts/phase6-validation.js` exists.
- Commits `9dd8c15`, `32ddb16`, and `f96b628` exist in git history.
- Focused/full Karma, build, dependency, harness, and cleanup results are recorded in the validation artifact.

---
*Phase: 06-browser-download-release-validation*
*Plan: 04*
*Completed: 2026-07-31*
