---
phase: 11-trailer-artifact-compatibility-release
plan: 02
subsystem: artifact-downloads
tags: [angular, artifacts, trailer-video, regression-tests]
provides:
  - focused ApiService trailer-video selector request coverage
  - Manage modal finalized/staged/unavailable and generic delivery regressions
  - release verification record for frontend and sibling API gates
affects: [phase-11-artifacts]
tech-stack:
  added: []
  patterns: [regression coverage around the existing generic artifact lifecycle]
key-files:
  created:
    - .planning/phases/11-trailer-artifact-compatibility-release/11-VERIFICATION.md
    - .planning/phases/11-trailer-artifact-compatibility-release/11-02-SUMMARY.md
  modified:
    - src/app/core/api.service.spec.ts
    - src/app/pages/manage/manage.component.spec.ts
requirements-completed: [ARTIFACT-01, ARTIFACT-02]
status: checkpoint-human-verify
---

# Phase 11 Plan 02: Trailer Artifact Compatibility Regression Coverage

## Accomplishments

- Added the exact `trailer-video` ApiService POST route/body regression.
- Updated the Manage artifact fixture to the six-selector catalog and covered finalized `.mp4` availability, option order, filename hint, and exact selector submission.
- Covered absent, null, and staged-like DTO states as unavailable and excluded from submitted selectors.
- Covered completed trailer-containing jobs through the existing generic authenticated download path and backend 404/no-final-file preflight handling without fabricating a URL.
- Preserved the existing duplicate-start, progress/partial-missing, retry, reset, stale-job, native delivery, filename safety, and cleanup assertions.
- Ran the sibling API verifier and frontend type/build gates; recorded ChromeHeadless unavailability in `11-VERIFICATION.md`.

## Commits

- `a790adf` — `test(11-02): cover trailer-video artifact compatibility`

## Verification

- Spec compilation: PASS.
- Sibling API artifact verifier: PASS (exit 0).
- `npm run build`: PASS, with known selector-parser and Angular budget warnings.
- Focused and complete ChromeHeadless suites: blocked because no ChromeHeadless binary is installed; not claimed as passes.

## Deviations from Plan

None. The browser limitation is an explicitly recorded environment limitation required by the plan.

## Human-Verify Checkpoint

Plan execution stops here as required by the non-autonomous plan. Install/provide Chrome via `CHROME_BIN`, rerun the focused and complete ChromeHeadless commands in `11-VERIFICATION.md`, and perform the listed modal/preflight/native-download checks. Do not mark Phase 11-02 complete until those results are recorded.

## Self-Check: PASSED

- Both expected spec files exist and contain the trailer-video regressions.
- Verification artifact exists.
- Unrelated dirty application changes remain unstaged and uncommitted.
