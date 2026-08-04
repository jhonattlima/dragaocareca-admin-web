# Technology Stack

**Project:** Dragao Careca Admin Web — v1.2 Trailer Video YouTube Publishing  
**Researched:** 2026-08-03  
**Scope:** New milestone capabilities only: final MP4 upload/replace, YouTube private upload and explicit public publish, public hashtag count, 100-character-safe title editing, and artifact-download inclusion.

## Recommendation

Keep the browser thin and put all YouTube work in `dragaocareca-admin-api`. Add one server-side Google API client dependency, reuse the API's existing `google-auth-library` OAuth client and refresh-token configuration, and expose authenticated API-owned jobs for upload, YouTube processing, publish, and hashtag lookup. Do not add a YouTube SDK, resumable-upload implementation, file-saver package, or Google credential to Angular.

The existing Angular stack is sufficient for the local MP4 transfer: `HttpClient` already uses `observe: 'events'` and `reportProgress: true`, while RxJS subscriptions provide cancellation and existing component upload state can represent retry/replacement. The backend should own the YouTube resumable session and durable job state because unsubscribing a browser request cannot safely roll back a server-side upload already sent to YouTube.

## Recommended Stack

### Browser / Existing Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular `HttpClient` | Existing Angular 15 | Upload final `.mp4` to the API with progress events | Already present in `src/app/core/api.service.ts`; `reportProgress` and `observe: 'events'` avoid a new upload library. |
| RxJS | Existing `~7.5.0` | Unsubscribe cancellation, bounded retry, polling teardown | Already present; use a per-upload subscription/token so retry and replacement cannot create duplicate active uploads. |
| TypeScript | Existing `~4.8.2` | DTOs and UI state | Keep API response types in the existing `ApiService`; no browser-side YouTube types are needed. |
| Bootstrap | Existing `5.3.8` | Progress, cancel, retry, replace, publish controls | Existing layout dependency is adequate. |

### Sibling API

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `googleapis` Node.js client | Pin a current release compatible with the API's deployed Node LTS; do not float an unreviewed major | YouTube Data API v3 `videos.insert`, `videos.list`, `videos.update`, and `search.list` | Official Google-maintained Node client; supports OAuth2 and media uploads from readable streams. It uses the existing `google-auth-library` family rather than introducing a second auth model. |
| Existing `google-auth-library` | `^10.6.2` | OAuth2 refresh and access-token management | Already used by `src/services/youtube-metrics.service.ts`; reuse the existing `clientId`, `clientSecret`, and refresh-token pattern. |
| Existing Node `fs` streams | Existing runtime | Stream canonical `episodes/{episodeId}/trailer.mp4` into YouTube | Avoid loading a 500 MiB server-side maximum file into memory. |
| Existing SQLite / repository pattern | Existing API | Persist upload/publish job state, YouTube video ID, status, progress, and recoverable error | Matches the shipped artifact-job lifecycle and prevents duplicate jobs after browser refresh/retry. |
| Native `AbortController` / request cancellation | Existing Node runtime | Stop work at safe backend boundaries | Cancellation should mark the local job cancelled and stop future polling/retry; it must not imply that a completed YouTube upload was undone. |

### Google Cloud Configuration

| Setting | Purpose | Recommendation |
|---------|---------|----------------|
| YouTube Data API v3 enabled in the Google Cloud project | Enables Data API methods | Required before rollout. |
| OAuth web-server client ID/secret | Authorizes the channel owner | Keep server-side only; never expose the client secret or refresh token to Angular. |
| Refresh token | Allows API-owned background jobs after the operator leaves the page | Store as a protected deployment secret, following the API's current `YOUTUBE_REFRESH_TOKEN` convention. Re-authorize if the granted scope does not include update access. |
| `YOUTUBE_API_KEY` (or equivalent server secret) | Public hashtag search count | Use a server-side API key for unauthenticated public `search.list`; apply caching/debounce because each search request consumes quota. |
| Channel/category configuration | Video metadata | Keep a configured YouTube category ID and send it on insert. Preserve required snippet fields when updating metadata. |

## YouTube API Contract and Constraints

### Private upload

Use `videos.insert` with `part=snippet,status` and a readable stream for the canonical final MP4. Set `status.privacyStatus=private` explicitly. The API accepts video media up to 256 GB, so the existing API limit of 500 MiB remains the correct product boundary rather than expanding it to YouTube's maximum.

Use the resumable media-upload mode. The official protocol starts a session at:

```text
POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
```

The client library should manage the upload session where possible. The job must persist enough state to recover after process interruption, and must poll the returned video ID with `videos.list(part=processingDetails,status,id)` after the byte upload completes. YouTube's processing progress can be polled, but its estimated processed-part count may decrease as YouTube revises the estimate; expose monotonic/bounded UI progress rather than treating it as an exact percentage.

Unverified API projects created after 2020-07-28 have uploads restricted to private viewing until the project passes Google's audit. That policy aligns with this milestone's explicit private-then-publish workflow, but production release still needs the channel/project audit status checked.

### Explicit public publish

Use `videos.update(part=status)` with the stored YouTube video ID and `{ status: { privacyStatus: "public" } }`. Do not combine this with an unnecessary snippet update. Google documents that `videos.update` replaces existing mutable values within requested parts; a future metadata update must include all values it intends to preserve. A publish job should only become locally `synced` after the API confirms the update and the video is in a publishable/processed state.

`youtube.upload` is sufficient for `videos.insert`, but the official `videos.update` authorization list does not include it. Request `https://www.googleapis.com/auth/youtube.force-ssl` for the single server-side grant because it authorizes video read/edit/delete operations and is accepted by both insert and update. Do not use a service account: Google documents service-account support only for content owners managing multiple channels.

### Public hashtag search count

Use `search.list(part=snippet,type=video,q=<normalized hashtag>)` through the API, returning `pageInfo.totalResults`. Treat the value as an approximate public result count, not an exact analytics metric: Google's documentation explicitly warns it may not represent an exact value and is capped at 1,000,000. Normalize input to one hashtag, reject control characters/oversized input, URL-encode it, and cache/debounce repeated lookups.

This is a search-result count, not a count of videos owned by the channel and not a count of tags in YouTube metadata. The UI should label it accordingly. A public search can use the server-side API key; it does not require exposing OAuth to the browser.

### Title safety

YouTube `snippet.title` has a maximum length of 100 characters and rejects `<` and `>`. Enforce the limit in both API validation and the Angular counter/truncation helper. Count Unicode code points rather than UTF-16 code units when trimming, and preserve the operator's editable value. If `snippet` is updated, include the required `snippet.categoryId` and the complete intended snippet fields.

### Quota budget

| Operation | Official cost / limit | Design implication |
|-----------|-----------------------|--------------------|
| `videos.insert` | 1 quota unit; default 100 video uploads/day | One job per replace attempt; never start a duplicate job from polling or retry UI. |
| `videos.update` | 50 quota units | Publish only on explicit operator action; make publish idempotent against the stored video ID/status. |
| `videos.list` | 1 unit/call | Poll with a backoff interval and stop after terminal processing state. |
| `search.list` | 1 unit/call; default 100 search calls/day | Debounce and cache hashtag count; do not search on every keystroke. |
| Other Data API methods | Default combined 10,000 units/day allocation | Monitor quota and surface a recoverable configuration/quota error rather than retrying indefinitely. |

Google's overview currently describes separate default allocations of 100 `search.list` calls/day, 100 `videos.insert` calls/day, and 10,000 units/day for other endpoints. These are service quotas and may change; verify the project's Cloud Console quota before launch.

## API Job Shape to Plan Against

Use separate durable job types or a discriminated job record rather than overloading the existing artifact job:

```text
trailer-video-upload: pending → uploading → uploaded/private → processing → ready | failed | cancelled
trailer-video-publish: pending → publishing → published | failed | cancelled
hashtag-search: request/response with short cache TTL; not a long-running job
```

The upload job should contain `episodeId`, source file evidence (path/size/hash or equivalent), YouTube video ID once created, provider processing status, bounded progress, error code/message, timestamps, and a deduplication key based on the episode and source revision. Replacement must create a new source revision and mark the old publication `manual-sync-required`; it must not silently publish a different file. The artifact selector should extend the existing frontend/API vocabulary with `trailer-video` while retaining the already canonical server-side selector validation.

The browser should poll API job status, not YouTube directly. Browser cancel can abort the local MP4 transfer before the API receives it. Once the API has promoted the file or started a YouTube upload, cancellation is a safe boundary/stop-request operation; it should not promise rollback of an external YouTube resource. Retry should reuse a known resumable session when recoverable, or create a new deduplicated job when the session is expired (Google returns 404 for an expired resumable session).

## What Not to Add

| Avoid | Reason |
|-------|--------|
| YouTube SDK or OAuth flow in Angular | Exposes unnecessary credential surface and violates the existing thin-frontend/backend-source-of-truth boundary. |
| Browser direct-to-YouTube upload | Makes durable progress, cancellation boundaries, refresh-token handling, and replacement consistency harder; the API already owns the canonical MP4. |
| A second OAuth library | `google-auth-library` is already installed and used for YouTube metrics. Reuse its OAuth2 client with the official API client. |
| Client ZIP/file-saver dependency | Artifact download is already an authenticated native Blob flow; only extend the selector and backend archive source. |
| Polling YouTube on every Angular change-detection cycle | Burns quota and couples UI state to provider details. Poll one API-owned job endpoint with backoff. |
| Treating `pageInfo.totalResults` as exact | Google explicitly describes it as approximate for `search.list`; display it as an estimate/count of search results. |

## Version and Compatibility Notes

- The web remains Angular 15 / TypeScript 4.8 / RxJS 7.5; no framework upgrade is required for this milestone.
- The sibling API currently uses CommonJS, TypeScript 6, Node built-ins, and `google-auth-library` 10.6.2. Pin the selected `googleapis` version in `package.json` and lockfile after checking it against the deployed Node LTS; avoid upgrading the API's TypeScript or Node runtime as incidental scope.
- Use the generated YouTube Data API v3 surface from the official Node client. If its upload abstraction cannot expose the required progress/cancellation semantics, use the documented resumable HTTP protocol from the API worker with the existing OAuth2 access token—still server-side, still behind the job boundary—not a new browser dependency.
- The existing frontend artifact selector type currently omits `trailer-video` even though the API README and server route support it. This is a contract/type extension, not a new package.

## Sources

- [YouTube Data API overview: quotas, default allocations, and method costs](https://developers.google.com/youtube/v3/getting-started) — official Google documentation, checked 2026-08-03.
- [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) — upload endpoint, MIME/size limits, accepted OAuth scopes, private-upload policy, and upload quota.
- [Resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) — session initiation, `308`/`Range` recovery, chunk rules, retry, and expired-session behavior.
- [videos.update](https://developers.google.com/youtube/v3/docs/videos/update) — publish operation, OAuth scopes, 50-unit cost, required parts, and replacement semantics.
- [videos.list](https://developers.google.com/youtube/v3/docs/videos/list) and [video processing implementation](https://developers.google.com/youtube/v3/guides/implementation/videos) — processing-status polling and 1-unit reads.
- [search.list](https://developers.google.com/youtube/v3/docs/search/list) — query/type parameters and approximate `pageInfo.totalResults`.
- [Video resource](https://developers.google.com/youtube/v3/docs/videos) — 100-character title constraint and privacy/processing fields.
- [OAuth 2.0 for web-server applications](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) — server-side OAuth and credential storage guidance.
- [Official Google APIs Node.js client](https://github.com/googleapis/google-api-nodejs-client) — maintained Node client, OAuth2, and readable-stream media upload support.
- Local contracts: [PROJECT.md](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web/.planning/PROJECT.md), [API README](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/README.md), [frontend ApiService](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web/src/app/core/api.service.ts), and [API YouTube metrics service](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/youtube-metrics.service.ts).

**Confidence:** HIGH for official API behavior and quotas after cross-checking the current Google reference pages; MEDIUM for the exact `googleapis` package version because the repository's deployment Node version and dependency-refresh policy were not specified.
