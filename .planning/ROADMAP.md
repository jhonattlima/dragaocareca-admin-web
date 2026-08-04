# Roadmap: Dragao Careca Admin Web

## Overview

v1.2 extends the existing episode workflow from finalized local trailer video through a durable, server-owned YouTube upload, private-first readiness, explicit public publishing, approximate hashtag support, and artifact download. The Angular client remains a thin, authenticated orchestrator over the sibling API, and the existing sectioned operator layout and artifact job flow remain intact.

## Milestones

- ✅ **v1.0 Transcript Summary Integration** — Phases 1-3, shipped 2026-07-29
- ✅ **v1.1 Episode Artifact Downloads** — Phases 4-6, shipped 2026-07-31
- 📋 **v1.2 Trailer Video YouTube Publishing** — Phases 7-11, planned

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

**Milestone Goal:** Let operators safely upload a final trailer video, stage it privately on YouTube, review and publish it explicitly, and download the finalized local video from Episodes.

- [ ] **Phase 7: Final Trailer Video Upload** - Select, upload, cancel, retry, and safely replace a final MP4 through the existing trailer-video API route.
- [ ] **Phase 8: YouTube Job Lifecycle** - Persist and execute resumable server-side YouTube uploads through private readiness with safe retry and cancellation boundaries.
- [ ] **Phase 9: Title, Hashtags & Publishing** - Validate editable titles, provide approximate hashtag counts, and expose an explicit public-publish boundary.
- [ ] **Phase 10: Operator Workflow Integration** - Connect the API contracts to the sectioned Angular workflow with thin orchestration and stale-state protection.
- [ ] **Phase 11: Trailer Artifact & Compatibility Release** - Make only finalized trailer videos downloadable and preserve existing application behavior and release gates.

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
**Plans**: TBD
**UI hint**: yes

### Phase 8: YouTube Job Lifecycle
**Goal**: The API can upload the current finalized trailer to YouTube through a durable, resumable, server-owned job that reaches private readiness safely.
**Depends on**: Phase 7
**Requirements**: YOUTUBE-01, YOUTUBE-02, YOUTUBE-03, YOUTUBE-04, YOUTUBE-05, OPS-01, OPS-02, OPS-03, OPS-04
**Success Criteria** (what must be TRUE):
  1. User can start one authenticated YouTube job for the current finalized trailer, and its state remains available after polling, reload, or API restart.
  2. User can distinguish YouTube transfer, YouTube processing, and private-ready states with progress that does not falsely imply publication.
  3. A recoverable retry resumes or reconciles an accepted provider upload without creating duplicate active jobs or duplicate provider videos.
  4. A cancellation reports the accepted-work boundary honestly, including when a private provider video remains for reconciliation, and stale jobs cannot update a newer trailer.
  5. Provider credentials, OAuth details, and unstable provider errors are never exposed in browser-visible job data, while quota, OAuth, timeout, and provider failures become bounded recoverable states.
**Plans**: TBD

### Phase 9: Title, Hashtags & Publishing
**Goal**: Operators can prepare safe YouTube metadata, review the private result, and deliberately publish the ready video.
**Depends on**: Phase 8
**Requirements**: YOUTUBE-06, YOUTUBE-07, TITLE-01, TITLE-02, TITLE-03, TITLE-04
**Success Criteria** (what must be TRUE):
  1. User receives an editable `Trailer - {episode name}` title suggestion containing selected hashtag values, with a shared 100-Unicode-character limit and clear forbidden-character validation that preserves edits.
  2. User can request a normalized hashtag lookup and see an explicitly approximate public-result count with retrieval time, or a recoverable unavailable/error state.
  3. Once YouTube processing is ready, the existing YouTube link field shows the returned private watch link and remains usable after publication.
  4. User must confirm a separate Publish action before the API changes the video from non-public to public, and repeated publish requests are safely idempotent.
**Plans**: TBD
**UI hint**: yes

### Phase 10: Operator Workflow Integration
**Goal**: The Angular manage workflow exposes the v1.2 lifecycle through the existing `ApiService`, sectioned layout, auth boundary, and operator-facing recovery states.
**Depends on**: Phase 9
**Requirements**: OPS-05
**Success Criteria** (what must be TRUE):
  1. User can complete local upload, YouTube status polling, title editing, hashtag lookup, link review, and explicit publish from the existing New Episode workflow without browser-side YouTube OAuth or provider calls.
  2. Closing or reloading the page does not create duplicate jobs, and late responses for an older trailer cannot overwrite the current episode's title, link, or status.
  3. Existing authentication and `authBypass` modes continue to protect or enable the workflow appropriately, while episode editing and generated-summary behavior remain usable.
  4. The sectioned, legacy-inspired layout presents separate local and YouTube stages, actionable errors, cancellation boundaries, and replacement warnings instead of a misleading single progress state.
**Plans**: TBD
**UI hint**: yes

### Phase 11: Trailer Artifact & Compatibility Release
**Goal**: Episodes downloads include the finalized local trailer video through the existing artifact job and ZIP flow without exposing staged or stale media.
**Depends on**: Phase 10
**Requirements**: ARTIFACT-01, ARTIFACT-02
**Success Criteria** (what must be TRUE):
  1. User can select the existing `trailer-video` artifact in the Episodes download modal when a finalized trailer is available.
  2. A completed ZIP contains the canonical `trailer.mp4` entry sourced from the finalized local file, while unavailable, staged, failed, or stale replacements are excluded.
  3. Existing artifact progress, authenticated native download, retry/reset behavior, frontend tests, and `npm run build` remain green after the integration.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 7 → 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|---|---|---:|---|---|
| 1-3 | v1.0 Transcript Summary Integration | 6/6 | Complete | 2026-07-29 |
| 4 | v1.1 Episode Artifact Downloads | 3/3 | Complete | 2026-07-31 |
| 5 | v1.1 Episode Artifact Downloads | 4/4 | Complete | 2026-07-31 |
| 6 | v1.1 Episode Artifact Downloads | 4/4 | Complete | 2026-07-31 |
| 7. Final Trailer Video Upload | v1.2 | 0/TBD | Not started | - |
| 8. YouTube Job Lifecycle | v1.2 | 0/TBD | Not started | - |
| 9. Title, Hashtags & Publishing | v1.2 | 0/TBD | Not started | - |
| 10. Operator Workflow Integration | v1.2 | 0/TBD | Not started | - |
| 11. Trailer Artifact & Compatibility Release | v1.2 | 0/TBD | Not started | - |
