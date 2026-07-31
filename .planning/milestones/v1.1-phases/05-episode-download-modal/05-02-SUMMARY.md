---
phase: 05-episode-download-modal
plan: 02
subsystem: ui
tags: [angular, manage, artifact-jobs, polling, accessibility]

requires:
  - phase: 05-01
    provides: Typed canonical artifact selectors and ApiService start/status methods
provides:
  - Per-episode artifact picker availability and selection state
  - Guarded artifact job start, polling, terminal state, retry, and partial-result handling
  - Modal focus entry, keyboard trapping, Escape close, and invoker restoration
affects: [05-03-modal-ui, phase-6-browser-download]

tech-stack:
  added: []
  patterns: [Component-owned per-episode job map, single guarded polling interval, native modal focus lifecycle]

key-files:
  created: []
  modified: [src/app/pages/manage/manage.component.ts]

key-decisions:
  - "Keep artifact state in dedicated ManageComponent fields so Add episode editor, upload, transcription, and summary state remain untouched."
  - "Build API payloads only from fixed canonical selector values; row filenames are availability hints, never paths or backend authority."
  - "Retain active jobs and their poller across modal close/reopen, while clearing polling only at terminal state or component destruction."
  - "Expose completed downloadUrl as snapshot state only; native browser delivery remains deferred to Phase 6."

patterns-established:
  - "Five artifact options are always rendered in fixed selector order and default checked only when their trimmed filename is available."
  - "Transient status failures update recoverable UI error state without creating a second job or poller."

requirements-completed: [UI-02, UI-03, UI-04, UI-05, UI-06]

coverage:
  - id: D1
    description: "ManageComponent maps the five episode filename fields to ordered canonical artifact options with disabled unavailable choices and per-episode retained state."
    requirement: UI-02
    verification:
      - kind: other
        ref: "rg -n EpisodeArtifact/fileName/coverLowFileName/transcriptFileName/open.*Artifact/close.*Artifact/selected.*Artifact src/app/pages/manage/manage.component.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "ManageComponent guards artifact job submission, polls one active job, maps progress and terminal states, handles partial/all-unavailable results, and provides retry behavior."
    requirement: UI-04
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts"
        status: unknown
    human_judgment: true
    rationale: "The focused Karma suite could compile but ChromeHeadless could not launch because no Chrome binary is installed in the execution environment."
  - id: D3
    description: "Modal keyboard and focus lifecycle helpers contain Escape, Tab/Shift+Tab trapping, focus entry, and exact invoker restoration without native ZIP delivery."
    requirement: UI-06
    verification:
      - kind: other
        ref: "rg -n onArtifactModalKeydown/focusArtifactModal/closeArtifactModal src/app/pages/manage/manage.component.ts"
        status: pass
    human_judgment: true
    rationale: "Template wiring and browser-level focus behavior are delivered in plan 05-03 and require manual UI verification."

duration: 10min
completed: 2026-07-31
status: complete
---

# Phase 05 Plan 02: Episode Download Modal Orchestration Summary

**Per-episode artifact picker state and guarded asynchronous ZIP-job orchestration in ManageComponent**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-31T02:59:49Z
- **Completed:** 2026-07-31T03:04:37Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added fixed five-option artifact metadata and availability mapping from trimmed episode row filenames, with default selections and explicit unavailable state.
- Added isolated per-episode job retention, canonical selector submission, duplicate-start guards, one-cadence polling, progress/stage mapping, terminal cleanup, partial warnings, all-unavailable recovery, and retry.
- Added modal lifecycle helpers for focus entry, Escape close, Tab/Shift+Tab containment, and restoration to the exact row invoker; no browser download behavior was introduced.

## Task Commits

Each task was committed atomically:

1. **Task 1: Model row availability and modal-local selection state** - `96caf54` (feat)
2. **Task 2: Add guarded start, polling, terminal states, and focus lifecycle** - `4f5c917` (feat)

## Files Created/Modified

- `src/app/pages/manage/manage.component.ts` - Dedicated artifact option state, per-episode job map, API orchestration, polling, recoverable status handling, retry, and focus helpers.

## Decisions Made

- Kept artifact state separate from both `EpisodeFormState` instances and existing upload/transcription/summary timers.
- Submitted only canonical selector union values and left filesystem authority, ZIP creation, and artifact resolution to the backend.
- Retained active jobs across modal close/reopen and preserved `downloadUrl` as opaque completed-job data for Phase 6.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The focused Karma command could not launch: the environment has no ChromeHeadless binary (`No binary for ChromeHeadless browser on your platform`). No dependency was installed because adding a browser package is outside this plan.
- The first git commit attempt was blocked by sandbox read-only git metadata; the same atomic commit succeeded with approved elevated repository access.
- `npm run build` passed. Existing Angular stylesheet and initial bundle budget warnings remain unchanged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 05-03 can bind the template to the public artifact option/job helpers and focus handlers. Native ZIP delivery, Blob/object URL handling, and browser download behavior remain intentionally deferred to Phase 6.

## Self-Check: PASSED

- `src/app/pages/manage/manage.component.ts` exists and contains the required artifact state/orchestration symbols.
- Commits `96caf54` and `4f5c917` exist in git history.
- `npm run build` passed.
- The focused test command was attempted; execution is environment-blocked only by the missing ChromeHeadless binary.
- No Blob, object URL, file-saver, or native browser download behavior was introduced.

---
*Phase: 05-episode-download-modal*
*Completed: 2026-07-31*
