# Requirements: Dragao Careca Admin Web

**Defined:** 2026-08-03
**Milestone:** v1.2 Trailer Video YouTube Publishing
**Core Value:** Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## v1 Requirements

### Local Trailer Upload

- [ ] **TRAILER-01**: The user can select an MP4 final trailer video in the New Episode File Management section.
- [ ] **TRAILER-02**: The user can upload the selected trailer to the existing backend endpoint and see byte-level upload progress.
- [ ] **TRAILER-03**: The user can cancel an in-progress local trailer upload, and the previous finalized trailer remains available when replacement does not complete.
- [ ] **TRAILER-04**: The user can retry a failed or canceled local upload without selecting the file again, or replace it with a different selected video.
- [ ] **TRAILER-05**: The UI clearly distinguishes selected, uploading, canceled, failed, staged, and replacement states and does not offer a publish action before local upload succeeds.

### YouTube Workflow

- [ ] **YOUTUBE-01**: The user can start a server-owned YouTube trailer job for the current finalized trailer using the selected title and summary.
- [ ] **YOUTUBE-02**: The API uploads the trailer to YouTube as non-public and returns a watch link/video identifier without exposing provider credentials to the browser.
- [ ] **YOUTUBE-03**: The user can see separate progress/state feedback for YouTube transfer, YouTube processing, and readiness to publish.
- [ ] **YOUTUBE-04**: The user can retry recoverable YouTube failures without creating duplicate active jobs or duplicate provider videos when an existing upload can be reconciled.
- [ ] **YOUTUBE-05**: The user can cancel a pending or active YouTube job with honest messaging about work already accepted by YouTube and any resulting private video requiring reconciliation.
- [ ] **YOUTUBE-06**: After a non-public YouTube video is ready, the user can explicitly publish it publicly with a separate confirmation action.
- [ ] **YOUTUBE-07**: The existing YouTube link field is populated with the returned non-public link and remains available after public publishing.

### Title and Hashtag Support

- [ ] **TITLE-01**: The UI suggests a trailer title using `Trailer - {episode name}` and the selected hashtag values while allowing the user to edit it before upload or publish.
- [ ] **TITLE-02**: The API and UI enforce a maximum of 100 Unicode characters and reject or explain invalid title characters without silently overwriting the user's edited title.
- [ ] **TITLE-03**: The user can enter a hashtag and request a count of matching public YouTube search results, with the result labeled approximate and showing its retrieval time.
- [ ] **TITLE-04**: Hashtag lookup is normalized, debounced or explicitly triggered, cached/rate-limited by the API, and exposes a recoverable unavailable/error state.

### Artifact Integration

- [ ] **ARTIFACT-01**: The Episodes artifact-download modal offers the finalized `trailer-video` artifact when it is available.
- [ ] **ARTIFACT-02**: A requested finalized trailer video is included in the backend-generated ZIP under its canonical `trailer.mp4` entry and unavailable/staged files are not downloaded as if finalized.

### Operational Safety

- [ ] **OPS-01**: YouTube credentials and provider requests remain API-owned, authenticated, and absent from browser-visible payloads, logs, and public job snapshots.
- [ ] **OPS-02**: YouTube jobs persist their episode/source identity, state, progress, provider identifiers, and failure information so polling, reload, restart recovery, and stale-response protection cannot update a newer trailer.
- [ ] **OPS-03**: Duplicate starts, retries, publish requests, and concurrent replacement actions are idempotent or safely rejected with actionable state.
- [ ] **OPS-04**: The API handles YouTube OAuth, quota, provider, proxy-size, and timeout failures with stable user-facing error states and bounded retry behavior.
- [ ] **OPS-05**: Existing authentication modes, `authBypass`, episode editing, summary behavior, artifact downloads, frontend tests, and `npm run build` remain compatible.

## Future Requirements

Deferred beyond v1.2:

- Scheduled YouTube publication.
- Batch trailer uploads or publishing for multiple episodes.
- YouTube playlists, thumbnails, captions, analytics, and publication history.
- Browser-resumable upload protocol between Angular and the API.
- Automatic replacement or deletion of an already-public YouTube video when a local trailer is replaced.

## Out of Scope

| Feature | Reason |
|---|---|
| Browser-side YouTube OAuth or direct Google API calls | Credentials and provider policy belong in the backend. |
| Automatic public publication after upload | Public release must remain an explicit operator action. |
| Exact global hashtag counts | YouTube public search totals are approximate by provider definition. |
| Client-side ZIP creation or arbitrary filesystem paths | Artifact resolution and ZIP creation remain backend responsibilities. |
| Replacing the existing sectioned admin layout | The milestone extends the current operator workflow. |

## Traceability

Traceability will be filled when the v1.2 roadmap is approved.

| Requirement | Phase | Status |
|---|---|---|
| TRAILER-01 | Phase 7 | Pending |
| TRAILER-02 | Phase 7 | Pending |
| TRAILER-03 | Phase 7 | Pending |
| TRAILER-04 | Phase 7 | Pending |
| TRAILER-05 | Phase 7 | Pending |
| YOUTUBE-01 | Phase 8 | Pending |
| YOUTUBE-02 | Phase 8 | Pending |
| YOUTUBE-03 | Phase 8 | Pending |
| YOUTUBE-04 | Phase 8 | Pending |
| YOUTUBE-05 | Phase 8 | Pending |
| YOUTUBE-06 | Phase 9 | Pending |
| YOUTUBE-07 | Phase 9 | Pending |
| TITLE-01 | Phase 9 | Pending |
| TITLE-02 | Phase 9 | Pending |
| TITLE-03 | Phase 9 | Pending |
| TITLE-04 | Phase 9 | Pending |
| ARTIFACT-01 | Phase 11 | Pending |
| ARTIFACT-02 | Phase 11 | Pending |
| OPS-01 | Phase 8 | Pending |
| OPS-02 | Phase 8 | Pending |
| OPS-03 | Phase 8 | Pending |
| OPS-04 | Phase 8 | Pending |
| OPS-05 | Phase 10 | Pending |

---
*Requirements defined: 2026-08-03*
