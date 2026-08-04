---
phase: 07-final-trailer-video-upload
verified: 2026-08-04T18:20:00Z
status: gaps_found
score: 1/5 must-haves verified
behavior_unverified: 3
overrides_applied: 0
gaps:
  - truth: "An existing episode can replace its finalized trailer video through the manage workflow while retaining the last-known-good file on failure or cancellation."
    status: failed
    reason: "ManageComponent routes every trailer-video selection through reserveEpisodeDraft(), but the API rejects reservations for persisted episode IDs. The edit/replacement path therefore fails before upload."
    artifacts:
      - path: "src/app/pages/manage/manage.component.ts:2091-2100"
        issue: "Both New Episode and episode-edit selections call reserveTrailerVideoDraft()."
      - path: "/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-draft-reservation.service.ts:16-22"
        issue: "reserveTrailerVideoDraft() rejects any ID with an existing episode row."
    missing:
      - "Use the persisted replacement upload path for existing episodes, or define a compatible server-issued replacement reservation contract."
  - truth: "Creating an episode without a trailer-video draft remains compatible with the existing episode workflow."
    status: failed
    reason: "POST /v1/episodes unconditionally calls checkTrailerVideoDraft() and rejects an absent draftId with 401. Angular only supplies draftId when a video was selected."
    artifacts:
      - path: "/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts:712-721"
        issue: "Create is blocked before episodeSchema.parse() when draftId is missing, even for an episode with no trailer video."
      - path: "src/app/pages/manage/manage.component.ts:676-683"
        issue: "createEpisode() passes undefined draftId for ordinary new-episode saves."
    missing:
      - "Make draft validation conditional on a trailer-video draft/staged upload, preserving ordinary episode creation."
---

# Phase 7: Final Trailer Video Upload — Verification Report

**Phase Goal:** Operators can finalize a local MP4 trailer through the existing `/v1/episodes/:episodeId/trailer-video` contract without losing the last-known-good video.

**Verified:** 2026-08-04

**Status:** gaps_found

**Re-verification:** No — initial verification.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | The New Episode File Management card accepts an MP4, displays its filename, and reports byte progress. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `episode-form.component.html` has `.mp4,video/mp4`, filename rendering, and progress/status bindings; `ManageComponent` computes `UploadProgress` percentages. Angular Karma could not run assertions because Karma failed to bind port 9876. |
| 2 | A server-issued reservation gates immediate staging, and Save promotes the staged bytes to canonical `episodes/{id}/trailer.mp4` without claiming draft finalization early. | ✓ VERIFIED | Sibling API build passed; `npm run verify:trailer-video-upload-lifecycle` passed reservation/auth, staged response, create promotion, canonical filename, validation, expiry cleanup, rollback, and no-YouTube checks. Angular source sends the draft header and create body; the API verifier proves the backend lifecycle. |
| 3 | Cancel/failure preserves the last-known-good trailer and exposes retry/recovery. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Frontend retains `File` and `priorFinalFileName`, unsubscribes, increments generation, and exposes retry. API verifier passed rollback/failure preservation. Browser assertions and a real MP4 flow were not executable; the persisted replacement path is separately blocked (Gap 1). |
| 4 | Retry or replacement works without stale responses corrupting the current trailer state. | ✗ FAILED | Generation guards and retained files exist, but existing-episode replacement cannot start: `uploadMedia()` always reserves a draft, while the API rejects reservations for persisted IDs. |
| 5 | Lifecycle states are distinct and no publish action is available before local finalization. | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Source contains selected/uploading/staged/promoting/finalized/canceled/failed labels and cancel/retry controls, and the trailer-video card contains no YouTube/publish controls. DOM/Jasmine execution was unavailable. |

**Score:** 1/5 truths verified (3 present, behavior-unverified; 1 failed; 1 additional compatibility blocker below).

## Requirement Coverage

| Requirement | Status | Evidence / finding |
|---|---|---|
| TRAILER-01 | PARTIAL | MP4 card, input hint, filename and drop/input wiring exist; browser-backed UI test could not execute. |
| TRAILER-02 | PASS for API / PARTIAL overall | Typed multipart wrapper uses `file`, `X-Episode-Draft-Id`, `observe: 'events'`, and `reportProgress`; sibling lifecycle verifier passed. Angular runtime assertions were unavailable. |
| TRAILER-03 | FAIL | New-episode staged/cancel/rollback code exists, but the required replacement workflow for an existing finalized trailer is blocked by the reservation mismatch. |
| TRAILER-04 | FAIL | Retry of a new draft retains the File, but selecting/replacing a persisted episode always attempts an invalid new-episode reservation. |
| TRAILER-05 | PARTIAL | State labels and no-publish surface are present in source; browser DOM assertions were not executed. |

## Required Artifacts

| Artifact | Status | Details |
|---|---|---|
| `src/app/core/api.service.ts` | ✓ VERIFIED | Typed reservation, draft-aware multipart upload, progress events, and create draft handoff. |
| `src/app/pages/manage/manage.component.ts` | ⚠️ PARTIAL | Substantive state machine, cancellation, retry, generation guards, teardown; persisted replacement wiring is incompatible with the API. |
| `src/app/pages/manage/episode-form.component.html` | ✓ PRESENT / UNVERIFIED | Dedicated sectioned card with MP4 hint, progress, status, cancel, retry; runtime DOM test unavailable. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` | ✗ FAILED integration | Draft staging and persisted replacement branches exist, but ordinary create is unconditionally draft-gated and frontend edit flow uses the wrong branch. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-draft-reservation.service.ts` | ✓ VERIFIED | Opaque owner-bound reservations, positive-ID checks, staged/consumed/expired state, bounded cleanup. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-trailer-video.service.ts` | ✓ VERIFIED | Server-derived staging validation, prepared rename, rollback copy, repository update, cleanup. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/scripts/verify-trailer-video-upload-lifecycle.ts` | ✓ VERIFIED | Executed independently and passed the documented backend lifecycle matrix. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| New Episode selection | API draft reservation | `reserveTrailerVideoDraft()` | ✓ WIRED | Positive form ID → `POST /episodes/drafts` → opaque draft ID. |
| Reservation | trailer upload | `X-Episode-Draft-Id` | ✓ WIRED | ApiService header and multipart `file` are implemented; API verifier passed. |
| Staged upload | Save/create promotion | `createEpisode(payload, draftId)` | ✓ WIRED for video create | Same draft ID is placed in create body; API verifier passed promotion. |
| Existing-episode selection | persisted replacement | `uploadMedia()` → reservation | ✗ NOT WIRED | Frontend reserves a draft for an existing row; API reservation rejects existing rows. |
| Cancel/reset/destroy | request teardown | unsubscribe + generation increment | ✓ PRESENT / UNVERIFIED | Source wiring exists; Karma assertion execution was unavailable. |

## Data-Flow Trace

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| Trailer video card | `editor.formModel.trailerVideoFileName` / retained `File` | File input/drop and terminal API response | API verifier proves staged/finalized data; browser path untested | PARTIAL |
| Save result | finalized trailer filename | API promotion and repository update | Yes; canonical `episodes/{id}/trailer.mp4` asserted by lifecycle verifier | FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Angular production compilation | `npm run build` | Exit 0; existing bundle/style budget and selector-parser warnings | PASS WITH WARNINGS |
| Angular Karma suites | `npm test -- --watch=false --browsers=ChromeHeadless` | Bundle generation completed, then Karma failed: `listen EPERM ... 0.0.0.0:9876`; no Jasmine assertions ran | UNAVAILABLE |
| Sibling API compilation | `npm run build` | Exit 0 with escalated write access | PASS |
| Sibling API local lifecycle | `npm run verify:trailer-video-upload-lifecycle` | Exit 0; reservation/auth/staging/create/rollback/expiry/no-YouTube message emitted | PASS |
| Sibling API artifact verifier | `npm run verify:trailer-video-artifact` | Exit 0; protected upload/replacement/canonical ZIP artifact verified | PASS |

## Probe Execution

No `scripts/**/tests/probe-*.sh` probes were found, and neither PLAN nor SUMMARY declares a Phase 7 probe path.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` | 717-721 | Unconditional draft reservation requirement on create | 🛑 BLOCKER | Ordinary new-episode saves without trailer video are rejected. |
| `src/app/pages/manage/manage.component.ts` | 2091-2100 | Existing-episode replacement routed through new-episode reservation | 🛑 BLOCKER | Required persisted replacement cannot begin. |
| `src/app/pages/manage/episode-form.component.html` | 158 | Existing YouTube link field | ℹ️ INFO | Existing unrelated episode metadata field; no Phase 7 publish control was added. |

No unreferenced `TBD`, `FIXME`, or `XXX` debt markers were found in the phase implementation files.

## Human Verification Required

1. **Browser MP4 lifecycle:** With API and Angular running, select a real MP4 in New Episode, confirm visible byte progress, cancel, retry, replace, Save, and verify the finalized canonical file while the prior final remains represented during failure/cancel.

2. **Angular focused/full tests:** Provide a permitted Karma port and ChromeHeadless binary, then rerun the focused service/component suites and the full non-watch suite. This is required before release sign-off because no Jasmine assertions executed here.

## Known Environment Limitations

- Angular `npm run build` passes, with pre-existing initial bundle and metrics stylesheet budget warnings plus selector-parser warnings.
- Angular Karma could compile bundles but could not bind port 9876 (`EPERM`); therefore browser tests are not evidence of passing assertions.
- The sibling API build/verifiers require writes outside the frontend workspace; they passed when run with approved escalation.

## Release Recommendation

**Do not release Phase 7 or proceed to the next phase yet.** The backend local draft lifecycle is strong and independently verified, but the frontend/backend replacement contract is broken for existing episodes, and ordinary no-video episode creation is blocked by the API create guard. Fix both blockers, rerun the sibling API lifecycle verifier plus Angular focused/full Karma suites, and complete the real-MP4 recovery check before release.

## Gaps Summary

The completed implementation proves the new-episode draft staging and API promotion path, but it does not prove the full stated operator workflow. Existing-episode replacement is observably unwired because the frontend always requests a draft that the API only permits for non-persisted IDs. Separately, the API’s unconditional create-time draft check regresses ordinary episode creation without a trailer video. Browser-backed Angular tests were also unavailable, so UI behavior remains human-verification debt.

---

_Verified: 2026-08-04T18:20:00Z_  
_Verifier: the agent (gsd-verifier)_
