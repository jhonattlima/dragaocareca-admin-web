# Requirements: Dragao Careca Admin Web

**Defined:** 2026-08-03
**Milestone:** v1.2 Trailer Video YouTube Publishing
**Core Value:** Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## v1 Requirements

### Local Trailer Upload

- [x] **TRAILER-01**: The user can select an MP4 final trailer video in the New Episode File Management section.
- [x] **TRAILER-02**: The user can upload the selected trailer to the existing backend endpoint and see byte-level upload progress.
- [x] **TRAILER-03**: The user can cancel an in-progress local trailer upload, and the previous finalized trailer remains available when replacement does not complete.
- [x] **TRAILER-04**: The user can retry a failed or canceled local upload without selecting the file again, or replace it with a different selected video.
- [x] **TRAILER-05**: The UI clearly distinguishes selected, uploading, canceled, failed, staged, and replacement states and does not offer a publish action before local upload succeeds.

### YouTube Workflow

- [x] **YOUTUBE-01**: After trailer staging, the user can start a server-owned private YouTube trailer job from the authenticated draft using the selected title, summary, and hashtags.
- [x] **YOUTUBE-02**: The API uploads the staged trailer to YouTube as non-public and returns a sanitized watch link without exposing provider credentials or IDs to the browser.
- [x] **YOUTUBE-03**: The user can see separate progress/state feedback for YouTube transfer, YouTube processing, and readiness to publish.
- [x] **YOUTUBE-04**: The user can retry recoverable YouTube failures without creating duplicate active jobs or duplicate provider videos when an existing upload can be reconciled.
- [x] **YOUTUBE-05**: The user can cancel a pending or active YouTube job with honest messaging about work already accepted by YouTube and any resulting private video requiring reconciliation.
- [x] **YOUTUBE-06**: Saving the episode commits the saved summary/title/hashtags to the private YouTube video and publishes it after private readiness is confirmed.
- [x] **YOUTUBE-07**: The existing YouTube link field is populated with the returned non-public link and remains available after public publishing.

### Title and Hashtag Support

- [x] **TITLE-01**: The UI shows a read-only trailer title preview using `Trailer - {episode name}` and the selected hashtag values, updating automatically as the episode name or hashtags change.
- [x] **TITLE-02**: The API and UI enforce a maximum of 100 Unicode characters for the assembled trailer title and explain invalid titles without silently overwriting the authored episode name or hashtags.
- [x] **TITLE-03**: The user can enter a hashtag and request a count of matching public YouTube search results, with the result labeled approximate and showing its retrieval time.
- [x] **TITLE-04**: Hashtag lookup is normalized, debounced or explicitly triggered, cached/rate-limited by the API, and exposes a recoverable unavailable/error state.

### Artifact Integration

- [ ] **ARTIFACT-01**: The Episodes artifact-download modal offers the finalized `trailer-video` artifact when it is available.
- [ ] **ARTIFACT-02**: A requested finalized trailer video is included in the backend-generated ZIP under its canonical `trailer.mp4` entry and unavailable/staged files are not downloaded as if finalized.

### Operational Safety

- [x] **OPS-01**: YouTube credentials and provider requests remain API-owned, authenticated, and absent from browser-visible payloads, logs, and public job snapshots.
- [x] **OPS-02**: YouTube jobs persist their episode/source identity, state, progress, provider identifiers, and failure information so polling, reload, restart recovery, and stale-response protection cannot update a newer trailer.
- [x] **OPS-03**: Duplicate starts, retries, publish requests, and concurrent replacement actions are idempotent or safely rejected with actionable state.
- [x] **OPS-04**: The API handles YouTube OAuth, quota, provider, proxy-size, and timeout failures with stable user-facing error states and bounded retry behavior.
- [ ] **OPS-05**: Existing authentication modes, `authBypass`, episode editing, summary behavior, artifact downloads, frontend tests, and `npm run build` remain compatible.

### Episode Form Stability Patch

- [x] **FORM-01**: Add Episode publication defaults use the latest valid publication date/time plus seven calendar days, or the current local date/time when no valid prior episode exists.
- [x] **FORM-02**: Episode-audio upload responses contain backend-confirmed `HH:MM:SS` duration and nonnegative byte metadata; missing metadata fails the upload and trailer-audio behavior remains unchanged.
- [x] **FORM-03**: Configured participant defaults select only names present in the loaded participant catalog.
- [x] **FORM-04**: Save and API writes require at least one complete music credit with a non-empty name and reference link.
- [x] **FORM-05**: Duration, Bytes, and Spotify ID remain read-only and use light-gray styling without hint text.

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

Traceability records the approved v1.2 requirements and the implemented Phase 8.1 form-stability patch.

| Requirement | Phase | Status |
|---|---|---|
| TRAILER-01 | Phase 7 | Complete |
| TRAILER-02 | Phase 7 | Complete |
| TRAILER-03 | Phase 7 | Complete |
| TRAILER-04 | Phase 7 | Complete |
| TRAILER-05 | Phase 7 | Complete |
| YOUTUBE-01 | Phase 8 | Complete |
| YOUTUBE-02 | Phase 8 | Complete |
| YOUTUBE-03 | Phase 8 | Complete |
| YOUTUBE-04 | Phase 8 | Complete |
| YOUTUBE-05 | Phase 8 | Complete |
| YOUTUBE-06 | Phase 8 | Complete |
| YOUTUBE-07 | Phase 8 | Complete |
| TITLE-01 | Phase 9 | Complete |
| TITLE-02 | Phase 9 | Complete |
| TITLE-03 | Phase 9 | Complete |
| TITLE-04 | Phase 9 | Complete |
| ARTIFACT-01 | Phase 11 | Pending |
| ARTIFACT-02 | Phase 11 | Pending |
| OPS-01 | Phase 8 | Complete |
| OPS-02 | Phase 8 | Complete |
| OPS-03 | Phase 8 | Complete |
| OPS-04 | Phase 8 | Complete |
| OPS-05 | Phase 10 | Pending |
| FORM-01 | Phase 8.1 (08.1-00 through 08.1-03) | Complete |
| FORM-02 | Phase 8.1 (08.1-00 through 08.1-03) | Complete |
| FORM-03 | Phase 8.1 (08.1-00 through 08.1-03) | Complete |
| FORM-04 | Phase 8.1 (08.1-00 through 08.1-03) | Complete |
| FORM-05 | Phase 8.1 (08.1-00 through 08.1-03) | Complete |

---
*Requirements defined: 2026-08-03*
