# Project Research Summary

**Project:** Dragao Careca Admin Web — v1.2 Trailer Video YouTube Publishing
**Domain:** Podcast episode operations admin with backend-owned media and YouTube workflows
**Researched:** 2026-08-03
**Confidence:** MEDIUM-HIGH

## Executive Summary

v1.2 should extend the existing thin Angular admin client and sibling API rather than introduce a browser-side YouTube integration. The browser uploads the final MP4 to the existing authenticated trailer endpoint, then starts and polls a durable API-owned YouTube job. The API streams the canonical final file to YouTube through a server-side OAuth client and resumable upload, waits for YouTube processing, returns a private watch link, and exposes a separate explicit publish command. Local media remains the source of truth for artifact downloads.

The recommended release is one episode at a time: reliable MP4 selection/replacement, visible local and YouTube stage progress, honest cancellation/retry/recovery, private-first staging, editable title validation, approximate hashtag-result lookup, explicit public publishing, and inclusion of `trailer.mp4` in the existing ZIP. The main risks are duplicate or stale jobs after replacement/retry, confusing upload completion with YouTube readiness, accidental public release, quota exhaustion, and credential leakage. Persist source fingerprints and provider IDs, use compare-and-swap state updates, keep OAuth API-side, separate lifecycles, and make the publish boundary explicit.

## Key Findings

### Recommended Stack

Keep Angular 15, TypeScript 4.8, RxJS, Bootstrap, and the existing `HttpClient`/`ApiService`/auth-interceptor boundary. The browser already supports multipart upload progress and abort through `HttpClient`; no upload library, YouTube SDK, file-saver package, or framework upgrade is justified.

**Core technologies:**

- Existing Angular `HttpClient` + RxJS: local MP4 progress, abort, polling teardown, retry, and replacement UI.
- API-side `googleapis` client plus existing `google-auth-library`: official YouTube Data API v3 access using the existing refresh-token pattern; pin a compatible version and keep credentials server-side.
- Node file streams: stream `episodes/{episodeId}/trailer.mp4` without loading a large file into memory.
- SQLite/repository job pattern: persist YouTube state, source hash/version, provider video ID, progress, errors, and deduplication data independently from `artifact_jobs`.
- Existing artifact service and native authenticated Blob download: extend the canonical `trailer-video` selector; do not add a second download route or client ZIP implementation.

Important provider constraints: initial upload is `privacyStatus=private`; processing must be polled separately; publishing uses an explicit `videos.update`; `search.list` is quota-limited and returns an approximate `totalResults`; YouTube titles are limited to 100 characters and reject `<`/`>`.

### Expected Features

**Must have (v1.2 table stakes):**

- Final `.mp4` picker in New Episode → File Management with filename/size, progress, cancel, retry, and safe replacement.
- Last-known-good preservation and duplicate protection across upload/retry/double-click/refresh paths.
- Persisted API-owned YouTube upload/processing job with stage-aware progress, recoverable errors, status polling, and honest cancellation boundaries.
- Private YouTube draft, returned watch link/video status, and explicit confirmed Publish action only after processing is ready.
- Editable title with live counter and shared API/UI validation for 100 Unicode characters and forbidden characters.
- One normalized hashtag lookup, debounced/cached server-side, labeled as estimated public results with timestamp and unavailable/error state.
- Existing artifact modal updated to expose the already-supported `trailer-video` selector and include `trailer.mp4` in the authenticated ZIP.
- Normal auth and `authBypass` compatibility, with no Google credentials or direct provider calls in Angular.

**Should have (good v1.2 differentiators):**

- Unified stage timeline: local upload → staged → YouTube upload → processing → private-ready → published.
- Replace warning explaining that local replacement does not replace an existing YouTube video; mark sync `manual-sync-required`.
- Copy-link action, cached-count timestamp, normalized processing failure reason, and job recovery after page reload.
- Resumable transfer between API and YouTube, including session/range recovery and bounded backoff.

**Defer (v2+ / explicit non-goals):**

- Browser-to-YouTube upload, browser-side OAuth/API keys, or a second auth model.
- Browser-resumable upload protocol between Angular and API unless real operational evidence requires it.
- Automatic YouTube replacement/publication on every local replacement.
- Scheduling, batch publishing, playlists, thumbnails, captions, analytics, publish history, and multi-episode operations.
- Separate MP4 download, client-side ZIP generation, arbitrary paths, and artifact-download redesign.

### Architecture Approach

Use separate backend-owned lifecycles with a thin Angular orchestration layer. The existing local upload endpoint remains the atomic staging/promotion boundary. A new `youtube_trailer_jobs` model owns provider upload, processing, retry, recovery, and cancellation; `artifact_jobs` remains for ZIP preparation. Publishing is a separate authenticated mutation. The UI renders API snapshots and must ignore stale job responses when the episode’s current trailer version no longer matches.

**Major components:**

1. **Local trailer upload route/service** — validate MP4 and size, stream to staging, atomically promote, preserve the old final file on failure, and mark existing YouTube sync as requiring action after replacement.
2. **YouTube provider adapter/worker** — server-side OAuth, resumable `videos.insert` as private, processing polling, provider error normalization, safe backoff, and session/video reconciliation.
3. **YouTube job repository/routes** — active-job deduplication, source hash/version binding, persisted state, status/cancel/retry/publish endpoints, startup recovery, retention, and compare-and-swap updates.
4. **Hashtag/title API** — normalize one hashtag, proxy `search.list`, cache/debounce/rate-limit, return approximate count metadata, and authoritatively validate/persist the title.
5. **Angular Manage workflow** — local upload controls, stage/status timeline, title/count/link/publish controls, polling and stale-response protection through `ApiService`.
6. **Artifact catalog/download path** — add the frontend `trailer-video` selector/definition while retaining server-derived `trailer.mp4`, authenticated ZIP preparation, and existing native download behavior.

### Critical Pitfalls

1. **Cancellation is not rollback.** Browser abort only proves the request was canceled locally; the API or YouTube may have accepted bytes. Keep the old final file, clean staging, persist cancellation boundaries, and reconcile any provider video before retrying.
2. **Replacement races create stale publication.** Bind every job to episode ID plus trailer source hash/version and apply completion conditionally. A stale worker must not overwrite the current link, title, or sync status.
3. **Upload completion is not YouTube readiness.** Keep upload, processing, private-ready, and public states distinct. YouTube processing estimates may move backward; expose stage labels and bounded presentation progress.
4. **Retries must not mean `videos.insert` again.** Persist resumable session/video ID, reconcile lost responses, resume when safe, and require explicit replacement/manual cleanup when the provider resource is uncertain.
5. **Public publishing and credentials need hard boundaries.** Insert private, require a separate Publish confirmation and server authorization, store/ redact OAuth secrets and session URIs API-side, and handle reauthorization as a terminal recoverable state.
6. **Quota and hashtag semantics are easy to misuse.** Poll with backoff, stop at terminal states, debounce/cache searches, and label `totalResults` as an approximate public-result estimate rather than an exact count.
7. **Artifact inclusion is not merely a checkbox.** Resolve only the canonical server path, snapshot source evidence, require finalized media, and prevent stale/staging/failed uploads from becoming downloadable artifacts.

## Recommended v1.2 Scope and Non-Goals

The release should ship one final MP4 per episode through this explicit flow:

```text
select/replace local MP4
  → upload with progress/cancel/retry
  → final atomic promotion
  → start or resume API-owned YouTube job
  → private upload + YouTube processing
  → private link and editable title
  → explicit public Publish
  → existing ZIP includes current trailer.mp4
```

Do not make local replacement and public YouTube state one transaction. A successful replacement may intentionally leave an older YouTube video unchanged and marked for manual synchronization. A canceled or failed transfer must not replace the final local artifact or advertise artifact availability.

## Implications for Roadmap

### Phase 1: Contract, Data Model, and Operational Preconditions

**Rationale:** The new behavior depends on API contracts and deployment facts that cannot be safely inferred by the frontend. Lock these before UI work.

**Delivers:** YouTube job schema/repository, episode DTO/sync semantics, state machine, source hash/version and active-job deduplication, OpenAPI routes, OAuth scope/channel checks, API/proxy file limits, quota/error policy, and startup recovery/retention rules.

**Addresses:** Feature dependencies for durable progress, replacement safety, retry, reload recovery, and publish authorization.

**Avoids:** Route drift, duplicate jobs, stale writes, credential exposure, proxy rejection, and accidental assumption that existing metrics OAuth is sufficient for upload/update scopes.

### Phase 2: Provider Adapter and API Worker

**Rationale:** YouTube transfer and processing are the highest-risk dependency. Build and fake-test the provider boundary before wiring operator controls.

**Delivers:** Server-side resumable private upload, persisted session/video ID, byte progress, processing polling with backoff, provider error mapping, cooperative cancel, reconciliation after restart/lost response, retry rules, and explicit private-ready state.

**Uses:** `googleapis`, existing OAuth refresh helper, Node streams, SQLite job persistence.

**Avoids:** Browser OAuth, memory-heavy reads, false 100% progress, replayed inserts, and treating a private video as publishable before processing completes.

### Phase 3: API Commands and Hashtag/Title Contract

**Rationale:** Once the worker state is real, expose stable commands and validation for the web client.

**Delivers:** Start/status/cancel/retry job routes, explicit publish route with idempotent privacy reconciliation, hashtag-count proxy/cache, normalized result metadata, title validation/suggestion contract, `no-store` status responses, and authorization/error responses.

**Addresses:** Private-first publishing, approximate count semantics, title safety, quota controls, and publish retry behavior.

**Avoids:** Implicit publication, exact-count claims, partial metadata overwrite, unbounded polling, and exposing provider response/credential details.

### Phase 4: New Episode Local Upload and YouTube Workflow UI

**Rationale:** Implement the Angular vertical slice after the API state contract is fixed; keep the existing sectioned layout and `ApiService` boundary.

**Delivers:** MP4 picker, byte progress, cancel/retry/replace controls, last-known-good messaging, job polling, stage timeline, private link/privacy/processing states, editable 100-character title, explicit Publish confirmation, estimated hashtag count/timestamp, stale-response protection, auth/bypass compatibility, and accessible error/recovery states.

**Avoids:** Modal/component-owned HTTP, transient-only job state, late responses overwriting edits, misleading unified percentages, and controls that imply cancellation or publication guarantees the API cannot provide.

### Phase 5: Artifact Integration and Recovery Verification

**Rationale:** The artifact path is mostly existing functionality but must be verified against the new replacement and availability lifecycle.

**Delivers:** Frontend `trailer-video` selector/type/catalog mapping, availability based on finalized local media, ZIP inclusion of `trailer.mp4`, and end-to-end validation for cancel/failure/replacement, stale jobs, restart, provider errors/quota, publish timeout/retry, auth modes, and native download behavior.

**Avoids:** Client path selection, stale video inclusion, failed staging becoming downloadable, and declaring success from a green build or happy path alone.

### Phase Ordering Rationale

- Persisted state and provider contracts precede frontend controls because cancellation, retry, and stale-result behavior are API semantics.
- Provider upload/processing precedes publish UI because `ready-to-publish` must be a real server state, not a client guess.
- Hashtag/title work can be delivered alongside API commands but must remain independent from the upload job so late search results cannot overwrite operator edits.
- Artifact integration comes after local promotion semantics are verified; it consumes the current finalized file and should not become coupled to YouTube state.
- Recovery and release gates span every phase: duplicate starts, browser cancel, lost provider response, replacement during processing, API restart, credential revocation, quota errors, auth/bypass, and `npm run build`.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Exact API route/DTO names, OAuth scope and channel model, audit/private-only status, local MP4 maximum, reverse-proxy limits/timeouts, publish authorization, cleanup/retention, and Unicode counting policy.
- **Phase 2:** Actual `googleapis` resumable progress/cancellation surface, session persistence/recovery, provider fake/integration test strategy, and processing terminal-state mapping.
- **Phase 3:** Quota allocation for the deployment, search region/language semantics, title metadata preservation on `videos.update`, and idempotent publish behavior.
- **Phase 5:** Live recovery matrix, restart/reopen behavior, artifact snapshot timing, CORS header exposure, and a correctly matched episode fixture.

Phases with mostly standard repository patterns (limited research needed):

- **Phase 4 local upload controls:** existing Angular `HttpClient` progress/abort, `ApiService`, Manage component state, and Bootstrap layout are established patterns once the API contract is fixed.
- **Phase 5 selector wiring:** existing artifact job polling/native Blob download can be extended without a new download architecture.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing frontend/API stack is directly known; official Google documentation supports the server-side client, resumable protocol, quotas, scopes, and limits. Exact package version and deployed Node compatibility remain to confirm. |
| Features | MEDIUM-HIGH | Existing local trailer/artifact contracts are strong and the user workflow is clear; route names, cancellation guarantees, OAuth account model, and some UX policy choices remain unresolved. |
| Architecture | MEDIUM-HIGH | Local code boundaries and API patterns are inspected; the YouTube job schema/worker is a recommended design, not an implemented contract. |
| Pitfalls | HIGH | Failure modes are concrete and repeatedly supported by provider documentation and existing job/media patterns; production behavior still needs tests. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Confirm the deployment’s Google OAuth scopes, authorized channel, refresh-token provisioning, and YouTube audit/private-only status before enabling production publishing.
- Decide whether publish is available to every authenticated episode editor or requires a distinct server-side capability.
- Define exact local file size/container validation, reverse-proxy limits, worker concurrency, quota/rate limits, and cleanup/retention.
- Decide whether a provider video created before failure is retained for reconciliation/manual cleanup or automatically handled; do not assume deletion is safe.
- Define Unicode policy for title counting (code points versus grapheme clusters), including emoji, combining marks, and Portuguese diacritics, and test the same policy in UI/API.
- Decide how replacement represents the old YouTube link: retain it with `manual-sync-required`, clear it, or expose old/current linkage explicitly. Recommended: retain the link and status until a new private draft is established, while clearly warning that it may reference old bytes.
- Confirm exact route names, response status codes, active-job uniqueness, startup recovery, and artifact snapshot timing against the sibling API implementation.

## Sources

### Primary / authoritative

- Local project context: `.planning/PROJECT.md`, `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/CONFIGURATION.md`.
- Sibling API sources cited by architecture research: episode routes, trailer-video service, artifact preparation/download services, SQLite repositories, and existing YouTube metrics OAuth service.
- [YouTube Data API overview and quotas](https://developers.google.com/youtube/v3/getting-started)
- [`videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert)
- [Resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
- [`videos.update`](https://developers.google.com/youtube/v3/docs/videos/update)
- [`videos.list` and processing implementation](https://developers.google.com/youtube/v3/guides/implementation/videos)
- [`search.list`](https://developers.google.com/youtube/v3/docs/search/list)
- [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos)
- [Server-side OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) and [OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

### Secondary

- [Official Google APIs Node.js client](https://github.com/googleapis/google-api-nodejs-client) — Node client and OAuth integration.
- [YouTube hashtag help](https://support.google.com/youtube/answer/6390658) — public hashtag result semantics.
- [Angular `HttpClient`](https://angular.dev/api/common/http/HttpClient) and [MDN upload events](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) — browser progress/abort behavior.

---
*Research completed: 2026-08-03*
*Ready for roadmap: yes*
