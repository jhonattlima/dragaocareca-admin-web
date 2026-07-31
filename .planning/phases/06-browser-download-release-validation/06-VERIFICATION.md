---
phase: 06-browser-download-release-validation
verified: 2026-07-31T14:43:30Z
status: human_needed
score: 2/5 must-haves verified
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Empty, partial, failed, reset, repeated-completion, reopen, network, authentication, and expired-download states remain understandable and recoverable in the existing modal."
    test: "Exercise the complete recovery matrix in a browser, including empty selection, partial availability, failed preparation, network/401/403/404/409 delivery failures, reopen, reset, and same-job retry."
    expected: "Each state remains visible and recoverable; delivery retry reuses the completed URL without another preparation POST; reset enables a new selection/job."
    why_human: "The implementation and Jasmine specs are present, but the bounded Playwright recovery harness stopped at the disabled empty-selection control; the new Karma run does not replace the missing real-browser recovery matrix."
human_verification:
  - test: "Complete the browser recovery matrix for the artifact modal."
    expected: "Empty selection is clear; partial downloads warn about missing selectors; failed/network/auth/expired states retain the completed or failed context and expose the correct retry/reset action; same-job delivery retry sends no new preparation POST; repeated completion/reopen does not redownload."
    why_human: "The recorded Playwright harness timed out after confirming the disabled empty-selection state, so later scenarios have no evidence."
  - test: "Run the frontend Karma suite in a browser-capable environment."
    expected: "The full frontend test suite executes and passes, including the API and ManageComponent Phase 6 specs."
    why_human: "The browser-qualified suite executes with the existing Chromium binary, but the full suite has pre-existing UI-01/UI-06 failures and an existing polling-spy afterAll error; it is not a clean release gate."
  - test: "Review the real DC 334 flow as release approval, if required by release policy."
    expected: "The full-selection ZIP evidence is accepted together with explicit acknowledgment that Creating ZIP/Finalizing ZIP were not observed and recovery remains incomplete."
    why_human: "Visual/browser approval and release-policy acceptance are not inferable from source or a partial automated harness."
---

# Phase 6: Browser Download & Release Validation Verification Report

**Phase Goal:** Operators receive the completed ZIP in the browser and can understand and recover from partial, empty, and failed download outcomes using the DC 334 Season 3 fixture.
**Verified:** 2026-07-31T14:12:00Z
**Status:** human_needed
**Re-verification:** Yes — 06-03 threshold correction and release-gate rerun

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A completed job triggers one native browser ZIP download with the backend-provided safe filename, without a ZIP or file-saver dependency. | ✓ VERIFIED | `ManageComponent.storeArtifactJob()` calls delivery only for completed snapshots; delivery is keyed by job and URL, parses `Content-Disposition`, activates one temporary anchor, and revokes the object URL in `finally`. The recorded Playwright run observed one preparation POST, one authenticated Blob GET, one native download, filename `episode-334-artifacts.zip`, one object URL, one activation, and one revoke. No package/lockfile changes. |
| 2 | A partially fulfilled job downloads successfully while warning which requested artifacts were unavailable; object URLs are cleaned up after delivery. | ? UNCERTAIN — human needed | The template renders `missing` selector labels and the implementation cleans object URLs, but the real browser evidence covered only the full-selection case. Partial-availability behavior was not reached by the recovery harness. |
| 3 | Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Source and focused specs cover disabled empty selection, failed preparation retry, delivery errors, 401/404/409 messaging, same-URL retry, reset, repeated completion, and reopen. The bounded Playwright recovery harness still stopped after the disabled empty-selection check; the new Karma run does not replace the missing real-browser recovery matrix. |
| 4 | The DC 334 Season 3 mock episode and provided fixture produce a manually verified ZIP whose contents match selected available artifacts and visible progress. | ✓ VERIFIED for full-selection evidence; recovery approval outstanding | The validation record reports the real mounted fixture staged through the sibling API canonical layout, CORS-readable filename, one native download, and ZIP entries `episode-334/audio.mp3`, `trailer.mp3`, `transcript.txt`, `cover.jpeg`, and `cover.webp`; the destination and original row were restored. This does not prove the uncompleted recovery matrix or the short-lived Creating ZIP/Finalizing ZIP observations. |
| 5 | Existing frontend tests and `npm run build` pass after integration. | ⚠️ PARTIAL — pre-existing test debt remains | The focused API suite passed 4/4 and the threshold suite passed 1/1 in Chrome Headless 149. The full browser-qualified suite executed all 28 assertions, with 26 passing and pre-existing UI-01/UI-06 failures plus the existing polling-spy `undefined.subscribe` afterAll error. `npm run build` exited 0 (hash `a4d773fb83093a85`) with only existing selector-parser and Angular budget warnings. |

**Score:** 2/5 truths verified (1 present, behavior-unverified; 2 require human/release follow-up)

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/app/core/api.service.ts` | Authenticated typed Blob response with headers and API-origin URL normalization | ✓ VERIFIED | `downloadEpisodeArtifact()` returns `HttpResponse<Blob>`, uses `observe: 'response'`, `responseType: 'blob'`, and resolves relative URLs. |
| `src/app/core/api.service.spec.ts` | HTTP contract coverage | ✓ VERIFIED | Tests assert route, GET, Blob response type, ZIP body, Content-Disposition, and absolute URL preservation. |
| `src/app/pages/manage/manage.component.ts` | Exactly-once delivery, server filename, cleanup, retry/reset | ✓ VERIFIED | Completion guard, retry separation, filename validation, native anchor activation, and `finally` cleanup are implemented. |
| `src/app/pages/manage/manage.component.html` | Ready, progress, missing, failure, retry, reset, empty-selection presentation | ✓ VERIFIED | Dynamic status/warning/error/action bindings are present and wired. |
| `src/app/pages/manage/manage.component.spec.ts` | Delivery and recovery coverage | ⚠️ PARTIAL — two pre-existing failures | The focused/full browser run executes this suite, but UI-01 and UI-06 fail on existing DOM/fixture assumptions and the existing polling-spy afterAll error remains. |
| `src/app/pages/manage/phase6-progress-threshold.spec.ts` | API/UI boundary coverage | ✓ VERIFIED | Chrome Headless executed 1/1 assertion for 24%, 25%, 89%, and 90% labels. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `ManageComponent` | `ApiService` | Completed snapshot `downloadUrl` invokes Blob method; delivery retry is separate from preparation retry | ✓ WIRED | `storeArtifactJob()` → `deliverCompletedArtifact()` → `downloadEpisodeArtifact()`; `retryArtifactDelivery()` does not call `startEpisodeArtifactJob()`. |
| `ApiService` | `AuthInterceptor` | Injected `HttpClient` request | ✓ WIRED | `ApiService` injects `HttpClient`; download uses it rather than navigation/fetch. `AuthInterceptor` clones requests with `Authorization: Bearer`. |
| `ManageComponent` | `Content-Disposition` | Header parse → anchor download name | ✓ WIRED | `activateArtifactDownload()` reads the response header and rejects missing/unsafe names; no client-derived fallback is used. |
| Sibling API | Browser Angular client | CORS exposed response headers | ✓ VERIFIED | Validation evidence records `Access-Control-Expose-Headers: Content-Disposition,X-Missing-Artifacts` and Angular XHR-readable `Content-Disposition`. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| `manage.component.html` | `artifactJob`, progress, `missing`, delivery status | API start/status snapshots and completed Blob response | Yes in recorded DC 334 full-selection run; partial/recovery paths unexercised | ⚠️ FLOWING — recovery evidence incomplete |
| `api.service.ts` | Blob and response headers | Authenticated API download endpoint | Yes; Playwright observed HTTP 200 ZIP and server filename | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Production frontend build | `npm run build` | Exit 0; Angular build completed, existing selector and budget warnings reported | ✓ PASS |
| Focused threshold suite | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | Exit 0; 1/1 boundary assertion passed | ✓ PASS |
| Focused API suite | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | Exit 0; 4/4 assertions passed | ✓ PASS |
| Frontend Karma suite | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless` | Exit 1; 28 executed, 26 passed, pre-existing UI-01/UI-06 failures and polling-spy afterAll error | ? HUMAN NEEDED |
| Real DC 334 full-selection browser flow | Playwright evidence recorded in `06-VALIDATION.md` | One POST, one Blob GET, one native download, CORS-readable filename, five ZIP entries, cleanup/restoration pass | ✓ PASS — recorded evidence |

## Probe Execution

No phase-declared `probe-*.sh` or conventional project probe was found for this frontend validation phase.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| UI-07 | `06-01-PLAN.md` | Browser automatically downloads ZIP on completion | ✓ SATISFIED | Source wiring plus real Playwright one-download/full-selection evidence. |
| UI-08 | `06-01-PLAN.md` | Clear empty, partial, failure, reset, retry states | ? NEEDS HUMAN | Source/spec coverage exists, but Karma and later browser recovery scenarios did not execute. |
| VAL-01 | `06-02-PLAN.md` | DC 334 fixture configured through provided episode folder | ✓ SATISFIED | Real mounted source, canonical API destination, five files, row snapshot, and cleanup are recorded. |
| VAL-02 | `06-02-PLAN.md` | Complete UI flow manually validated, including progress and ZIP contents | ? NEEDS HUMAN | Full-selection ZIP and filename/progress evidence passed, but partial/recovery matrix was explicitly incomplete; the requirement remains pending in `REQUIREMENTS.md`. |
| VAL-03 | `06-01-PLAN.md`, `06-02-PLAN.md`, `06-03-PLAN.md` | Frontend tests and build remain passing | ? NEEDS HUMAN | Focused API (4/4) and threshold (1/1) suites passed; build passed; full Karma executed but retains pre-existing UI-01/UI-06 failures and an afterAll polling-spy error. |

No Phase 6 requirement is orphaned: all five IDs are declared in the plans and mapped in `REQUIREMENTS.md`.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| — | — | No Phase 6 debt markers (`TBD`, `FIXME`, `XXX`) or placeholder implementation found in modified files. | ℹ️ Info | No blocker. Existing `return null` branches in unrelated ManageComponent helpers are normal optional-value handling and do not feed the Phase 6 delivery stub. |

## Human Verification Required

1. **Complete recovery matrix:** Run empty selection, partial availability, failed preparation, network, 401/403, 404/409 expiry, reopen, reset, and same-job delivery retry. Confirm visible recovery and no duplicate preparation POST. The existing harness stopped after correctly finding the disabled empty-selection control.
2. **Karma release gate:** Resolve or explicitly accept the pre-existing UI-01/UI-06 failures and polling-spy afterAll error before treating the full frontend suite as a clean release gate. The suite now executes with the configured Chromium binary.
3. **Release acceptance:** Acknowledge the full-selection DC 334 result while preserving the fact that Creating ZIP and Finalizing ZIP were not observed and partial recovery is not approved.

## Gaps / Release Blockers

The implementation and full-selection delivery path are present and wired. Release completion is not fully verified because:

- The browser recovery matrix is partial. Later partial, network/authentication, expiry, retry, reset, and repeated-completion scenarios have no result artifact and must not be marked passed.
- The full Karma suite executes with the configured Chromium binary but is not green because of pre-existing UI-01/UI-06 failures and the polling-spy afterAll error. VAL-03 therefore remains human-needed despite the passing production build.
- The API/frontend progress-stage mismatch is closed by the 25/90 threshold implementation and passing focused boundary suite.

These are escalation-gate items for developer/release-owner decision, not fabricated failures of the source implementation.

---

_Verified: 2026-07-31T14:12:00Z_
_Verifier: the agent (gsd-verifier)_
