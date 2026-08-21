# Roadmap: Dragao Careca Admin Web

## Overview

v1.2 extends the existing episode workflow from finalized local trailer video through a durable, server-owned YouTube upload, private-first readiness, explicit public publishing, approximate hashtag support, and artifact download. The Angular client remains a thin, authenticated orchestrator over the sibling API, and the existing sectioned operator layout and artifact job flow remain intact.

## Milestones

- ✅ **v1.0 Transcript Summary Integration** — Phases 1-3, shipped 2026-07-29
- ✅ **v1.1 Episode Artifact Downloads** — Phases 4-6, shipped 2026-07-31
- 🚧 **v1.2 Trailer Video YouTube Publishing** — Phases 7-11, implementation complete through Phase 9; final release/UAT closeout remains

## Phases

<details>
<summary>✅ v1.0 Transcript Summary Integration (Phases 1-3) — SHIPPED 2026-07-29</summary>

- [x] Phases 1-3: Transcript Summary Integration (6 plans) — completed 2026-07-29

</details>

<details>
<summary>✅ v1.1 Episode Artifact Downloads (Phases 4-6) — SHIPPED 2026-07-31</summary>

- [x] Phase 4: Artifact Job Contract (3 plans) — completed 2026-07-31
- [x] Phase 5: Episode Download Modal (4 plans) — completed 2026-07-31
- [x] Phase 6: Browser Download & Release Validation (4 plans) — completed 2026-07-31

**Release note:** Happy-path artifact download is accepted and automated gates pass. UI-08 recovery-matrix coverage and VAL-02 complete manual validation remain explicitly deferred.

</details>

### 📋 v1.2 Trailer Video YouTube Publishing (Planned)

**Milestone Goal:** Let operators safely upload a trailer video, start its private YouTube transfer immediately, populate the private link, and publish it with saved episode metadata while cleaning up replaced or deleted provider videos.

- [x] **Phase 7: Final Trailer Video Upload** - Select, upload, cancel, retry, and safely replace a final MP4 through the existing trailer-video API route. (implemented)
- [x] **Phase 8: YouTube Job Lifecycle** - Persist and execute resumable server-side YouTube uploads through private readiness with safe retry and cancellation boundaries. (implemented)
- [x] **Phase 9: Title & Hashtag Authoring** - Finalize the operator-facing trailer title and hashtag lookup/counting before the existing Phase 8 Save publication boundary. (verified 2026-08-14; amended 2026-08-20)
- [ ] **Phase 10: Operator Workflow Integration** - Connect the API contracts to the sectioned Angular workflow with thin orchestration and stale-state protection.
- [x] **Phase 11: Trailer Artifact & Compatibility Release** - Make only finalized trailer videos downloadable and preserve existing application behavior and release gates. (completed 2026-08-21; ChromeHeadless limitation recorded)

## Phase Details

### Phase 7: Final Trailer Video Upload

**Goal**: Operators can finalize a local MP4 trailer through the existing `/v1/episodes/:episodeId/trailer-video` contract without losing the last-known-good video.
**Depends on**: Phase 6
**Requirements**: TRAILER-01, TRAILER-02, TRAILER-03, TRAILER-04, TRAILER-05
**Success Criteria** (what must be TRUE):

  1. User can select an MP4 in New Episode File Management and see its filename and byte-level upload progress.
  2. User can cancel an upload or recover from failure while the previous finalized trailer remains available if replacement does not complete.
  3. User can retry the same selected video or choose a different replacement without confusing staged, uploading, canceled, failed, and finalized states.
  4. Publish controls are unavailable until the replacement has successfully become the finalized local trailer.

**Plans**: 3/3 plans executed

- [x] 07-01-PLAN.md
- [x] 07-02-PLAN.md
- [x] 07-03-PLAN.md

**UI hint**: yes

### Phase 8: YouTube Job Lifecycle

**Goal**: The API can upload a staged trailer from a hidden draft through a durable, resumable, server-owned job that reaches private readiness safely before Save.
**Depends on**: Phase 7
**Requirements**: YOUTUBE-01, YOUTUBE-02, YOUTUBE-03, YOUTUBE-04, YOUTUBE-05, OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):

  1. User can start one authenticated YouTube job after trailer staging, and its state remains available while the episode is still a hidden draft, after reload, or after API restart.
  2. User can distinguish YouTube transfer, YouTube processing, and private-ready states with progress that does not falsely imply publication.
  3. A recoverable retry resumes or reconciles an accepted provider upload without creating duplicate active jobs or duplicate provider videos.
  4. Replacing or deleting a trailer requests cleanup of its private provider video, while cancellation reports the accepted-work boundary honestly and stale jobs cannot update a newer trailer.
  5. Provider credentials, OAuth details, and unstable provider errors are never exposed in browser-visible job data, while quota, OAuth, timeout, and provider failures become bounded recoverable states.

**Plans**: 5/5 plans executed

- [x] 08-00-PLAN.md — Establish Wave 0 RED coverage for contract and lifecycle seams
- [x] 08-01-PLAN.md — Extend the durable API job contract and lifecycle
- [x] 08-02-PLAN.md — Verify backend lifecycle coverage and handoffs
- [x] 08-03-PLAN.md — Add Angular YouTube API wrappers and DTO tests
- [x] 08-04-PLAN.md — Integrate Manage lifecycle state, UI, and tests

### Phase 08.1: Episode Form Stability Patch: fix Add Episode defaults, audio metadata, validation, and read-only field presentation (INSERTED)

**Goal:** Make Add Episode defaults, episode-audio metadata, participant/music validation, and read-only field presentation reliable without changing trailer-audio behavior.
**Requirements**: FORM-01, FORM-02, FORM-03, FORM-04, FORM-05
**Depends on:** Phase 8
**Plans:** 6/6 plans complete

Plans:

- [x] 08.1-00-PLAN.md — Establish Wave 0 RED coverage for FORM-01 through FORM-05
- [x] 08.1-01-PLAN.md — Add API-owned episode-audio metadata and complete music-credit validation
- [x] 08.1-02-PLAN.md — Integrate Angular defaults, upload mapping, participant config, and form validation
- [x] 08.1-03-PLAN.md — Synchronize docs and run cross-repository verification gates

### Phase 9: Title & Hashtag Authoring

**Goal**: Operators can author and validate trailer hashtags, review the computed final YouTube trailer title, and rely on the existing Phase 8 Save publication boundary for the already private-ready video.
**Depends on**: Phase 8
**Requirements**: TITLE-01, TITLE-02, TITLE-03, TITLE-04
**Success Criteria** (what must be TRUE):

  1. User receives a read-only computed `Trailer - {episode name}` title preview containing selected hashtag values, with a shared 100-Unicode-character limit and clear validation that preserves authored episode-name and hashtag edits.
  2. User can request a normalized hashtag lookup and see an explicitly approximate public-result count with retrieval time, or a recoverable unavailable/error state.
  3. The authored title and hashtags are included in the existing Save/start/commit metadata contract without adding browser-side YouTube provider calls or a second publication flow.

**Phase 8 handoff**: Private transfer, private-ready link population, Save-time summary/title/hashtag commit, and idempotent public publication are already implemented by Phase 8. The remaining Phase 8 live checkpoint is validation of that Save-time publication sequence after the episode-save patch fixes; it is not new Phase 9 implementation scope.

**Plans**: 3/3 plans executed
Plans:

- [x] 09-01-PLAN.md — Correct API title/hashtag publication contract, validation, and one-hour lookup cache
- [x] 09-02-PLAN.md — Add Angular DTOs, summary suggestion merge, title validation, debounce, and payload orchestration
- [x] 09-03-PLAN.md — Wire the sectioned hashtag/title UI and accessible lookup feedback styling

**UI hint**: yes

### Phase 10: Operator Workflow Integration

**Goal**: The Angular manage workflow exposes the v1.2 lifecycle through the existing `ApiService`, sectioned layout, auth boundary, and operator-facing recovery states.
**Depends on**: Phase 9
**Requirements**: OPS-05
**Success Criteria** (what must be TRUE):

  1. User can complete local upload, YouTube status polling, title-preview review, hashtag lookup, link review, and Save-time publication from the existing New Episode workflow without browser-side YouTube OAuth or provider calls.
  2. Closing or reloading the page does not create duplicate jobs, and late responses for an older trailer cannot overwrite the current episode's title, link, or status.
  3. Existing authentication and `authBypass` modes continue to protect or enable the workflow appropriately, while episode editing and generated-summary behavior remain usable.
  4. The sectioned, legacy-inspired layout presents separate local and YouTube stages, actionable errors, cancellation boundaries, and replacement warnings instead of a misleading single progress state.

**Plans**: 3/3 plans executed

- [x] 10-01-PLAN.md
- [x] 10-02-PLAN.md
- [x] 10-03-PLAN.md

**UI hint**: yes

### Phase 11: Trailer Artifact & Compatibility Release

**Goal**: Episodes downloads include the finalized local trailer video through the existing artifact job and ZIP flow without exposing staged or stale media.
**Depends on**: Phase 10
**Requirements**: ARTIFACT-01, ARTIFACT-02
**Success Criteria** (what must be TRUE):

  1. User can select the existing `trailer-video` artifact in the Episodes download modal when a finalized trailer is available.
  2. A completed ZIP contains the canonical `trailer.mp4` entry sourced from the finalized local file, while unavailable, staged, failed, or stale replacements are excluded.
  3. Existing artifact progress, authenticated native download, retry/reset behavior, frontend tests, and `npm run build` remain green after the integration.

**Plans**: 2/2 plans executed

- [x] 11-01-PLAN.md — Wire finalized trailer-video into the existing artifact catalog and request flow
- [x] 11-02-PLAN.md — Verify trailer ZIP compatibility and preserve existing artifact gates

**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 7 → 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|---|---|---:|---|---|
| 1-3 | v1.0 Transcript Summary Integration | 6/6 | Complete | 2026-07-29 |
| 4 | v1.1 Episode Artifact Downloads | 3/3 | Complete | 2026-07-31 |
| 5 | v1.1 Episode Artifact Downloads | 4/4 | Complete | 2026-07-31 |
| 6 | v1.1 Episode Artifact Downloads | 4/4 | Complete | 2026-07-31 |
| 7. Final Trailer Video Upload | v1.2 | 3/3 | Complete |  |
| 8. YouTube Job Lifecycle | v1.2 | 5/5 | Complete |  |
| 9. Title, Hashtags & Publishing | v1.2 | 3/3 | Complete | 2026-08-14 |
| 10. Operator Workflow Integration | v1.2 | 3/3 | Complete | 2026-08-20 |
| 11. Trailer Artifact & Compatibility Release | v1.2 | 2/2 | Complete | 2026-08-21 |
