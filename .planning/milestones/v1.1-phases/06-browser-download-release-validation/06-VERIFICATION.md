---
phase: 06-browser-download-release-validation
verified: 2026-07-31T15:23:00Z
status: human_needed
score: 3/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 2/5
  gaps_closed:
    - "Focused and full CHROME_BIN-qualified ChromeHeadless Karma gates are now green after the 06-04 test-lifecycle repair."
    - "The API/frontend progress labels and 24/25/89/90 threshold coverage are aligned."
  gaps_remaining:
    - "Live browser recovery scenarios remain unsupported because the current API ID-334 row is DC-319 metadata and no reversible verifier control or matched completed job was available."
    - "Complete live VAL-02/release-owner acceptance remains outstanding."
  regressions: []
behavior_unverified_items:
  - truth: "Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely."
    test: "Against a correctly matched DC334 runtime or approved reversible verifier control, exercise empty selection, partial availability, failed preparation, network/401/403/404/409 delivery failures, completed reopen, reset, same-job retry, and repeated completion."
    expected: "Each state remains visible and recoverable; delivery retry reuses the completed URL without another preparation POST; reset enables a new selection/job; repeated completion does not redownload."
    why_human: "The bounded Playwright run only observed empty-selection and modal focus/cleanup. The current live ID-334 row is DC-319 metadata, so the remaining scenarios were correctly not mutated or claimed."
human_verification:
  - test: "Run the complete real-browser recovery matrix with a correctly matched DC334 runtime or an approved reversible verifier control."
    expected: "Partial, failed, network/authentication/expiry, reopen, reset, same-job retry, and repeated-completion states are usable; request counts show no duplicate preparation or download; object URLs are cleaned up."
    why_human: "The bounded harness report records these cases as unsupported, not passed, because the live episode 334 row does not match the supplied DC334 source."
  - test: "Release-owner review of the retained DC334 full-selection evidence."
    expected: "Accept or reject the historical five-entry ZIP evidence while explicitly acknowledging that Creating/Finalizing were not observed and the live recovery matrix is incomplete."
    why_human: "Release acceptance and visual/browser confidence cannot be inferred from source inspection or mocked Karma tests."
---

# Phase 6: Browser Download & Release Validation Verification Report

**Phase Goal:** Operators receive the completed ZIP in the browser and can understand and recover from partial, empty, and failed download outcomes using the DC 334 Season 3 fixture.
**Verified:** 2026-07-31T15:23:00Z
**Status:** human_needed — automated gates pass; live recovery and release acceptance remain open
**Re-verification:** Yes — after Plan 06-04

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A completed job triggers one native browser ZIP download with the backend-provided safe filename, without a ZIP or file-saver dependency. | ✓ VERIFIED | `ApiService` uses authenticated `HttpClient` Blob delivery; `ManageComponent` validates `Content-Disposition`, activates one temporary anchor, and revokes its object URL. Retained real DC334 evidence records one preparation POST, one authenticated Blob GET, one native `episode-334-artifacts.zip` download, one activation, and one revoke. Package/lockfile diff is clean. |
| 2 | A partially fulfilled job downloads successfully while clearly warning which requested artifacts were unavailable; object URLs are cleaned up after delivery. | ⚠️ UNCERTAIN | The implementation and focused recovery specs cover missing-artifact labels and cleanup, and the five-entry full-selection ZIP is retained. The bounded real-browser harness did not reach a partial job, so live partial-warning/download evidence is absent. |
| 3 | Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Focused ChromeHeadless specs pass the mocked state/recovery assertions, and the live harness passes empty-selection disabled-state plus modal focus restoration. Failed, partial, auth/network/expiry, reopen, retry, reset, and repeated-completion live cases are explicitly unsupported. |
| 4 | The DC334 Season 3 fixture produces a manually verified ZIP whose contents match the selected available artifacts and visible progress. | ✓ VERIFIED (historical full-selection path) | Prior retained browser evidence used the mounted immutable source and recorded server filename plus ZIP entries `episode-334/audio.mp3`, `trailer.mp3`, `transcript.txt`, `cover.jpeg`, and `cover.webp`; fixture/database/media cleanup passed. Only `Preparing files` and `Archive ready` were observed; Creating/Finalizing were not claimed. The 06-04 run did not re-stage the mismatched live row. |
| 5 | Existing frontend tests and `npm run build` pass after the feature is integrated. | ✓ VERIFIED | Fresh focused run: 22/22. Fresh full ChromeHeadless run: 28/28. `npm run build`: exit 0. `git diff --exit-code -- package.json package-lock.json`, `npm ls --depth=0`, and harness help all exit 0. Known selector-parser and Angular budget warnings remain non-blocking. |

**Score:** 3/5 truths verified (1 uncertain, 1 present-but-behavior-unverified)

The phase is not ready for clean milestone closure. The previous full-test blocker is closed; the remaining escalation is live recovery evidence and release-owner disposition, not an observed implementation/test failure.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/app/core/api.service.ts` | Authenticated typed Blob response with headers and API-origin URL normalization | ✓ VERIFIED | `downloadEpisodeArtifact()` returns `HttpResponse<Blob>`, observes headers, requests a Blob, and resolves relative URLs against the API origin. |
| `src/app/core/api.service.spec.ts` | Blob/header/auth-path transport coverage | ✓ VERIFIED | Included in the focused run; API contract assertions pass. |
| `src/app/pages/manage/manage.component.ts` | Native delivery, server filename, cleanup, retry/reset, progress thresholds | ✓ VERIFIED | Completion identity guard, filename validation, anchor activation, `finally` cleanup, same-job retry, reset, and `<25`/`<90` stage mapping are implemented. |
| `src/app/pages/manage/manage.component.html` | Ready, progress, missing, failure, retry, reset, and empty states | ✓ VERIFIED | Dynamic modal bindings expose the relevant states and actions. |
| `src/app/pages/manage/manage.component.spec.ts` | UI, delivery, recovery, polling cleanup, and editor isolation coverage | ✓ VERIFIED | The focused/full ChromeHeadless runs pass, including 06-04 UI-01/UI-06 and teardown repairs. |
| `src/app/pages/manage/phase6-validation.spec.ts` | Focused recovery contract coverage | ✓ VERIFIED | Focused suite passes; this is mocked/state coverage, not a substitute for live browser recovery. |
| `src/app/pages/manage/phase6-progress-threshold.spec.ts` | 24/25/89/90 boundary assertions | ✓ VERIFIED | Focused suite passes. |
| `scripts/phase6-validation.js` | Bounded fail-closed Playwright harness | ✓ VERIFIED | Explicit deadlines, redacted request capture, unsupported scenario classification, and `finally` cleanup are present; report was produced. |
| `../dragaocareca-admin-api/src/app.ts` | CORS exposure for browser-readable filename/missing headers | ✓ VERIFIED | Retained validation evidence records `Content-Disposition` and `X-Missing-Artifacts` exposure and Angular-readable filename. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ManageComponent` | `ApiService` | Completed `downloadUrl` invokes Blob delivery; delivery retry reuses the URL | ✓ WIRED | `storeArtifactJob()` → `deliverCompletedArtifact()` → `downloadEpisodeArtifact()`; retry does not call preparation. |
| `ApiService` | `AuthInterceptor` | Download uses injected Angular `HttpClient` | ✓ WIRED | No direct navigation, fetch, query-token auth, or file-saver dependency is used. |
| `ManageComponent` | `Content-Disposition` | Response header → validated temporary-anchor filename | ✓ WIRED | Missing, malformed, path-like, and control-character names fail closed; no client-derived fallback exists. |
| Sibling API | Angular browser | CORS-exposed response headers | ✓ VERIFIED | Prior real browser evidence observed the exposed headers and Angular-readable server filename. |
| Sibling API | `ManageComponent` | Progress-stage vocabulary | ✓ VERIFIED | Frontend uses preparation `<25`, Creating ZIP `<90`, and Finalizing ZIP `>=90`; focused threshold test passes. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `manage.component.html` | Job snapshot, progress, missing labels, delivery state | API job snapshots and completed Blob response | Yes on retained full-selection flow; live recovery paths not exercised | ⚠️ FLOWING — incomplete recovery evidence |
| `api.service.ts` | Blob body and response headers | Authenticated completed-download endpoint | Yes; retained browser evidence recorded HTTP 200 ZIP and safe filename | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Focused Manage/recovery/threshold suite | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts' --include='src/app/pages/manage/phase6-validation.spec.ts' --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | Exit 0; 22/22 passed in Chrome Headless 149 | ✓ PASS |
| Full frontend Karma | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless` | Exit 0; 28/28 passed; no polling cleanup error or Chrome disconnect | ✓ PASS |
| Production build | `npm run build` | Exit 0; selector-parser and Angular budget warnings only | ✓ PASS WITH WARNINGS |
| Dependency immutability | `git diff --exit-code -- package.json package-lock.json` | Exit 0; no manifest/lockfile changes | ✓ PASS |
| Installed dependency tree | `npm ls --depth=0` | Exit 0; existing Playwright 1.61.0, no install attempted | ✓ PASS |
| Progress boundaries | Focused threshold spec within the 22-test run | 24%, 25%, 89%, and 90% assertions pass | ✓ PASS |
| Real DC334 full-selection flow | Retained `06-VALIDATION.md` evidence | One POST, one Blob GET, one native download, five expected ZIP entries, CORS filename, cleanup | ✓ PASS — historical full-selection only |

## Probe Execution

No phase-declared or conventional `probe-*.sh` exists for this frontend validation phase.

## Bounded Playwright Harness

| Evidence | Result |
|---|---|
| Report | `/tmp/phase6-validation-final-2/phase6-validation.json` |
| Preconditions | Chromium, frontend, API health, mounted immutable source, and empty media destination passed; API lookup returned HTTP 200. |
| Live row identity | ID 334 currently reports title `DC 319 - Rapidinhas do Careca - Músicas plásticas para sentimentos bons e ruins`, `episodeNumber=319`, `fileName=episode_334.mp3`, `coverFileName=episode_334.jpeg`; it does not match the supplied DC334 source. |
| Live passes | Empty selection disabled `Prepare archive` with zero preparation POSTs; modal close restored focus to the original Downloads invoker; cleanup left the media destination unchanged. |
| Unsupported, not passed | Partial, failed preparation, network, 401, 403, 404, 409, completed reopen, same-job retry, reset/new selection, and repeated completion. No mutation or fabricated recovery claim was made. |
| Browser hygiene | 26 requests / 25 responses in the retained report, no page errors, no live download in this bounded run, and no captured tokens/cookies. |

## Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
|---|---|---|---|
| UI-07 | `06-01-PLAN.md` | ✓ SATISFIED | Native one-download implementation, focused tests, CORS-readable server filename, and retained real full-selection evidence. |
| UI-08 | `06-01-PLAN.md` | ? NEEDS HUMAN | Focused recovery tests pass, but the live partial/error/retry/reset/reopen matrix is unsupported and remains unapproved. |
| VAL-01 | `06-02-PLAN.md` | ✓ SATISFIED WITH CAVEAT | Prior reversible staging used the supplied mounted DC334 folder and restored the original row/media state. The current live ID-334 row is DC-319 metadata, so no new staging was attempted. |
| VAL-02 | `06-02-PLAN.md` | ? NEEDS HUMAN / PENDING | Historical full-selection ZIP evidence exists, but complete live progress/recovery validation for a correctly matched current fixture is not complete. |
| VAL-03 | `06-01/02/03/04-PLAN.md` | ✓ SATISFIED | Fresh 22/22 focused and 28/28 full Karma, build exit 0, clean dependency diff, and `npm ls --depth=0` exit 0. |

No Phase 6 requirement is orphaned. The unchecked `VAL-02` row in `REQUIREMENTS.md` is consistent with this report; the stale checked UI-08/VAL-01/VAL-03 entries are reconciled here with their caveats.

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|---|---|---|---|
| Phase-modified source/tests | No unreferenced `TBD`, `FIXME`, or `XXX`; no placeholder delivery implementation; no new dependency | ℹ️ INFO | No blocker anti-pattern found. |
| `npm run build` output | Existing selector-parser errors skipped and Angular style/initial-bundle budget warnings | ⚠️ WARNING | Build still exits 0; warnings remain release-quality debt, not a Phase 6 gate failure. |

## Human Verification Required

1. Run the remaining live recovery matrix against a correctly matched DC334 runtime or an approved reversible verifier control. The current live episode 334 row is DC-319 metadata; no mutation should be attempted merely to force coverage.
2. Confirm partial warning/download, failed preparation, network/401/403/404/409 recovery, completed reopen, same-job retry without a second preparation POST, reset/new selection, repeated-completion idempotence, and object-URL cleanup in the browser.
3. Have the release owner decide whether the retained full-selection ZIP evidence is acceptable while Creating/Finalizing were not observed and the live recovery matrix remains incomplete.

## Gaps Summary

The 06-04 test-lifecycle repair is verified: focused 22/22 and full 28/28 ChromeHeadless pass, and the previous UI-01/UI-06/polling-cleanup blocker is closed. Native delivery, server filename handling, progress thresholds, retry/reset boundaries, CORS exposure, fixture safety, and the retained real full-selection DC334 ZIP evidence are present and wired.

The phase is not fully release-ready because the bounded live harness correctly stopped at the available safe checks. Its API preflight found that row ID 334 currently contains DC-319 metadata, not the supplied DC334 fixture; it therefore did not stage or mutate the row, did not start a job, and did not claim partial/failure/auth/expiry/reopen/retry/reset/repeated-completion results. UI-08 and VAL-02 remain human-needed/pending, so the phase is ready for developer/release-owner decision, not clean milestone archival.

---

_Verified: 2026-07-31T15:23:00Z_
_Verifier: the agent (gsd-verifier)_
