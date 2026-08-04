# Architecture Patterns

**Domain:** Angular 15 podcast operations admin + sibling Express/SQLite API
**Researched:** 2026-08-03
**Scope:** v1.2 trailer-video upload, YouTube staging/publishing, hashtag count/title editing, and artifact download inclusion
**Confidence:** MEDIUM-HIGH (local code is directly inspected; YouTube behavior is cross-checked against current official documentation)

## Current Boundary and Integration Points

The existing architecture is a thin Angular client over a backend-owned contract:

```text
ManageComponent (/manage)
  -> ApiService (HttpClient + progress events)
    -> authenticated Express /v1/episodes routes
      -> episode repository + media layout + SQLite job repositories
        -> local media / worker / YouTube Data API
```

Frontend integration points:

- `src/app/core/api.service.ts` already defines `Episode`, `EpisodeWriteInput`, `EpisodeArtifactSelector`, and `EpisodeArtifactJobSnapshot`; it owns upload events, artifact-job polling, and authenticated downloads.
- `src/app/pages/manage/manage.component.ts` owns the two editor states, `uploadStates`, upload definitions, polling timers, replacement controls, and the artifact modal. New MP4 state should follow these existing component-owned patterns, but YouTube job state should be keyed by `episodeId`/`jobId`, not held only in a transient subscription.
- `src/app/pages/manage/manage.component.html` and `.scss` are the New Episode File Management and Episodes artifact-modal integration points. Preserve the sectioned operator layout.
- `src/app/core/auth.interceptor.ts` should remain the only bearer-token injection point. The browser must not receive YouTube refresh tokens or call Google directly.

API integration points:

- `src/routes/episodes.routes.ts` already has `POST /v1/episodes/:episodeId/trailer-video`, MP4 validation, staged upload handling, and `trailer-video` in the artifact request schema.
- `src/services/episode-trailer-video.service.ts` atomically copies the staged MP4 into its final location, backs up an existing final file, updates `trailerVideoFileName` and sync status, and removes the staging file. This is the correct replacement boundary.
- `src/database/sqlite.ts` already persists `episodes.trailer_video_file_name`, `episodes.trailer_video_sync_status`, and `artifact_jobs`.
- `src/services/episode-artifact-download.service.ts` already catalogs `trailer-video` as `trailer.mp4`; the frontend currently omits it from `EpisodeArtifactSelector`/`artifactDefinitions`, which is the remaining download UI contract gap.
- `src/services/youtube-metrics.service.ts` already establishes a reusable OAuth2 refresh-token pattern (`YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`) and cached access token. Upload/publish needs a Data API-authorized refresh token, not merely Analytics authorization; verify scopes before enabling the feature.

## Recommended Architecture

Use three backend-owned concerns with separate lifecycles:

1. **Local MP4 transfer:** one authenticated multipart request to the existing trailer-video endpoint. The browser observes `HttpEventType.UploadProgress`; cancellation aborts the request and leaves the previous final MP4 untouched.
2. **YouTube transfer/processing job:** a persisted job that reads the final local MP4, performs a server-side resumable `videos.insert` upload with `privacyStatus: "private"`, then polls YouTube `videos.list(part=processingDetails,status)` until processing succeeds or fails.
3. **Explicit publish mutation:** a separate authenticated command that updates the stored YouTube video ID with `status.privacyStatus: "public"`. Publishing must never be an implicit consequence of upload completion.

The local MP4 is the source of truth for artifact downloads. The YouTube video ID/link and synchronization state are metadata; they must not replace or relocate the local artifact.

## Concrete API Contract

All routes below are under `/v1`, require the existing `requireAuth`, and return `Cache-Control: no-store` for job/status responses.

### Local trailer-video upload

Keep the existing route:

```http
POST /episodes/:episodeId/trailer-video
Content-Type: multipart/form-data
file=<final .mp4>
```

Response: the refreshed episode, including `trailerVideoFileName` and `trailerVideoSyncStatus`.

Recommended semantics:

- Validate extension, MIME, configured byte limit, episode ID, and file presence at the route boundary.
- Stream to the existing episode staging path. Do not delete or overwrite the final file while the request is in progress.
- On completion, use the existing atomic replacement service. If a prior YouTube video exists, set `trailerVideoSyncStatus` to `manual-sync-required` and clear/retain the YouTube link according to the product decision; do not silently claim that the old YouTube video matches the replacement MP4.
- On browser abort, clean the partial staged file. The old final file remains valid. Retry is a new request; replacement is the same endpoint with the same atomic promotion behavior.

The frontend should use `HttpClient` upload progress and an unsubscribe/abort path. This is request-level cancellation, not a server job cancellation API.

### YouTube job endpoints

Prefer one generic job route family rather than separate ad hoc upload and processing records:

```http
POST /episodes/:episodeId/youtube-trailer/jobs
Content-Type: application/json

{
  "title": "editable title, max 100 characters",
  "hashtag": "#optional-hashtag"
}
```

The API validates that a final `trailerVideoFileName` exists, normalizes the title, and creates or returns the active job for the same episode and source fingerprint. A duplicate start while `pending`/`uploading`/`processing` returns the existing job (HTTP 200/202), not a second YouTube video. Use an idempotency key or deterministic key such as `episodeId + trailer SHA-256 + title` if the client can provide one; the server must still verify the file hash.

```http
GET /episodes/:episodeId/youtube-trailer/jobs/:jobId
POST /episodes/:episodeId/youtube-trailer/jobs/:jobId/cancel
POST /episodes/:episodeId/youtube-trailer/jobs/:jobId/retry
POST /episodes/:episodeId/youtube-trailer/publish
Content-Type: application/json

{ "title": "optional final title" }
```

The publish route should require the stored job/video ID, a successful YouTube processing state, and an explicit command. It should update the YouTube `status` part only as needed and then persist the returned public URL and `trailerVideoSyncStatus: "synced"`.

Suggested job snapshot:

```ts
type YouTubeTrailerJobState =
  | 'pending' | 'uploading' | 'processing' | 'ready-to-publish'
  | 'publishing' | 'completed' | 'cancelled' | 'failed';

type YouTubeTrailerJob = {
  jobId: string;
  episodeId: number;
  sourceSha256: string;
  state: YouTubeTrailerJobState;
  progress: number;             // bounded 0..100, monotonic within each stage
  stage: 'upload' | 'youtube-processing' | 'publish' | null;
  videoId: string | null;
  youtubeUrl: string | null;
  privacyStatus: 'private' | 'public' | null;
  title: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};
```

`ready-to-publish` is intentionally distinct from `completed`: the non-public upload succeeded and processing finished, but the operator has not authorized public release.

### Public hashtag count and title data flow

Add a backend proxy endpoint:

```http
GET /youtube/hashtag-count?hashtag=%23DragaoCareca&regionCode=BR
```

The API strips/normalizes the leading `#`, validates length/characters, calls YouTube `search.list` with `q` set to the hashtag and `type=video`, and returns:

```json
{
  "hashtag": "#DragaoCareca",
  "count": 1234,
  "approximate": true,
  "fetchedAt": "...",
  "cacheTtlSeconds": 300
}
```

YouTube documents `pageInfo.totalResults` as an approximation, so label it as an approximate public-result count and cache/debounce lookups. Do not call it on every keystroke. The frontend should pass the count into the title suggestion/display model, but the editable title remains operator-owned and must be submitted back to the API. Enforce the 100-character limit server-side and client-side; truncate by JavaScript string code points/graphemes only after deciding the product’s Unicode policy, and return the normalized final title in every job snapshot.

Recommended title flow:

```text
episode metadata + hashtag count
  -> API suggestion/normalization
  -> editable Angular input (maxlength=100)
  -> POST job / publish payload
  -> persisted title used for videos.insert and videos.update
```

Do not derive a title from an eventual YouTube response after the operator has edited it, and do not let late hashtag responses overwrite the input.

## Persisted State and Recovery

Add a dedicated `youtube_trailer_jobs` table rather than overloading `artifact_jobs`. The existing artifact repository has useful conventions—opaque UUID job IDs, bounded public progress, active-job lookup, restart recovery, and cleanup—but YouTube jobs have provider IDs, OAuth/API failure classes, privacy transitions, and cancellation semantics that do not belong in ZIP preparation.

Minimum columns:

```text
job_id, episode_id, source_sha256, source_size, state, stage, progress,
title, hashtag, hashtag_count, youtube_video_id, youtube_url, privacy_status,
upload_session_uri (encrypted or protected; never exposed),
bytes_uploaded, processing_parts_processed, processing_parts_total,
cancel_requested, error_code, error_message, created_at, updated_at,
completed_at, retry_of_job_id
```

Add a unique/active index on `(episode_id, source_sha256, state)` for active states. Persist only provider identifiers and operational state needed for recovery; protect the resumable session URI because possession can authorize upload continuation. Never persist access tokens in SQLite.

Use explicit transitions:

```text
pending -> uploading -> processing -> ready-to-publish -> publishing -> completed
    |          |            |                 |              |
 cancelled  failed       failed            failed         failed
```

On API startup, mark `uploading` jobs as `failed` with `recoverable: true` unless the stored YouTube session can be safely resumed and the source hash still matches. Marking a job `completed` must be transactional with persisting the YouTube ID/link. A restart must never auto-publish a private video.

Retry rules:

- Local MP4 retry: new HTTP request; no YouTube job mutation.
- YouTube upload retry before a video ID exists: resume the provider session when valid, otherwise create a new job/session; do not create duplicates for an active identical source.
- Retry after YouTube returned a video ID: poll/reconcile that video first. Only create a replacement video after the API cannot find or validate the prior ID, and mark the old private video for operator-visible cleanup rather than guessing.
- Publish retry: repeat the idempotent desired-state update after reconciling current privacy status; never start another upload.

## Progress and Cancellation Semantics

Expose progress as stage plus progress, not one misleading percentage:

- **Local browser upload:** exact `loaded/total` from Angular upload events; cancel aborts the request.
- **API-to-YouTube upload:** byte progress from the resumable session. Google’s protocol returns `308` plus a `Range` for resumable position; use that position after interruptions and do not assume a failed request transferred zero bytes.
- **YouTube processing:** poll `videos.list` and expose the provider’s estimated `partsProcessed/partsTotal`. This estimate can decrease when YouTube revises `partsTotal`; display it as “YouTube processing” and allow non-monotonic provider progress or clamp only the public presentation with a separate raw value.
- **Publish:** short request state (`publishing`), then terminal `completed`/`failed`; do not represent it as upload progress.

Cancellation is cooperative and bounded:

1. `POST .../cancel` sets `cancel_requested=1` atomically if the job is `pending`, `uploading`, or `processing`.
2. The worker checks the flag between chunks and before each provider poll/update. Abort the local HTTP request/stream and stop polling.
3. If a YouTube video ID already exists, cancellation cannot undo the provider-side upload. Leave the video private, record `cancelled` plus the video ID, and expose a manual cleanup/retry path. Never delete a provider video automatically as a cancellation side effect unless deletion is explicitly added and authorized.
4. A job in `publishing` cannot be reliably rolled back; allow the request to finish, reconcile privacy, and report the final state.

This makes cancellation honest: it stops work the API controls, while acknowledging that an external request already accepted by YouTube may complete.

## YouTube Provider Adapter

Create a backend `youtube-trailer.service.ts`/adapter separate from the existing metrics service. Reuse its OAuth2 token-refresh mechanics only through a shared credential helper. The adapter owns:

- resumable `videos.insert` with `status.privacyStatus = "private"`, snippet title/description/tags/category, and the local MP4 stream;
- session URI, byte range, retry/backoff, and 5xx recovery;
- `videos.list(part=processingDetails,status,id)` polling;
- `videos.update(part=status)` for explicit public publish;
- `search.list` for approximate public hashtag counts;
- provider error normalization into stable API error codes.

Google’s current docs state that `videos.insert` accepts video media, returns a video resource/ID, and that unverified projects may be restricted to private uploads; this reinforces private-first behavior. `videos.update` requires the video ID and status part to mutate privacy and has a materially higher quota cost than a read. Keep the Google API surface behind this adapter so routes and workers do not depend on provider response shapes.

## Artifact Download Inclusion

The API catalog already includes:

```text
selector: trailer-video -> final media kind: trailerVideo -> archive name: trailer.mp4
```

The required frontend changes are contract-only:

- extend `EpisodeArtifactSelector` with `'trailer-video'`;
- add `trailerVideoFileName?: string` to `Episode`/editor state;
- add an artifact definition with `.mp4` and availability based on that field;
- ensure the existing artifact job request/poll/download code passes the selector unchanged.

Do not add a separate MP4 download route or client-side ZIP logic. The existing authenticated native Blob delivery and server-authoritative archive remain the correct boundary.

## Anti-Patterns to Avoid

### Browser-to-YouTube upload

Avoid exposing refresh/access tokens, resumable session URIs, or provider quota/error handling to Angular. It breaks the established backend-owned business boundary and complicates cancellation/recovery.

### One job row for local upload, YouTube upload, processing, and ZIP creation

These operations have different sources, terminal states, retries, and retention. Share a status vocabulary where useful, but keep `artifact_jobs` and `youtube_trailer_jobs` separate.

### Implicit public publish

Never set `privacyStatus: public` in the initial upload and never auto-publish after processing. The UI must show the private link and require a distinct Publish action.

### Treating `search.list.totalResults` as exact

Official documentation describes it as an approximation. Cache it, label it, and use it as title guidance rather than a correctness invariant.

## Suggested Build Order

1. **API contract and persistence:** add the YouTube job schema/repository, episode DTO fields, state transitions, idempotency, startup recovery, and OpenAPI definitions. Confirm OAuth scopes/credentials independently of the frontend.
2. **Provider adapter and worker:** implement private resumable upload, processing polling, provider error mapping, progress persistence, cooperative cancellation, and reconciliation/retry. Add integration tests with a fake provider.
3. **API routes:** add start/status/cancel/retry/publish and hashtag-count routes; enforce episode/file/hash/title preconditions and no-store responses.
4. **Existing local MP4 UI contract:** wire `uploadEpisodeTrailerVideo` to `ManageComponent` with exact upload progress, abort, retry, replacement, and stale-subscription teardown.
5. **YouTube UI workflow:** add title/count/link/status controls and explicit Publish action; poll only while the active job is nonterminal and protect operator edits from late responses.
6. **Artifact selector UI:** add `trailer-video` to the frontend selector/definition and verify the existing ZIP includes `trailer.mp4`.
7. **Recovery and release gates:** test duplicate starts, browser cancel, replacement during/after YouTube sync, API restart, provider 5xx/4xx, processing failure, cancel after provider ID creation, publish retry, stale title/count responses, auth bypass/normal auth, artifact availability, and `npm run build`.

## Official Documentation Findings

- [YouTube resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol): initiate a session, retain the `Location` URI, use `308`/`Range` to resume, and retry 5xx interruptions with backoff. Chunk size restrictions apply when chunking.
- [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert): uploads a video and metadata; accepted media is `video/*` or `application/octet-stream`; the response contains the created video resource. Current docs also note private restrictions for unverified API projects.
- [Video processing details](https://developers.google.com/youtube/v3/docs/videos): `processingDetails` is owner-only, processing status is distinct from upload status, and `partsProcessed/partsTotal` is an estimate that can move backward.
- [videos.update](https://developers.google.com/youtube/v3/docs/videos/update): update the video by ID; `status.privacyStatus` can be changed with the status part and requires YouTube authorization scopes. The operation has a 50-unit quota cost.
- [search.list](https://developers.google.com/youtube/v3/docs/search/list): `q` supports the search term and `pageInfo.totalResults` is approximate; use a cached backend proxy for hashtag counts.

## Sources

- Local: `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `.planning/PROJECT.md`.
- Local API: `src/routes/episodes.routes.ts`, `src/services/episode-trailer-video.service.ts`, `src/services/episode-artifact-download.service.ts`, `src/services/episode-artifact-preparation.service.ts`, `src/database/sqlite.ts`, `src/database/repositories/artifact-job.repository.ts`, `src/services/youtube-metrics.service.ts`.
