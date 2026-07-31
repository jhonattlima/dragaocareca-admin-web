---
phase: 06-browser-download-release-validation
verified: 2026-07-31T14:51:49Z
status: gaps_found
score: 2/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 2/5
  gaps_closed:
    - "Frontend artifact progress labels now mirror the API at <25% and <90% boundaries."
  gaps_remaining:
    - "Real-browser recovery matrix remains incomplete."
    - "Full frontend Karma release gate is not green."
  regressions: []
gaps:
  - truth: "Existing frontend tests and npm run build pass after the feature is integrated."
    status: failed
    reason: "The production build passes, but the fresh full ChromeHeadless Karma run is not green: UI-01 and UI-06 fail, polling cleanup throws undefined.subscribe, and Chrome disconnects after 22 of 28 tests."
    artifacts:
      - path: "src/app/pages/manage/manage.component.spec.ts"
        issue: "UI-01 fails while locating the Downloads row markup and UI-06 fails invoker-focus restoration."
      - path: "src/app/pages/manage/manage.component.ts"
        issue: "The full run reports an existing polling cleanup error at ensureArtifactJobPolling()."
    missing:
      - "A clean full frontend Karma run, or explicit release-owner acceptance of these pre-existing failures."
  - truth: "A partially fulfilled job downloads successfully while clearly warning which requested artifacts were unavailable; object URLs are cleaned up after delivery."
    status: partial
    reason: "The implementation and focused browser-backed Karma recovery spec cover the behavior, but the real DC334 Playwright recovery harness never reached partial availability or its subsequent scenarios."
    artifacts:
      - path: ".planning/phases/06-browser-download-release-validation/06-VALIDATION.md"
        issue: "Only the full-selection DC334 browser download has a result artifact; partial browser evidence is absent."
      - path: "src/app/pages/manage/phase6-validation.spec.ts"
        issue: "Six mocked recovery assertions pass, but they do not replace the requested real-browser matrix."
    missing:
      - "Real-browser partial-availability download and missing-artifact warning evidence."
  - truth: "Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely."
    status: partial
    reason: "Source and focused specs are present, but the bounded real-browser harness stopped at the disabled empty-selection control; later retry, auth/network/expiry, reopen, reset, and repeated-completion cases were not executed."
    artifacts:
      - path: ".planning/phases/06-browser-download-release-validation/06-VALIDATION.md"
        issue: "The recovery matrix is explicitly recorded as incomplete."
    missing:
      - "A completed real-browser recovery matrix with request-count evidence."
behavior_unverified_items:
  - truth: "Empty-selection, failed-job, network/authentication, reset, and retry states remain understandable and recoverable in the existing modal."
    test: "Exercise empty selection, partial availability, failed preparation, network/401/403/404/409 delivery failures, reopen, reset, same-job retry, and repeated completion in the browser."
    expected: "Each state remains visible and recoverable; delivery retry reuses the completed URL without another preparation POST; reset enables a new selection/job; repeated completion does not redownload."
    why_human: "Presence and mocked Karma assertions cannot prove the complete live browser flow; the recorded Playwright harness stopped before these cases."
human_verification:
  - test: "Complete the real-browser recovery matrix for the artifact modal."
    expected: "Empty, partial, failed, network/authentication/expiry, reopen, reset, same-job retry, and repeated-completion states are usable and request counts show no duplicate preparation or download."
    why_human: "The existing Playwright harness timed out after confirming the empty-selection button was correctly disabled; later scenarios have no browser result artifact."
  - test: "Resolve or explicitly accept the full frontend Karma failures."
    expected: "The full ChromeHeadless suite passes, or the release owner records acceptance of the UI-01/UI-06 failures and polling cleanup error."
    why_human: "The failures are test/runtime evidence requiring developer or release-owner judgment; they cannot be reclassified as passing by source inspection."
  - test: "Review DC334 release acceptance."
    expected: "Accept the recorded full-selection ZIP and fixture cleanup evidence while acknowledging that Creating ZIP/Finalizing ZIP were not captured and recovery remains incomplete."
    why_human: "Release-policy acceptance and visual browser approval are not inferable from code or the partial harness."
---

# Phase 6: Browser Download & Release Validation Verification Report

**Phase Goal:** Operators receive the completed ZIP in the browser and can understand and recover from partial, empty, and failed download outcomes using the DC 334 Season 3 fixture.
**Verified:** 2026-07-31T14:51:49Z
**Status:** gaps_found — Karma gap closed; live recovery evidence remains partial
**Re-verification:** Yes — after 06-03 threshold gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A completed job triggers one native browser ZIP download with the backend-provided safe filename, without a ZIP or file-saver dependency. | ✓ VERIFIED | `api.service.ts` uses authenticated `HttpClient` Blob delivery; `manage.component.ts` parses the server `Content-Disposition`, activates one temporary anchor, and revokes the object URL. Recorded Playwright DC334 evidence shows one preparation POST, one Blob GET, one native download named `episode-334-artifacts.zip`, one object URL, one activation, and one revoke. Package and lockfile diff is clean. |
| 2 | A partially fulfilled job downloads successfully while clearly warning which requested artifacts were unavailable; object URLs are cleaned up after delivery. | ⚠️ UNCERTAIN | Template/source wiring and the focused six-test recovery suite cover missing-artifact labels and cleanup, but the live recovery harness did not reach partial availability. |
| 3 | Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Source and mocked browser-backed specs cover the states; the required real-browser matrix is incomplete. |
| 4 | The DC334 Season 3 fixture produces a manually verified ZIP whose contents match the selected available artifacts and visible progress. | ✓ VERIFIED (full-selection path) | `06-VALIDATION.md` records the real mounted fixture, restored API row, removed destination, one native download, server filename, and ZIP entries `episode-334/audio.mp3`, `trailer.mp3`, `transcript.txt`, `cover.jpeg`, and `cover.webp`. Only `Preparing files` and `Archive ready` were observed; short-lived Creating/Finalizing states were not claimed. |
| 5 | Existing frontend tests and `npm run build` pass after the feature is integrated. | ✓ VERIFIED | Final focused Karma: 22/22; final full ChromeHeadless Karma: 28/28; polling cleanup and browser disconnect are gone. `npm run build`: exit 0 with existing selector-parser and Angular budget warnings. |

**Score:** 3/5 truths verified (1 uncertain, 1 present-but-behavior-unverified)

The phase is not ready for milestone audit: the failed full-test release gate and the incomplete live recovery matrix remain escalation-gate items.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/app/core/api.service.ts` | Authenticated typed Blob response with headers and URL normalization | ✓ VERIFIED | `downloadEpisodeArtifact()` returns `HttpResponse<Blob>`, observes the response, requests a Blob, and resolves relative URLs against the API origin. |
| `src/app/core/api.service.spec.ts` | API Blob/header/auth-path coverage | ✓ VERIFIED | Focused ChromeHeadless run: 4/4 passed. |
| `src/app/pages/manage/manage.component.ts` | Native delivery, server filename, cleanup, retry/reset | ✓ VERIFIED | Completion identity guard, same-job delivery retry, filename validation, anchor activation, and `finally` cleanup are implemented and wired. |
| `src/app/pages/manage/manage.component.html` | Ready, progress, missing, failure, retry, reset, and empty states | ✓ VERIFIED | Dynamic bindings connect modal state to visible labels, warnings, errors, and actions. |
| `src/app/pages/manage/manage.component.spec.ts` | Delivery and recovery regression coverage | ⚠️ PARTIAL | Full run fails UI-01/UI-06 and reports the polling cleanup error. |
| `src/app/pages/manage/phase6-validation.spec.ts` | Focused recovery assertions | ✓ VERIFIED | Focused ChromeHeadless run: 6/6 passed; mocked coverage only. |
| `src/app/pages/manage/phase6-progress-threshold.spec.ts` | API stage boundary coverage | ✓ VERIFIED | Focused ChromeHeadless run: 1/1 passed for 24%, 25%, 89%, and 90%. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ManageComponent` | `ApiService` | Completed `downloadUrl` invokes Blob delivery; delivery retry is separate from preparation retry | ✓ WIRED | `storeArtifactJob()` → `deliverCompletedArtifact()` → `downloadEpisodeArtifact()`; `retryArtifactDelivery()` reuses the URL and does not start a preparation job. |
| `ApiService` | `AuthInterceptor` | Download uses injected Angular `HttpClient` | ✓ WIRED | The existing interceptor remains the bearer-token boundary. |
| `ManageComponent` | `Content-Disposition` | Response header → temporary anchor filename | ✓ WIRED | Server filename is parsed and validated; no client-derived fallback is used. |
| Sibling API | Angular browser | CORS exposed headers | ✓ VERIFIED from recorded evidence | `06-VALIDATION.md` records `Content-Disposition` and `X-Missing-Artifacts` exposure plus Angular-readable filename evidence. |
| Sibling API | `ManageComponent` | Progress-stage vocabulary | ✓ VERIFIED | Source uses `<25` preparation, `<90` Creating ZIP, and `>=90` Finalizing ZIP; focused threshold test passes. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `manage.component.html` | `artifactJob`, progress, missing labels, delivery status | API job snapshots and completed Blob response | Yes for the recorded full-selection DC334 flow; recovery paths are not live-verified | ⚠️ FLOWING — incomplete recovery evidence |
| `api.service.ts` | Blob body and response headers | Authenticated completed-download endpoint | Yes; recorded browser response was HTTP 200 with ZIP and safe filename | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Progress-stage thresholds | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | Exit 0; 1/1 passed in Chrome Headless 149 | ✓ PASS |
| API Blob contract | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | Exit 0; 4/4 passed | ✓ PASS |
| Focused recovery behavior | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/phase6-validation.spec.ts'` | Exit 0; 6/6 passed; mocked state/recovery coverage | ✓ PASS (scoped) |
| Full frontend Karma | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless` | Exit 0; 28/28 passed with no polling cleanup error or Chrome disconnect | ✓ PASS |
| Production build | `npm run build` | Exit 0; existing selector-parser warnings and metrics/initial-bundle budget warnings | ✓ PASS with warnings |
| Dependency immutability | `git diff --exit-code -- package.json package-lock.json` | Exit 0; no manifest or lockfile changes | ✓ PASS |
| Real DC334 full-selection browser flow | Recorded in `06-VALIDATION.md` | One preparation POST, one Blob GET, one native download, five expected ZIP entries, CORS filename visibility, fixture cleanup | ✓ PASS for full-selection only |

## Probe Execution

No phase-declared or conventional `probe-*.sh` was found for this frontend validation phase.

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| UI-07 | `06-01-PLAN.md` | ✓ SATISFIED | Native one-download implementation plus recorded real DC334 full-selection browser evidence. |
| UI-08 | `06-01-PLAN.md` | ? NEEDS HUMAN | Focused six-test suite passes, but the live partial/error/retry/reset/reopen matrix is unexecuted. |
| VAL-01 | `06-02-PLAN.md` | ✓ SATISFIED | Real provided DC334 fixture was staged, used, then the original row and destination were restored; source was not modified. |
| VAL-02 | `06-02-PLAN.md` | ✗ BLOCKED | Full-selection ZIP contents are recorded, but complete manual UI/recovery validation is not complete. |
| VAL-03 | `06-01/02/03-PLAN.md` | ✓ SATISFIED | Final focused/full ChromeHeadless Karma, build, dependency diff, and installed dependency check pass. |

The roadmap’s five Phase 6 success criteria were all checked. No Phase 6 requirement is orphaned in the plans; the checked requirement list in `REQUIREMENTS.md` is not treated as evidence where current validation contradicts it.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| Phase-modified source files | No unreferenced `TBD`, `FIXME`, or `XXX`; no placeholder implementation found | ℹ️ Info | No new debt marker blocker. The full-suite polling cleanup error is recorded above as a test/release gap. |

## Human Verification Required

1. Complete the real-browser recovery matrix: empty selection, partial availability, failed preparation, network, 401/403, 404/409 expiry, reopen, reset, same-job delivery retry, and repeated completion. Record visible outcomes and preparation/download request counts.
2. Stage a correctly matched DC334 runtime or provide an approved reversible verifier control before calling the remaining live recovery scenarios complete.
3. Have the release owner accept the recorded full-selection DC334 result with the unobserved Creating/Finalizing stages and incomplete recovery evidence explicitly acknowledged.

## Gaps Summary

06-03 successfully closed the API/frontend progress-boundary mismatch: source and the 24/25/89/90 focused test now agree on the sibling API contract. 06-04 closes the full Karma/UI-01/UI-06/polling cleanup gap and retains native Blob delivery, safe server filename handling, object-URL cleanup, same-job delivery retry, reset, and prior full-selection DC334 ZIP evidence. The phase remains partial only because the live recovery matrix could not safely run against the mismatched current episode-334 row without a reversible control.

---

_Verified: 2026-07-31T14:51:49Z_
_Verifier: the agent (gsd-verifier)_

## 06-04 authoritative re-verification — 2026-07-31

The prior full-suite and polling-cleanup gap is closed by commit `9dd8c15`: the focused run passed 22/22 and the full ChromeHeadless run passed 28/28 with no afterAll error or disconnect. The change is limited to test lifecycle setup/teardown; production artifact delivery behavior remains covered by the existing focused tests.

The bounded real-DC334 harness is committed as `32ddb16` and produced `/tmp/phase6-validation-final-2/phase6-validation.json`. It passed preflight, empty-selection disabled-state (`preparationPosts=0`), modal cleanup/focus restoration, and no-mutation cleanup. It recorded partial, failed-preparation, network, 401, 403, 404, 409, reopen, same-job retry, reset, and repeated-completion scenarios as unsupported because the live episode-334 row metadata is `DC 319`/episode number 319 and no reversible verifier control or correctly prepared completed job was available. No scenario is counted as passed without browser evidence.

Current requirement disposition: UI-07 remains satisfied from prior full-selection evidence; UI-08 is implementation-tested but live recovery remains needs-human; VAL-01 retains prior fixture/configuration evidence but the current preflight exposes the row/source mismatch; VAL-02 remains blocked for complete recovery/ZIP validation; VAL-03 is satisfied by 22/22 focused, 28/28 full Karma, build exit 0, clean dependency diff, and `npm ls --depth=0` exit 0. Existing selector-parser and Angular budget warnings remain non-blocking.
