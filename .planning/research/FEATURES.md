# Feature Landscape

**Domain:** Trailer-video production and YouTube publishing inside a podcast episode admin workflow  
**Project:** Dragao Careca Admin Web + sibling API  
**Milestone:** v1.2 Trailer Video YouTube Publishing  
**Researched:** 2026-08-03  
**Overall confidence:** MEDIUM (existing project contracts are HIGH; current YouTube API behavior is verified against official Google documentation, but the new API job contract is not yet implemented)

## Scope and Existing Baseline

This research covers only the new v1.2 capabilities. The Angular app is a thin, sectioned admin client; the sibling API owns persistence, media promotion, YouTube credentials, background jobs, and business validation.

Already present in the sibling API:

- `POST /v1/episodes/:episodeId/trailer-video` accepts MP4, writes to a deterministic staging file, and atomically replaces the final `episodes/{id}/trailer.mp4` file.
- `trailerVideoFileName` and `trailerVideoSyncStatus` are persisted. Replacing an uploaded trailer is deliberately marked `manual-sync-required` when an existing YouTube link exists.
- The artifact catalog already contains the canonical `trailer-video` selector and emits `trailer.mp4` in the episode ZIP when the file exists.
- Existing artifact downloads already provide authenticated, asynchronous preparation, progress polling, retry/reset, and native browser download behavior.

Therefore, v1.2 should extend the existing contracts rather than create a second media model or a client-side YouTube integration.

## Table Stakes

Features users expect. Missing one makes the workflow unsafe or operationally incomplete.

| Feature | Why Expected | Complexity | Recommendation |
|---|---|---:|---|
| Final MP4 picker in New Episode → File Management | Operators need one obvious place to select the trailer video alongside existing audio, trailer, and cover files. | Med | Accept `.mp4`; show filename, size, and a clear replacement action. Keep the existing sectioned layout. |
| Client upload progress | A final MP4 can be large; a spinner cannot distinguish a healthy transfer from a stalled one. | Med | Use byte-based progress where the browser reports it; show percentage and transferred/total bytes. Do not claim YouTube processing progress is upload progress. |
| Cancel browser-to-API upload | Operators must be able to stop a mistaken or oversized selection without waiting for completion. | Med | Abort the active request, clear the active progress state, and leave the previously promoted final file untouched. The API should clean the partial staging file. |
| Retry after recoverable upload failure | Network interruptions and transient server errors are normal for large media. | Med | Retry from a clean, explicit state. If resumable browser upload is not introduced, label retry as a new transfer; never imply byte resume. |
| Safe replacement semantics | A replacement must not destroy the last known-good trailer before the new MP4 is validated and fully received. | High | Preserve the sibling API’s staged-file → atomic promotion flow. Return the resulting episode row only after promotion; retain old media until promotion succeeds. |
| Duplicate-job/request protection | Double-clicks, refreshes, and repeated retries can otherwise create competing uploads or YouTube videos. | High | Disable conflicting controls while active; API idempotency key or deterministic active-job lookup should make repeated requests converge on one job. |
| Explicit local upload states | Operators need to distinguish staged, uploading, canceled, failed, and ready-to-publish. | Med | Model states separately from YouTube state; show actionable error text and a retry/replace path. |
| YouTube non-public draft upload | Uploading public by default is an unacceptable publishing accident. | High | Create the YouTube video with `privacyStatus=private` as the product default. Unlisted may be supported internally only if deliberately chosen; it is not private because anyone with the URL can access it. `videos.insert` supports private, unlisted, and public values, while unverified API projects may force inserted videos to private. ([official `videos.insert` docs](https://developers.google.com/youtube/v3/docs/videos/insert), [video resource docs](https://developers.google.com/youtube/v3/docs/videos)) |
| Returned YouTube link and status | The operator needs confirmation that the draft exists and a way to inspect it before publishing. | Med | Persist the YouTube video ID and canonical watch URL only after YouTube returns the created resource. Show privacy status and processing status separately. |
| YouTube upload progress | A queued job with no visible state is not operationally usable. | High | API-owned job with status polling. Report upload bytes when available, then a distinct “processing on YouTube” phase; YouTube exposes `processingDetails.processingStatus` and estimated parts progress for owner-authorized reads. ([official implementation guide](https://developers.google.com/youtube/v3/guides/implementation/videos)) |
| Recoverable YouTube failure | A transient upstream failure must not force the operator to guess whether a second upload is safe. | High | Persist job state, upstream video ID/session metadata where resumable recovery is possible, error class, and retry eligibility. Retry the same job/session when safe; otherwise require an explicit “start new upload” action. |
| Explicit public Publish action | Non-public upload and public release are separate operator decisions. | High | Publish button is disabled until the draft upload is complete and YouTube processing has succeeded (or the API explicitly declares it publishable). Require a confirmation naming the episode/title and stating that the video becomes public. Implement publish through `videos.update` with `status.privacyStatus=public`; preserve metadata parts in the update body. ([official `videos.update` docs](https://developers.google.com/youtube/v3/docs/videos/update)) |
| Publish result reconciliation | A successful API call must update the episode UI, not leave a stale “draft” state. | Med | Poll or refresh the episode after publish; show public status and the same canonical link. Treat a timeout as “unknown—refresh status,” not as permission to publish again. |
| Public hashtag count lookup | The title workflow needs a measurable signal for a proposed public hashtag. | Med | Backend calls `search.list` with a normalized `q` and `type=video`, then returns `pageInfo.totalResults`. That value is an approximation, capped at 1,000,000, and must be labeled “estimated public results,” not an exact count. ([official `search.list` docs](https://developers.google.com/youtube/v3/docs/search/list)) |
| Search input normalization and scope | Raw text can cause inconsistent counts and expensive repeated calls. | Med | Accept one hashtag/query at a time; normalize whitespace and require a valid `#tag`-style token or explicitly define broader query behavior. Send region/language scope deliberately and display it if material. Debounce and cache recent results server-side. |
| Editable 100-character-safe title | Operators need to tune the trailer title, while YouTube rejects titles over its limit. | Low | Make the title editable before upload and before publish, show a live counter, reject `<` and `>` and enforce a maximum of 100 Unicode characters in both UI and API. The API’s `snippet.title` maximum is 100 characters. ([official video resource docs](https://developers.google.com/youtube/v3/docs/videos), [minimum functionality requirements](https://developers.google.com/youtube/terms/required-minimum-functionality)) |
| Title update without accidental privacy change | Editing metadata should not unexpectedly publish or privatize a video. | Med | Send only the intended mutable parts, and when updating `snippet`, include required fields such as title/category as the API contract requires. Keep title editing separate from the Publish action. |
| Trailer-video artifact option | The final MP4 is a first-class episode deliverable, not only a YouTube source. | Low | Keep the existing canonical `trailer-video` selector, display `trailer.mp4`, disable it when unavailable, and include it in the same authenticated ZIP with the existing progress/retry/download flow. No separate browser download is needed. |
| Auth and bypass consistency | New API calls must work with the existing bearer interceptor and local `authBypass` development mode. | Med | Add calls through `ApiService`; never expose YouTube credentials or direct Google upload URLs to the browser. Preserve the current auth guard/interceptor behavior. |

## Useful Differentiators

Valuable improvements that fit the milestone if the core job contract is stable.

| Feature | Value Proposition | Complexity | Priority |
|---|---|---:|---|
| Resumable YouTube upload | Large uploads recover without re-sending all bytes. Google’s resumable protocol stores a session URI, uses `Content-Range`, returns `308` with the last accepted range, and supports retry after 5xx/network interruption. | High | Recommended for the API worker. It is especially appropriate because the API already owns long-running jobs. ([official resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)) |
| Unified stage timeline | One compact timeline—local upload → staged → YouTube transfer → YouTube processing → private draft → published—reduces ambiguity. | Med | Recommended if each phase has a real backend state and timestamp. |
| Replace-warning with impact summary | Tells the operator that replacing the MP4 does not automatically replace the already-uploaded YouTube video. | Low | Recommended. Explicitly offer “replace local trailer” and “upload replacement to YouTube” as separate consequences. |
| Copy link action | Makes handoff to review or show notes faster. | Low | Recommended after the link exists; provide accessible confirmation. |
| Last-known search count and timestamp | Prevents an empty screen when quota or network is temporarily unavailable and makes staleness visible. | Low | Recommended; label cached data clearly. |
| Processing failure reason | YouTube exposes upload/processing failure and rejection reasons. Showing a normalized reason shortens support loops. | Med | Recommended where available; retain raw provider details in API logs, not necessarily in the UI. |
| Job recovery after page reload | Operators can leave and return without starting another upload. | High | Recommended for YouTube jobs; optional for the local browser upload because a browser `File` object cannot reliably survive reload. |

## Anti-Features

Features to explicitly avoid in v1.2.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Direct browser-to-YouTube upload | Leaks credential/session complexity into Angular, conflicts with the thin-client boundary, and complicates cancellation and persistence. | Browser uploads to the sibling API; API worker owns YouTube OAuth and resumable transfer. |
| Public-by-default upload | A single mistaken click can publish an unfinished or unreviewed trailer. | Always create non-public first and require an explicit Publish confirmation. |
| Treating “upload complete” as “ready to publish” | YouTube may still be processing after `videos.insert`; a returned video ID does not guarantee playable content. | Poll processing status and expose a separate processing state. |
| Exact hashtag popularity claim | `pageInfo.totalResults` is explicitly approximate and capped; it is not a durable market metric. | Display “estimated public results,” timestamp and query scope. |
| Client-side YouTube API keys/OAuth | Credentials and provider rules belong to the API; this also makes server-side quota management impossible. | Keep Google authorization and quota accounting in the API. |
| Automatic YouTube replacement on every local MP4 replacement | Replacing the local source can silently create a new video or leave the old public video inconsistent. | Mark sync as requiring action and make a separate upload/reconcile step explicit. |
| Full browser-resumable upload implementation in v1.2 | It expands the Angular/API protocol significantly and is not required if the API endpoint already accepts the final MP4. | Provide cancel/retry with clear semantics now; reserve client resume for evidence-driven need. Use resumable transfer inside the API-to-YouTube worker. |
| Batch YouTube publishing, scheduling, playlists, thumbnails, captions, or analytics | These are separate workflows and increase quota, metadata, and moderation complexity. | Ship one episode, one trailer, one explicit publish action. |

## Feature Dependencies

```
New Episode MP4 selection
  → authenticated local upload job
  → staged/final trailer persistence
  → YouTube draft metadata (title + privacy=private)
  → YouTube upload job
  → YouTube processing status
  → returned link + editable title
  → explicit public publish

Hashtag query normalization → cached public-result count → title suggestion/editing
Final trailer persistence → artifact preflight → trailer-video ZIP selector/download
Job identity + persisted state → progress polling + cancel boundary + retry/reload recovery
```

Important independence: local MP4 replacement and YouTube publishing must not be one implicit transaction. A local replacement can succeed while the existing YouTube video remains public and unchanged; the UI must show that distinction.

## MVP Recommendation

Prioritize:

1. Final MP4 selection and API-backed staged replacement with visible upload progress, cancel, retry, and safe last-known-good preservation.
2. Persisted YouTube draft job that uploads privately, reports transfer and processing phases, returns the watch link, and prevents duplicate jobs.
3. Explicit public Publish action with confirmation and reconciliation.
4. Editable title with a server-enforced 100-character limit.
5. One normalized hashtag query returning a clearly labeled estimated public-result count with timestamp/error state.
6. Existing artifact modal wired to the already-present `trailer-video` selector and `trailer.mp4` entry.

Defer resumable transfer from browser to API, scheduled publishing, batch operations, thumbnails, captions, playlists, and analytics. Keep resumable API-to-YouTube transfer in MVP if the worker handles large files; Google documents it as the reliability path for large or unstable transfers.

## UX State Contract Recommended for Roadmap

The roadmap should plan explicit state coverage rather than only happy-path buttons:

| Area | Minimum states |
|---|---|
| Local MP4 | empty, selected, uploading, canceled, failed-retryable, staged, replacing, replacement-failed |
| YouTube job | not-started, queued, uploading, upload-failed-retryable, processing, processing-failed, private-ready, publishing, public, publish-failed-unknown, canceled |
| Title/count | generated, edited, valid, over-limit, invalid-character, count-loading, count-ready, count-stale, count-unavailable |
| Artifact | trailer unavailable, trailer available/selected, ZIP queued, ZIP processing, ZIP ready, ZIP failure/retry |

Cancel should have a declared boundary: local HTTP upload cancellation is immediate from the browser’s perspective; canceling a YouTube job may only stop future work and cannot undo a video already accepted by YouTube. If a provider video exists, surface its ID/status and offer reconciliation rather than blindly retrying.

## Quota and Operational Constraints

YouTube’s current quota documentation reports default daily allocations of 100 `search.list` calls, 100 `videos.insert` calls, and 10,000 units for other endpoints. Search is therefore not suitable for keystroke-by-keystroke requests; debounce, cache, and require an explicit lookup action. ([official quota and compliance docs](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits))

The API should own rate limiting, OAuth scope/configuration, provider error mapping, job cleanup, and observability. The web client should only render the returned state and initiate user actions.

## Confidence and Open Questions

- **HIGH:** Existing local trailer-video staging/replacement and artifact-selector behavior, based on direct sibling-API inspection.
- **MEDIUM:** YouTube privacy, processing, title, resumable-upload, search-count, and quota behavior, verified against current official Google docs and cross-checked across endpoint/resource guides.
- **LOW / unresolved:** Exact v1.2 API route names, persistence schema, OAuth account/channel selection, maximum local MP4 size as a product decision, cancellation behavior after a YouTube video ID is created, and whether the project’s YouTube API project has passed the audit needed to lift private-only restrictions.

These unresolved items need phase-specific API contract research before implementation. They should not be guessed in the frontend.

## Sources

- [YouTube Data API: videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) — upload, accepted media, privacy values, authorization, private-only restriction for unverified projects.
- [YouTube Data API: video resource](https://developers.google.com/youtube/v3/docs/videos) — title limit, privacy/upload/processing states, failure reasons.
- [YouTube Data API: videos.update](https://developers.google.com/youtube/v3/docs/videos/update) — mutable title/privacy fields and update semantics.
- [YouTube Data API: processing-status implementation](https://developers.google.com/youtube/v3/guides/implementation/videos) — polling after upload.
- [YouTube Data API: resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) — session, range, retry, and chunk behavior.
- [YouTube Data API: search.list](https://developers.google.com/youtube/v3/docs/search/list) — query filters, `pageInfo.totalResults`, approximation/cap, and search quota.
- [YouTube API quota and compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) — default quota allocation and audit implications.
- [YouTube API required minimum functionality](https://developers.google.com/youtube/terms/required-minimum-functionality) — title length enforcement.
