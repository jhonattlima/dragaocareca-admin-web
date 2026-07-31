---
phase: 05-episode-download-modal
plan: 03
subsystem: ui
tags: [angular, manage, accessibility, artifact-jobs, karma]

requires:
  - phase: 05-02
    provides: Per-episode artifact selection, job orchestration, polling, and focus lifecycle helpers
provides:
  - Episodes-only Downloads column and accessible artifact picker dialog
  - Responsive modal styling for selection, progress, partial, failure, and ready states
  - Focused ManageComponent DOM, state, keyboard, and duplicate-submission coverage
affects: [phase-6-browser-download]

tech-stack:
  added: []
  patterns: [Native Angular modal controls with direct focus trapping, global legacy-layout modal styling]

key-files:
  created: [.planning/phases/05-episode-download-modal/05-03-SUMMARY.md]
  modified: [src/app/pages/manage/manage.component.html, src/app/pages/manage/manage.component.ts, src/styles.scss, src/app/pages/manage/manage.component.spec.ts]

key-decisions:
  - "Keep the Downloads action and artifact dialog scoped to the Episodes tab; Add episode remains unchanged."
  - "Render the completed downloadUrl as opaque state only; native ZIP delivery remains deferred to Phase 6."
  - "Use native buttons and checkboxes with direct focus entry, Tab trapping, Escape close, and invoker restoration."

patterns-established:
  - "Artifact modal progress is rendered below the fixed five-option list and above actions, independently from Add episode progress."
  - "Backend missing selectors are mapped to human-readable partial-result warnings and remain visible alongside Archive ready."

requirements-completed: [UI-01, UI-02, UI-03, UI-04, UI-05, UI-06]

coverage:
  - id: D1
    description: "Episodes rows expose a dedicated accessible icon-only Downloads action and a labeled five-option artifact dialog."
    requirement: UI-01
    verification:
      - kind: automated_ui
        ref: "src/app/pages/manage/manage.component.spec.ts#UI-01 exposes one labeled icon-only Downloads action per episode row and opens UI-02 modal"
        status: unknown
    human_judgment: true
    rationale: "The focused Karma suite compiled and started but could not launch without a ChromeHeadless binary."
  - id: D2
    description: "Artifact selection, local validation, progress, duplicate guards, partial results, retry states, and keyboard focus behavior are covered."
    requirement: UI-06
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts#artifact download modal suite"
        status: unknown
    human_judgment: true
    rationale: "Runtime execution is pending a ChromeHeadless-capable environment; npm build passes."

duration: 8min
completed: 2026-07-31
status: complete
---

# Phase 05 Plan 03: Episode Download Modal Summary

**Episodes-tab artifact picker with accessible native controls, modal-local job progress, recoverable partial/failure states, and keyboard focus lifecycle**

## Performance

- **Duration:** 8 min
- **Started:** 2026-07-31T03:05:30Z
- **Completed:** 2026-07-31T03:11:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added a dedicated Downloads column and icon-only labeled action to every persisted episode row while leaving Add episode untouched.
- Added the labeled native-checkbox modal with fixed option order, unavailable explanations, filename tooltips, empty-selection validation, progress placement, partial warnings, retry/failure actions, and opaque ready URL display.
- Added responsive legacy-layout styling and focused tests covering UI-01 through UI-06, including duplicate prevention and keyboard focus containment/restoration.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add the Episodes-tab Downloads action and dialog markup** - `5c2c064` (feat)
2. **Task 2: Style the artifact dialog within the existing operator layout** - `9973946` (feat)
3. **Task 3: Add Nyquist coverage for UI-01 through UI-06** - `bfbbce9` (test)

## Files Created/Modified

- `src/app/pages/manage/manage.component.html` - Episodes Downloads column and artifact dialog markup.
- `src/app/pages/manage/manage.component.ts` - Template visibility for the existing active-job predicate.
- `src/styles.scss` - Downloads action, modal, option, progress, state, responsive, and focus styling.
- `src/app/pages/manage/manage.component.spec.ts` - UI-01–UI-06 focused artifact modal tests.

## Decisions Made

- Kept all artifact state and progress separate from the Add episode editor and its upload/transcription/summary flows.
- Used the existing 05-02 orchestration methods and did not add a Phase 6 download request, Blob, object URL, or file-saver behavior.
- Kept the established delete-modal backdrop/dialog language and added visible focus styling suitable for keyboard users.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Corrected Angular template binding visibility and event typing**
- **Found during:** Task 2 verification build
- **Issue:** Angular rejected nullable `$event.currentTarget`, and the template could not call the private active-job predicate.
- **Fix:** Used Angular’s safe `$any` event cast and exposed the existing predicate as a template-safe public method; no behavior change.
- **Files modified:** `src/app/pages/manage/manage.component.html`, `src/app/pages/manage/manage.component.ts`
- **Verification:** `npm run build` passed.
- **Committed in:** `5c2c064`

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** Required only to compile the planned template; scope and Phase 6 boundary are unchanged.

## Issues Encountered

- The planned focused Karma command was run with the required localhost permission. Compilation and Karma startup succeeded, but execution was blocked because no ChromeHeadless binary is installed (`No binary for ChromeHeadless browser on your platform`). No package was installed because adding a browser dependency is outside this plan.
- `npm run build` passed. Existing metrics stylesheet and initial bundle budget warnings remain unchanged.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 5 plan 05-03 is ready for manual keyboard/UI verification and Phase 6 browser download implementation. The completed URL is intentionally displayed as state only; native ZIP delivery, object URL cleanup, and download behavior remain deferred.

## Self-Check: PASSED

- `src/app/pages/manage/manage.component.html`, `src/styles.scss`, `src/app/pages/manage/manage.component.spec.ts`, and this summary exist.
- Commits `5c2c064`, `9973946`, and `bfbbce9` exist in git history.
- `npm run build` passed.
- Planned focused test command was attempted and its environment limitation is documented.
- No native browser ZIP delivery, Blob, object URL, or file-saver behavior was introduced.

---
*Phase: 05-episode-download-modal*
*Completed: 2026-07-31*
