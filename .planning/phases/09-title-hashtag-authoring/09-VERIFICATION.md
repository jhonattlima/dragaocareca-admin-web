---
phase: 09-title-hashtag-authoring
verified: 2026-08-14T14:02:00Z
status: human_needed
score: 0/4 must-haves verified
behavior_unverified: 4
overrides_applied: 0
behavior_unverified_items:
  - truth: "TITLE-01 read-only computed title and additive suggestedTags authoring work in the rendered Angular form"
    test: "Open New Episode, edit the episode name and hashtags, then allow suggestedTags to arrive."
    expected: "The read-only Trailer title preview recomputes, manual hashtags remain, generated values append up to three, and the title never becomes editable."
    why_human: "Karma bound successfully on an elevated retry, but no ChromeHeadless binary is installed; the production build only proves template/type compilation."
  - truth: "TITLE-02 the assembled title uses the shared 100-Unicode-character validation and blocks Save/start without mutating authored values"
    test: "Use a title/hashtag combination at 100 Unicode code points and another at 101, including an astral character."
    expected: "100 is accepted; 101 shows the visible validation error and blocks Save/start while preserving the authored episode name and hashtags."
    why_human: "The code and focused test cases exist, but ChromeHeadless is unavailable, so no browser assertions executed."
  - truth: "TITLE-03 approximate lookup feedback appears on debounced input and token hover/focus and dismisses correctly"
    test: "Type a hashtag, wait about one second, then hover/focus a token, tab away, and click outside."
    expected: "Approximate count and retrieval time appear; unavailable results are non-blocking; blur/tab/input/outside click dismisses transient feedback."
    why_human: "Hover/focus/blur/outside-click behavior requires a browser interaction check, and ChromeHeadless could not launch."
  - truth: "TITLE-04 normalized lookup/cache and authored metadata preserve the existing Save/start/commit/publication flow"
    test: "Complete the existing New Episode flow with authored hashtags, observe private start, Save, and publication commit, and repeat a normalized lookup."
    expected: "The same authored title/hashtag values reach start and Save-time commit/publication; no browser provider call or second publication flow appears; repeated lookup is a one-hour cache hit."
    why_human: "The API contract and offline verifier pass, but end-to-end Angular orchestration and visual lifecycle preservation were not executable without a Chrome browser."
human_verification:
  - test: "Run the focused Angular suites in an environment where ChromeHeadless/Karma can bind port 9876, then complete the rendered title/hashtag interaction checks above."
    expected: "All Phase 09 focused Jasmine assertions pass and the UI behaviors in the four behavior-unverified items are observable."
    why_human: "The elevated retry allowed Karma to bind 9876, but ChromeHeadless is not installed; visual placement and hover/focus dismissal cannot be established from a production build."
---

# Phase 09: Title & Hashtag Authoring Verification Report

**Phase Goal:** Operators can author and validate trailer hashtags, review the computed final YouTube trailer title, and rely on the existing Phase 8 Save publication boundary for the already private-ready video.

**Verified:** 2026-08-14T14:02:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Requirement Results

| Requirement | Result | Exact evidence |
| --- | --- | --- |
| TITLE-01 | PARTIAL | Frontend source has separate `EpisodeFormState.hashtags` and `getTrailerTitle()`/read-only input in `src/app/pages/manage/manage.component.ts:105-126,1433-1445` and `src/app/pages/manage/episode-form.component.html:211-263`; summary polling calls `mergeSuggestedTags()` at `manage.component.ts:2247-2269`, which deduplicates/caps suggestions at `:2292-2323`. `npm run build` and `tsc -p tsconfig.spec.json --noEmit` pass, but the focused Karma run was blocked before assertions by `listen EPERM` on `0.0.0.0:9876`. |
| TITLE-02 | PARTIAL | Angular counts code points with `[...this.getTrailerTitle(editor)].length` and blocks Save/start through `getTrailerTitleValidationError()` at `manage.component.ts:696-705,1028-1041,1433-1450`; the template renders readonly/count/error at `episode-form.component.html:249-263`. The sibling API validator rejects forbidden characters, duplicate/invalid hashtags, and assembled titles over 100 code points at `../dragaocareca-admin-api/src/services/youtube-trailer-publication.service.ts:31-40`, and its lifecycle verifier asserts 100/101 boundaries at `src/scripts/verify-episode-hashtag-authoring.ts:214-218`. Frontend runtime assertions remain unexecuted because Karma failed to bind. |
| TITLE-03 | PARTIAL | API route `POST /:episodeId/hashtag-lookup` returns normalized tag, approximate count, retrieval time, cache status, safe state/error, and retry metadata at `../dragaocareca-admin-api/src/routes/episodes.routes.ts:658-695`; Angular calls the typed wrapper at `src/app/core/api.service.ts:464-469` and schedules input/hover/focus lookup after 1000 ms with stale-token cancellation at `manage.component.ts:1453-1533`. Template feedback is available on token hover/focus and displays approximate/retrieved-at or non-blocking unavailable text at `episode-form.component.html:217-243`. Browser interaction and Jasmine assertions were not run due Karma EPERM. |
| TITLE-04 | PARTIAL | API defaults successful and zero-result cache TTLs to `60 * 60 * 1000` at `../dragaocareca-admin-api/src/config/env.ts:98-108`, with the same documented `3600000` values in `.env.example:66-68`; the independent lookup verifier asserts hit/expiry at `verify-episode-hashtag-authoring.ts:88-117,154-160`. Angular sends the authored hashtags and title prefix to start at `manage.component.ts:792-809` and to Save-time commit at `:1073-1080`; API commit persists the exact metadata snapshot and invokes the existing publication boundary at `../dragaocareca-admin-api/src/routes/episodes.routes.ts:751-782`. No browser YouTube/provider call is present in the Phase 09 frontend files. End-to-end frontend behavior remains unproven. |

**Score:** 0/4 requirements fully verified; 4 present-and-wired but runtime/browser behavior unverified.

## Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/app/core/api.service.ts` | Typed `SuggestedTagsSnapshot`, `HashtagLookupResponse`, lookup wrapper, start/commit metadata bodies | VERIFIED | DTOs at lines 186-235; lookup at 464-469; start/commit at 479-490. |
| `src/app/pages/manage/manage.component.ts` | Separate hashtag state, additive merge, title validation, debounce/stale guards, lifecycle payloads | VERIFIED (behavior unverified) | Substantive implementation at lines 105-126, 696-705, 792-809, 1028-1080, 1412-1555, 2236-2323. |
| `src/app/pages/manage/episode-form.component.html` | Sectioned editable hashtag field, read-only title/count/error, lookup feedback | VERIFIED (behavior unverified) | Hashtag/Spotify row and title block at lines 201-263. |
| `src/app/pages/manage/episode-form.component.scss` | Disabled, focus, token popup, validation, responsive presentation | VERIFIED (behavior unverified) | Rules at lines 39-105 and responsive popup at 107-112. |
| `../dragaocareca-admin-api/src/routes/episodes.routes.ts` | Canonical start/commit and safe lookup route contract | VERIFIED | Strict schemas at lines 87-110; lookup at 658-695; commit/start at 751-782 and 870-916. |
| `../dragaocareca-admin-api/src/services/youtube-trailer-publication.service.ts` | Shared assembled-title validator and publication boundary | VERIFIED | `assembleYoutubeTrailerTitle` at lines 31-40; publication metadata application at lines 98-129. |
| `../dragaocareca-admin-api/src/scripts/verify-episode-hashtag-authoring.ts` | Independent lifecycle/cache/route/OpenAPI checks | VERIFIED | Directly executed successfully in lifecycle, lookup, and full modes. |

## Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| Summary poll | Hashtag authoring field | `status.suggestedTags` → `mergeSuggestedTags()` → `formModel.hashtags` | WIRED | `manage.component.ts:2247-2269,2292-2323`; additive, deduplicated, capped at three. |
| Hashtag input/hover/focus | API lookup | `onHashtag*` → 1000 ms timer → `ApiService.lookupHashtag()` | WIRED | `manage.component.ts:1453-1533`; token and dismissal guards are present. |
| Hashtag field | Read-only title | `getTrailerTitle()` / `serializeHashtags()` | WIRED | `manage.component.ts:1412-1445`; template binds readonly value at `episode-form.component.html:251-257`. |
| Hashtag/title state | YouTube start | `startYoutubeTrailerJob()` | WIRED | `manage.component.ts:806-809` sends title prefix and canonical hashtag array. |
| Episode Save | YouTube commit/publication | `saveEpisode()` → `commitYoutubeTrailerJob()` | WIRED | `manage.component.ts:1073-1080`; API stores request metadata at `episodes.routes.ts:770-782`. |
| API metadata snapshot | Worker/publication | `metadata_snapshot_json` → `metadataForJob()` → `publishYoutubeTrailer()` | WIRED | `youtube-trailer-job.service.ts:107-117,268-274`; repository persistence is independently exercised by the API verifier. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
| --- | --- | --- | --- | --- |
| Hashtag field/title preview | `formModel.hashtags`, episode title | Operator input plus summary endpoint `suggestedTags` | Yes in source flow | FLOWING, runtime unverified |
| Lookup popup | `HashtagLookupResponse` | Authenticated API lookup route/provider or durable cache | Yes; safe DTO only | FLOWING, browser unverified |
| Publication metadata | `{title, summary, hashtags}` | Angular start/commit body → API metadata snapshot → worker/publication | Yes; API verifier confirms persisted authored values and retry/idempotence | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Frontend production compilation | `npm run build` | Exit 0; existing selector-parser, metrics stylesheet budget, and initial bundle budget warnings | PASS |
| Frontend spec compilation | `./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit` | Exit 0 | PASS |
| Focused Angular Jasmine suites | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts' --include='src/app/pages/manage/manage.component.spec.ts'` (elevated retry) | Karma bound `http://localhost:9876/`, then exited 1: `No binary for ChromeHeadless browser`; no assertions executed | SKIPPED — ChromeHeadless unavailable |
| API lifecycle verifier | `npm run verify:episode-hashtag-authoring -- --focus=lifecycle` in sibling API | Exit 0; lifecycle/reload/retry/stale/summary checks reported verified | PASS |
| API lookup/cache verifier | `npm run verify:episode-hashtag-authoring -- --focus=lookup` in sibling API | Exit 0; normalized lookup, one-hour hit/expiry, quota, serial lane, safe errors reported verified | PASS |
| Full API Phase 09 verifier | `npm run verify:episode-hashtag-authoring` in sibling API | Exit 0; `offline hashtag-authoring all verified` | PASS |

The lifecycle API run also emitted an `ENOENT` rename warning from the asynchronous hashtag authoring worker while processing episode 1805, but the verifier completed with exit 0 and reported its lifecycle checks verified. This is recorded for follow-up observation, not promoted to a blocker because the independent assertions passed.

## Probe Execution

| Probe | Command | Result | Status |
| --- | --- | --- | --- |
| Phase 09 API verifier | `npm run verify:episode-hashtag-authoring` | Exit 0 | PASS |

No frontend shell probe was declared. The required frontend test command is recorded above with its exact Karma limitation.

## Requirements Coverage

| Requirement | Source plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| TITLE-01 | 09-01, 09-02, 09-03 | Read-only computed title, selected hashtags, additive suggestions | PARTIAL | Source wiring/build pass; runtime Jasmine/browser behavior unverified. |
| TITLE-02 | 09-01, 09-02, 09-03 | 100 Unicode title validation without overwriting authored values | PARTIAL | API boundary and verifier pass; frontend source/test exists but Karma could not run. |
| TITLE-03 | 09-01, 09-02, 09-03 | Approximate count/retrieval time and recoverable lookup state | PARTIAL | API lookup verifier pass; rendered hover/focus/blur behavior unverified. |
| TITLE-04 | 09-01, 09-02, 09-03 | Normalized debounce/cache/rate-limit/recovery and existing publication flow | PARTIAL | API full verifier and source wiring pass; frontend end-to-end/browser behavior unverified. |

No Phase 09 requirements are orphaned in `.planning/REQUIREMENTS.md`; TITLE-01 through TITLE-04 all map to this phase and are claimed by all three plans.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| Phase 09 application files | — | No unreferenced `TBD`, `FIXME`, or `XXX` markers found; no placeholder implementation found | INFO | No blocker. Existing `placeholder=` HTML attributes are input hints, not stubs. |
| Sibling API verifier run | — | One `ENOENT` worker rename warning during lifecycle execution | WARNING | Verifier still exited 0 and all assertions passed; observe in a future run. |

## Human Verification Required

1. Run the focused Angular suites in an environment with a ChromeHeadless binary; Karma can bind `0.0.0.0:9876` when elevated, but this environment has no Chrome installation.
2. In the rendered New Episode form, verify the separate hashtag field sits beside Spotify ID, disables only during automatic suggestion work, preserves manual text, and allows post-completion edits.
3. Verify the read-only title preview, 100-code-point boundary (including emoji), visible error, and Save/start blocking in the actual UI.
4. Verify one-second input debounce, token hover/focus feedback, retrieval time, unavailable-state messaging, and dismissal on blur/tab/input/outside click.
5. Complete Save/start/commit against the existing private-ready lifecycle and confirm the authored `{title, hashtags}` reaches publication without browser-side YouTube calls or a second publication flow.

## Gaps Summary

No code-level blocker was found. The sibling API contract and independent verifier are green, and frontend source is substantive, wired, type-checking, and production-buildable. The phase cannot receive a fully automated PASS because ChromeHeadless is not installed, and the visual/interaction checks were not otherwise executable. The next action is browser verification, not application-source modification.

---

_Verified: 2026-08-14T14:02:00Z_
_Verifier: the agent (gsd-verifier)_
