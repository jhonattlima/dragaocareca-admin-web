---
phase: 05-episode-download-modal
verified: 2026-07-31T03:26:06Z
status: human_needed
score: 6/10 must-haves verified
behavior_unverified: 4
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 6/10
  gaps_closed:
    - "Rapid duplicate artifact-job confirmation is now guarded before the first start Observable emits."
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "Every persisted episode row opens the accessible artifact picker and restores focus correctly."
    test: "Open the Episodes tab, activate a row Downloads button by keyboard, then close with Escape."
    expected: "The labelled dialog opens, focus stays within the dialog, and focus returns to the originating Downloads button."
    why_human: "The focused Karma test is present and compiles, but cannot run without a ChromeHeadless binary; source and build checks cannot prove browser focus behavior."
  - truth: "Confirmation displays asynchronous progress, polls until terminal state, and cleans up polling."
    test: "Start a job and exercise pending/processing updates through completed and failed responses, including a temporary polling error."
    expected: "The modal maps stage/progress, retries polling without another start, and stops polling at terminal state or destroy."
    why_human: "The implementation and focused assertions exist, but no browser test execution was possible in this environment."
  - truth: "Duplicate starts are prevented before the first start response arrives."
    test: "Use the UI-06 deferred Subject test or click Prepare archive twice before the first start response emits."
    expected: "Exactly one start API call is issued; the guard releases on success/error and active pending/processing state remains protected."
    why_human: "The Symbol-token guard and asynchronous regression are present and the test bundle compiles, but ChromeHeadless is unavailable, so the named behavioral test has not passed here."
  - truth: "Failure, partial-result, all-unavailable, retry, and close/reopen state boundaries are recoverable."
    test: "Exercise failed and partial snapshots, close/reopen during processing, then retry after failure and all-unavailable responses."
    expected: "Warnings and selections remain recoverable, reopening resumes the same job, and retry appears only after terminal failure."
    why_human: "These transitions require browser/Observable execution; the available focused runner stops before launching a browser."
human_verification:
  - test: "Run the focused ManageComponent and ApiService Karma suites in an environment with Chrome/Chromium configured via CHROME_BIN, then perform the keyboard and async recovery checks above."
    expected: "The focused suites pass, UI-01 through UI-06 execute successfully, focus behavior works, rapid confirmation produces one start request, and polling/retry boundaries behave as specified."
    why_human: "Karma compiled both focused suites and started successfully, but reported `No binary for ChromeHeadless browser on your platform`; this runtime limitation cannot be resolved by source inspection."
---

# Phase 5: Episode Download Modal Verification Report

**Phase Goal:** Operators can open an episode’s artifact picker, choose the files they need, and start one asynchronous download without disrupting episode management.
**Verified:** 2026-07-31T03:26:06Z
**Status:** human_needed
**Re-verification:** Yes — after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Every persisted episode row exposes an accessible artifact-download action that opens a modal for that episode. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `manage.component.html:32-65,118-186` has one native Downloads button per `pagedEpisodes` row and a labelled `role="dialog"`; `manage.component.spec.ts:231-247` exercises the DOM/focus path but cannot execute without ChromeHeadless. |
| 2 | The modal presents episode file, trailer, cover art, low cover art (`.webp`), and transcript choices using the established canonical selector vocabulary. | ✓ VERIFIED | `manage.component.ts:166-171` defines the fixed five-item order and `api.service.ts:189-205` defines the closed selector union; the template renders `artifactOptions`. |
| 3 | Available choices start checked, while unavailable choices are clearly disabled or omitted and cannot be submitted accidentally. | ✓ VERIFIED | `manage.component.ts:1561-1572` trims row filenames, derives availability, checks only available items, and sets the unavailable tooltip; template disables unavailable checkboxes. |
| 4 | The operator can select or deselect choices, and confirming with no selections produces a clear validation message without starting a job. | ✓ VERIFIED | `manage.component.ts:423-447` restricts toggles to available options and rejects an empty canonical selector list; `manage.component.spec.ts:268-281` asserts no API call and exact selected selectors. |
| 5 | Once confirmed, the modal shows asynchronous job progress and prevents duplicate submissions while retaining clear cancel/retry boundaries. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Progress/stage mapping, polling, terminal cleanup, partial/failure UI, and retry exist in `manage.component.ts:375-403,476-484,1576-1636` and are wired in the template; runtime transition tests remain unexecuted. |
| 6 | The in-flight start guard prevents a second confirmation before the first start Observable emits, while success/error release the guard and active jobs remain protected. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `manage.component.ts:437-465` sets an episode-scoped `Symbol` token before `startEpisodeArtifactJob()` and clears only the matching token in `next`/`error`; `manage.component.spec.ts:283-304` uses a deferred `Subject` and asserts one call. The test compiles but could not run. |
| 7 | Close/reopen, partial, failure, all-unavailable, and retry boundaries are recoverable. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `openArtifactModal`, `storeArtifactJob`, `retryArtifactJob`, and polling error handling retain per-episode state and recoverable messages; browser execution is unavailable. |
| 8 | Artifact state is isolated from Add episode and no Phase 6 native delivery was introduced. | ✓ VERIFIED | Dedicated artifact fields/timers are separate from editor/upload/transcription/summary state; scan found no `Blob`, `URL.createObjectURL`, `file-saver`, `saveAs`, or download invocation. `downloadUrl` is rendered only as text. |
| 9 | The Angular source builds successfully and focused UI/API coverage compiles. | ✓ VERIFIED | `npm run build` exited 0; both focused `npm test` commands generated browser bundles before Karma failed at browser launch. |
| 10 | The corrected gap-closure artifacts are substantive and wired into the existing authenticated Angular boundary. | ✓ VERIFIED | `05-04` artifact query passed 2/2; Manage calls ApiService start/status methods, and `AuthInterceptor` applies the bearer header to the shared HttpClient path. |

**Score:** 6/10 truths verified (4 present, behavior-unverified)

The previous blocking implementation gap is closed. The remaining human-needed status is solely due to unavailable browser execution for behavior-dependent truths.

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `src/app/core/api.service.ts` | Typed selector/snapshot and start/status methods | ✓ VERIFIED | Closed five-selector union, typed snapshot, exact POST/GET routes; substantive and consumed by ManageComponent. |
| `src/app/core/api.service.spec.ts` | HTTP contract tests | ✓ VERIFIED | Tests assert canonical payload ordering, exact routes, and opaque completed URL handling; bundle compilation succeeded. |
| `src/app/pages/manage/manage.component.ts` | Availability, selection, guard, orchestration, polling, retry, focus state | ✓ VERIFIED (behavior pending) | Substantive and template-wired; corrected guard is before the API call with token-matched success/error release. Runtime transitions need the browser check above. |
| `src/app/pages/manage/manage.component.html` | Episodes Downloads action and modal UI | ✓ VERIFIED (behavior pending) | Row action, ARIA dialog, five checkboxes, validation/progress/partial/failure/ready states, and action bindings are present. |
| `src/styles.scss` | Modal, focus, responsive, and progress styling | ✓ VERIFIED | Artifact-specific styles and visible focus rules are present in the loaded global stylesheet. |
| `src/app/pages/manage/manage.component.spec.ts` | UI-01–UI-06 focused coverage | ✓ VERIFIED (behavior pending) | Tests are substantive, including the deferred duplicate-start regression; Karma execution is blocked by missing ChromeHeadless. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| Manage template | ManageComponent | row click, checkbox change, confirm/close/retry, modal keydown | WIRED | Bindings resolve to public component methods at `manage.component.html:63,133,172-173`. |
| ManageComponent | ApiService | `startEpisodeArtifactJob` and `getEpisodeArtifactJobStatus` | WIRED | Calls at `manage.component.ts:454` and `1604`; service uses `environment.apiBaseUrl`. |
| ManageComponent | Episode row fields | `buildArtifactOptions()` | WIRED | `manage.component.ts:1561-1572` reads all five filename fields through fixed definitions. |
| ApiService | Auth boundary | injected Angular `HttpClient` and `AuthInterceptor` | WIRED | `auth.interceptor.ts:10-22` adds `Authorization: Bearer` on the shared request path. |
| Manage template | global styles | artifact CSS classes | WIRED | Modal, option, focus, progress, warning, ready, and responsive classes are defined in `src/styles.scss:174-637`. |

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| Episodes table / artifact modal | `episodes`, `artifactModalEpisode`, `artifactOptions` | `ApiService.listEpisodes()` populates rows; row fields populate options | Yes, API-backed | ✓ FLOWING |
| Modal job status | `artifactJob` / `artifactJobs` | start response and status polling snapshots | Yes, API-backed | ✓ FLOWING; transitions unverified at runtime |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Angular production build | `npm run build` | Exit 0; only existing initial-bundle and metrics-style budget warnings plus existing selector-parser warnings | ✓ PASS |
| Manage focused suite | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` | Browser bundle generated; Karma started on `http://localhost:9876/`; launch failed with `No binary for ChromeHeadless browser on your platform` | ? SKIP — environment |
| ApiService focused suite | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | Browser bundle generated; Karma started; launch failed with `No binary for ChromeHeadless browser on your platform` | ? SKIP — environment |
| UI-06 deferred duplicate test | `manage.component.spec.ts:283-304` | `Subject` keeps the first start unresolved, second confirmation is issued, and assertion expects exactly one call; test bundle compiles but does not execute | ? SKIP — environment |

The initial unprivileged test attempts also hit sandbox `EPERM` when binding port 9876; escalated reruns reached Karma and established the definitive missing-browser limitation.

## Probe Execution

No phase-declared or conventional `scripts/*/tests/probe-*.sh` probes were found.

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| UI-01 | 05-03 | Download action on each episode row | NEEDS HUMAN | Native row button and DOM test exist; browser interaction was not executable. |
| UI-02 | 05-02/05-03 | Open modal for selected episode | NEEDS HUMAN | Modal and ARIA/focus wiring exist; focused browser test is environment-blocked. |
| UI-03 | 05-01/05-02/05-03 | Five artifact options/canonical selectors | SATISFIED (implementation) | Closed union, fixed definitions, ordered template, and API contract tests are present. |
| UI-04 | 05-02/05-03 | Default available and disable unavailable | SATISFIED (implementation) | Trimmed filename mapping, checked available options, disabled unavailable options, and focused assertions are present. |
| UI-05 | 05-02/05-03 | Select/deselect before confirmation | SATISFIED (implementation) | Native checkbox bindings, canonical selector filtering, and empty-selection guard/test are present. |
| UI-06 | 05-01/05-02/05-03/05-04 | Progress and duplicate prevention | NEEDS HUMAN | In-flight token guard and deferred regression are present and compile; focused runtime execution requires ChromeHeadless. |

UI-07/UI-08 and VAL-01/02/03 remain explicitly assigned to Phase 6. No Phase 5 requirement is orphaned.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| — | — | No unreferenced `TBD`, `FIXME`, or `XXX` markers; no feature stubs or console-only handlers found. | Info | No anti-pattern blocker. Existing `return null` helpers in `manage.component.ts` are unrelated null-producing lookup/validation paths and are not user-visible stubs. |

## Human Verification Required

1. **Browser execution and keyboard modal flow**
   - **Test:** Configure Chrome/Chromium (`CHROME_BIN`) and run both focused suites; then use keyboard-only navigation on an Episodes-row Downloads button, Tab/Shift+Tab, Escape, and close.
   - **Expected:** Focus enters and remains in the labelled dialog, Escape closes it, focus returns to the invoker, and UI-01/UI-02 assertions pass.
   - **Why human:** Karma cannot launch without a browser binary, and focus containment is runtime behavior.

2. **Async duplicate and recovery lifecycle**
   - **Test:** Run the deferred UI-06 test and exercise pending, processing, temporary polling error, completed partial, failed, all-unavailable, close/reopen, and retry states.
   - **Expected:** Rapid confirmations issue exactly one start request; the guard releases on success/error; active jobs retain one poller; terminal/retry boundaries remain recoverable.
   - **Why human:** Source inspection proves the guard placement and test compilation, but not the executed Observable/timer transitions.

## Gaps Summary

No implementation gaps remain from the previous verification. The Phase 5 duplicate-start defect is closed by an episode-scoped `Symbol` token map set before the start API call, with stale-callback protection in both success and error handlers. The new `Subject`-based test specifically keeps the first request unresolved and asserts one start call, so it would fail against the prior implementation.

The final gate is human/browser verification: both focused suites compile and Karma starts, but this environment has no ChromeHeadless binary. Until those tests and the keyboard/async recovery checks run in a browser-capable environment, the phase remains `human_needed`, not `passed`.

---

_Verified: 2026-07-31T03:26:06Z_  
_Verifier: the agent (gsd-verifier)_
