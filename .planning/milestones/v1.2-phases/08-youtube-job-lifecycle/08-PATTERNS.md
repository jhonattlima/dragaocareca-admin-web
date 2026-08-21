# Phase 8: YouTube Job Lifecycle - Pattern Map

**Mapped:** 2026-08-11  
**Files analyzed:** 13 likely new/modified files across web and sibling API  
**Analogs found:** 13 / 13 (frontend role analogs and backend exact implementation analogs)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/core/api.service.ts` | service / DTO boundary | request-response | `src/app/core/api.service.ts` artifact wrappers, lines 367-373 | exact |
| `src/app/core/api.service.spec.ts` | test | request-response | artifact job tests, lines 7-61 | exact |
| `src/app/pages/manage/manage.component.ts` | controller/page state | request-response + polling | artifact lifecycle, lines 481-537 and 1740-1803; trailer upload guards, lines 1974-2067 | exact |
| `src/app/pages/manage/manage.component.html` | component template | request-response presentation | artifact modal, lines 105-179 | role-match |
| `src/app/pages/manage/episode-form.component.html` | component template | request-response presentation | trailer-video card, lines 8-99 | exact |
| `src/app/pages/manage/manage.component.spec.ts` | test | polling/state-machine | artifact tests, lines 182-436; trailer lifecycle tests, lines 438-609 | exact |
| `../dragaocareca-admin-api/src/routes/episodes.routes.ts` | route/controller | authenticated request-response | artifact routes, lines 639-715; YouTube routes, lines 768-845 | exact |
| `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` | service/state machine | file I/O + event-driven worker orchestration | exact Phase 8 implementation, lines 102-170 and 233-357 | exact |
| `../dragaocareca-admin-api/src/services/youtube-trailer-upload.provider.ts` | provider adapter | streaming/file-I/O + request-response | exact private resumable provider adapter, lines 155-216 | exact |
| `../dragaocareca-admin-api/src/workers/youtube-trailer-job.worker.ts` | worker | event-driven/batch polling | exact worker loop, lines 17-57 | exact |
| `../dragaocareca-admin-api/src/database/repositories/youtube-trailer-job.repository.ts` | repository/model | CRUD + CAS/lease state transitions | exact durable row/repository, lines 42-110 and 269-439 | exact |
| `../dragaocareca-admin-api/src/scripts/verify-youtube-trailer-job-lifecycle.ts` | integration verifier | batch/event-driven lifecycle | exact lifecycle verifier, lines 170-390 | exact |
| `../dragaocareca-admin-api/src/docs/openapi.ts` | config/contract | request-response schema | exact public DTO and route contract, lines 92-125 and 928-963 | exact |

The likely implementation set is primarily the six web files plus any sibling API files needed to resolve the contract risks below. Do not add a browser provider, OAuth client, resumable upload loop, or global store.

## Temporal Contract Boundary

The source inspection below distinguishes the verified Phase 7 baseline from the planned Phase 8 contract. The current web/API source has the existing start/status/cancel route family, an empty start body, no current-job lookup, no retry route, and no `privateWatchUrl`. Phase 8 adds the metadata-bearing `{title, summary}` start body, authenticated current-job lookup and same-job retry endpoints, and the sanitized `privateWatchUrl` field when known. Snippets showing the empty body or the existing route family are baseline analogs only; they are not the Phase 8 target.

## Pattern Assignments

### `src/app/core/api.service.ts` (service, request-response)

**Analog:** existing artifact job wrappers, lines 367-373.

Copy the typed-wrapper shape and keep all provider behavior behind the API:

```typescript
startEpisodeArtifactJob(episodeId: number, artifacts: EpisodeArtifactSelector[]): Observable<EpisodeArtifactJobSnapshot> {
  return this.http.post<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs`, { artifacts });
}

getEpisodeArtifactJobStatus(episodeId: number, jobId: string): Observable<EpisodeArtifactJobSnapshot> {
  return this.http.get<EpisodeArtifactJobSnapshot>(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs/${jobId}`);
}
```

The existing baseline start wrapper uses an empty object because the current source route accepts no metadata. Preserve that example only as a baseline reference; the planned Phase 8 wrappers are:

```typescript
startYoutubeTrailerJob(episodeId: number, title: string, summary: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.post<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs`, { title, summary },
  );
}

getCurrentYoutubeTrailerJob(episodeId: number): Observable<YoutubeTrailerJobSnapshot | null> {
  return this.http.get<YoutubeTrailerJobSnapshot | null>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/current`,
  );
}

getYoutubeTrailerJobStatus(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.get<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}`,
  );
}

retryYoutubeTrailerJob(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.post<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}/retry`, {},
  );
}

cancelYoutubeTrailerJob(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.post<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}/cancel`, {},
  );
}
```

Use a public DTO containing only `jobId`, `episodeId`, `status`, nullable sanitized `privateWatchUrl`, `progress`, `cancellation`, `error`, `retry`, timestamps, and completion time. Never add `sessionUri`, `providerVideoId`, source hash/path/name, raw error message/reason, OAuth material, or worker lease fields.

### `src/app/core/api.service.spec.ts` (test, request-response)

**Analog:** lines 25-61 for artifact start/status and lines 109-170 for exact request assertions.

Add `HttpTestingController` assertions for:

- `POST /episodes/42/youtube-trailer-jobs`, metadata body `{title, summary}`, typed response, and `202`/`200` behavior at the HTTP boundary.
- `GET /episodes/42/youtube-trailer-jobs/job-42`.
- `POST /episodes/42/youtube-trailer-jobs/job-42/cancel`, empty body `{}`.
- DTO fixtures for `queued`, `transferring`, `processing`, `ready`, `failed`, `cancel_requested`, `cancelled`, and `obsolete`.

The route currently calls backend states `transferring` and `ready`; the UI labels them `uploading` and `private-ready`. Preserve the raw typed API state and perform presentation mapping in `ManageComponent`.

### `src/app/pages/manage/manage.component.ts` (controller, request-response + polling)

**Analogs:** artifact lifecycle lines 481-537 and 1740-1803; trailer source-generation guard lines 1974-2067; teardown lines 327-351.

Keep YouTube job state separate from `TrailerVideoState` and local MP4 upload progress. A suitable component-local shape should retain:

```typescript
type YoutubeTrailerJobStatus = /* exact API status union */;

interface YoutubeTrailerJobState {
  snapshot: YoutubeTrailerJobSnapshot | null;
  episodeId: number | null;
  jobId: string | null;
  sourceGeneration: number;
  pollingTimer: number | null;
  startInFlight: symbol | null;
  error: string;
}
```

Use the artifact start guard to prevent duplicate clicks:

```typescript
if (this.artifactJobStartInFlight.has(episodeId)) return;
const startToken = Symbol(`artifact-job-start-${episodeId}`);
this.artifactJobStartInFlight.set(episodeId, startToken);
this.apiService.startEpisodeArtifactJob(episodeId, artifacts).subscribe({
  next: (snapshot) => {
    if (this.artifactJobStartInFlight.get(episodeId) === startToken) {
      this.artifactJobStartInFlight.delete(episodeId);
    }
    this.storeArtifactJob(snapshot);
    this.ensureArtifactJobPolling(episodeId, snapshot.jobId);
  },
  error: () => { /* clear the same token and surface a safe message */ },
});
```

Adapt it to a YouTube job map keyed by episode ID, but rely on backend create-or-reuse for correctness across reloads/tabs/API restarts. Only allow start when `editor.formModel.trailerVideoFileName` is finalized and the selected editor episode matches the target episode.

Polling should copy `ensureArtifactJobPolling` (lines 1762-1787): immediately refresh, then `window.setInterval(refresh, 2000)`, retain episode/job IDs, ignore snapshots whose stored job ID no longer matches, and clear on terminal state. Add the trailer source generation to the guard because artifact polling has no source-fingerprint concern while YouTube does.

Teardown must extend `ngOnDestroy` and `resetEditor` patterns (lines 334-351 and 1382-1395): clear interval, unsubscribe any in-flight request if represented by a `Subscription`, invalidate the generation, and stop polling on MP4 replacement, editor reset, episode switch, terminal state, cancellation request, or component destroy. Cancellation stops browser work but must leave the returned durable cancellation snapshot visible.

Presentation mapping should be explicit:

| API status | Operator label | Progress |
|---|---|---|
| `queued`, `claimed` | Queued | no transfer percentage required |
| `transferring` | Uploading to YouTube | `confirmedBytes / totalBytes` only |
| `processing` | Processing on YouTube (private) | indeterminate unless valid provider parts are present |
| `ready` | Private-ready | never “published” |
| `failed` | Failed: normalized category | retry only when contract says available |
| `cancel_requested` | Cancellation requested | provider work may still finish |
| `cancelled` + `local-cancelled` | Canceled | local cancellation completed |
| `cancelled` + `provider-video-retained` | Reconciliation required | do not claim remote deletion |
| `obsolete` | Trailer replaced | stale job must not control the current source |

Use safe operator categories, `retry.nextAttemptAt`, and `cancellation.boundary`; do not display raw `error.message` because it is intentionally omitted from the DTO.

Reload recovery is the largest frontend seam: `listEpisodes()` returns no YouTube job ID/snapshot. The status endpoint requires both `episodeId` and `jobId`, so the planner must either extend the episode/list DTO with a safe current-job reference or add an authenticated current-source job lookup before claiming full reload recovery.

### `src/app/pages/manage/episode-form.component.html` (component, request-response presentation)

**Analog:** existing File Management section lines 8-99, especially the dedicated trailer-video card lines 48-74.

Add a separate section/card for the finalized trailer’s YouTube lifecycle. Reuse the established bindings through `controller` and `editor`; do not merge YouTube progress into the MP4 card. The action should be disabled unless the trailer filename is finalized, and the UI should expose Start, Retry (only when allowed), and Cancel (only while locally actionable). Use `aria-live="polite"` for state changes and an indeterminate bar for `processing` unless the snapshot contains a valid parts ratio.

The card must say “private”/“private-ready” and include cancellation copy for `provider-video-retained`. No public publish controls, title/hashtag authoring, or provider identifier/link belongs in this template during Phase 8.

### `src/app/pages/manage/manage.component.html` (component, request-response presentation)

**Analog:** artifact modal lines 105-179.

The page shell passes the complete editor/controller into `app-episode-form` at lines 7-16, so the lifecycle UI belongs in `episode-form.component.html` unless a list-level status is explicitly required. Keep the sectioned operator layout and use the artifact modal’s conventions for status panel, retry action, inline safe error, and terminal-state copy. Do not introduce a global dashboard/store or flatten the existing form-first layout.

### `src/app/pages/manage/manage.component.spec.ts` (test, polling/state machine)

**Analogs:** summary polling tests lines 44-180; artifact interaction tests lines 182-436; trailer generation/retry tests lines 438-609.

Add focused tests for:

- start eligibility only after finalized `trailerVideoFileName`;
- duplicate click protection and backend-reused job snapshot;
- state mapping: `transferring` → upload percentage, `processing` → indeterminate, `ready` → private-ready;
- immediate poll plus interval teardown on `ready`, `failed`, and `cancelled`;
- retry availability and `nextAttemptAt` copy;
- cancel request stops local polling and shows `cancel_requested`, then distinguishes `local-cancelled` from `provider-video-retained`;
- reload restoration once the chosen current-job lookup/reference seam exists;
- MP4 replacement increments generation/clears the old job view and ignores late old snapshots;
- safe error category rendering without raw provider fields.

The summary analog demonstrates stale-editor protection and terminal cleanup:

```typescript
if (editor.formModel.episodeId !== episodeId) {
  this.clearEpisodeGenerationPolling();
  return;
}
...
if (status.status === 'done' || status.status === 'error') {
  this.clearSummaryStatusPolling();
}
```

The artifact analog demonstrates job-ID protection:

```typescript
if (this.artifactJobs[episodeId]?.jobId !== jobId) return;
this.storeArtifactJob(snapshot);
```

### `../dragaocareca-admin-api/src/routes/episodes.routes.ts` (route, request-response)

**Analog:** existing route surface, lines 768-845; Phase 8 extends this baseline contract.

Route seams to preserve:

```text
POST /v1/episodes/:episodeId/youtube-trailer-jobs
GET  /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId
POST /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId/cancel
GET  /v1/episodes/:episodeId/youtube-trailer-jobs/current     # planned Phase 8 addition
POST /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId/retry # planned Phase 8 addition
```

The verified current source has the three baseline routes, an empty start body, and no current/retry routes or `privateWatchUrl`. The planned Phase 8 route contract applies `noStoreYoutubeTrailerJobs` and `requireAuth` to all five routes. Start will validate positive integer episode ID plus `{title, summary}`, call `createYoutubeTrailerJob` with server-derived source and accepted metadata, set `Location`, return `202` for newly queued or `200` for a reused active job, and return `404` when the canonical final trailer is missing. Current/status/retry/cancel will validate their bindings, return safe 404s for unknown/mismatched jobs, and keep retry/cancel control bodies empty where specified.

Retain the sibling API publish route and verify repeated requests are idempotent per OPS-03. Do not add Angular publish controls in Phase 8; broader publication workflow remains Phase 9/10 scope.

### `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` (service, file-I/O + event-driven)

**Analog:** canonical implementation, lines 21-80, 102-170, 189-231, 233-317, and 333-357.

Copy these backend boundaries:

- `fingerprintYoutubeTrailerSource()` hashes the canonical final MP4 with SHA-256 and records relative filename and byte size (lines 102-115).
- `createYoutubeTrailerJob()` fingerprints first, obsoletes prior-source active jobs, then calls repository `createOrReuse()` (lines 313-317).
- `obsoleteIfSourceChanged()` prevents old workers from touching a replacement (lines 130-145).
- `recordProviderFailure()` stores normalized category and bounded retry timing, then requeues the same row when retryable (lines 158-170).
- `transferPrivateSource()` always reconciles persisted `providerVideoId`/`sessionUri` before starting anything new (lines 240-306).
- `pollPrivateProcessing()` marks ready only when privacy is private, upload is processed, and processing succeeded (lines 203-231).
- `toYoutubeTrailerJobStatusDto()` is an explicit allowlist; preserve its sensitive-field exclusions (lines 50-80).

The service’s internal state (`claimed`, `transferring`, `ready`, `cancel_requested`, etc.) is more detailed than the operator labels. Keep this distinction at the DTO/UI seam.

### `../dragaocareca-admin-api/src/services/youtube-trailer-upload.provider.ts` (provider, streaming/file-I/O)

**Analog:** canonical provider adapter, lines 112-216.

Provider operations remain API-only: readiness check, private resumable session, authoritative range reconciliation, chunk upload, processing poll, and cancellation. `beginPrivateSession()` sends `privacyStatus: "private"`; `resumeRange()` and `uploadChunk()` return confirmed bytes/provider ID; `pollProcessing()` returns nullable provider processing fields; failures normalize to bounded categories. Angular must never import Google OAuth/YouTube SDKs or send chunks directly.

### `../dragaocareca-admin-api/src/workers/youtube-trailer-job.worker.ts` (worker, event-driven/batch)

**Analog:** canonical worker, lines 17-57.

Use the single active run guard and startup recovery pattern:

```typescript
if (activeRun) return activeRun;
activeRun = (async () => {
  await runYoutubeTrailerJobWorkerOnce({ provider, recoverInterrupted: !recoveredAtStartup });
  recoveredAtStartup = true;
})().finally(() => { activeRun = null; });
```

The worker calls `initializeYoutubeTrailerJobs()` once, processes one recovery candidate per run, and polls on the configured interval. Preserve bounded retry and do not introduce a second provider worker in the web application.

### `../dragaocareca-admin-api/src/database/repositories/youtube-trailer-job.repository.ts` (repository/model, CRUD + CAS/lease)

**Analog:** canonical row and repository, lines 42-110, 240-299, and 302-439.

The durable row stores source identity (`episodeId`, relative filename, SHA-256, bytes), lifecycle state, revision, worker lease/heartbeat, session URI, confirmed bytes, provider processing metadata, retry/error fields, cancellation boundary, and timestamps. Provider/session identifiers are persistence-only.

Use `createOrReuse()` + `findActive()` (lines 269-288) for duplicate safety. Use the CAS predicate in `updateWithLease()` (lines 240-249), which requires job, episode, source filename/hash/bytes, revision, lease ID, and allowed status. `recoverInterrupted()` (314-325), `retry()` (406-417), and `obsoletePriorSource()` (428-439) are the patterns for restart recovery, same-row retry, and source replacement. Late writes must return null rather than update an obsolete source.

### `../dragaocareca-admin-api/src/scripts/verify-youtube-trailer-job-lifecycle.ts` (test/verifier, batch/event-driven)

**Analog:** exact offline verifier, lines 170-217, 219-315, and 331-390.

Retain/extend scenarios for:

- duplicate source starts coalescing to one job;
- stale revision writes rejected;
- source replacement obsoleting the old job and rejecting late worker writes;
- resumable range recovery and provider video reuse;
- cancellation before acceptance → `local-cancelled`;
- cancellation after accepted bytes/provider ID → `provider-video-retained`;
- restart recovery and OAuth readiness failure remaining retryable;
- protected route/auth, strict body validation, episode/job mismatch, safe DTO omission, `Location`, no-store, and OpenAPI schema assertions.

The verifier explicitly checks omitted `sessionUri`, `providerVideoId`, source fields, worker lease, raw error message, and raw error reason (lines 363-387). Add quota/timeout normalization coverage if those categories remain in the Phase 8 acceptance contract.

### `../dragaocareca-admin-api/src/docs/openapi.ts` (config/contract, request-response)

**Analog:** `YoutubeTrailerJobSnapshot` schema lines 92-125 and route docs lines 928-963.

The public schema allows internal statuses `queued`, `claimed`, `transferring`, `processing`, `ready`, `failed`, `cancel_requested`, `cancelled`, and `obsolete`; nested progress contains confirmed/total bytes and nullable processing parts/time; cancellation boundary is `local-cancelled` or `provider-video-retained`; error exposes category/time only; retry exposes count/next attempt; accepted title/summary are persisted as internal job input; and `privateWatchUrl` is the only provider-derived link exposed when known. Route docs specify authenticated no-store behavior, metadata-bearing start, current lookup, same-job retry, and API publish idempotency.

Planner must decide whether to preserve these exact DTO names or add a safe UI-facing mapping/reference. Do not change the OpenAPI contract to expose provider ID, session, raw errors, source fingerprint, filesystem path, or a public URL in this phase.

## Shared Patterns

### Authentication and cache behavior

**Sources:** `src/app/core/auth.interceptor.ts`, `src/app/core/api.service.ts`, sibling routes 771-845 and OpenAPI 928-963.  
**Apply to:** all browser wrappers and API routes.

The Angular interceptor supplies the bearer token; `authBypass` remains a local auth toggle only. API job routes use `requireAuth` and `noStoreYoutubeTrailerJobs`. Do not put provider OAuth in environment files or browser DTOs.

### Thin frontend / backend-owned lifecycle

**Sources:** `docs/ARCHITECTURE.md`; sibling service/provider/worker.  
**Apply to:** all Phase 8 files.

Angular owns action enablement, polling, progress labels, cancellation copy, retry affordances, and stale-generation guards. The API owns final-source fingerprinting, persistence, idempotency, resumable transfer, provider polling, cancellation boundary, retry scheduling, and reconciliation.

### Polling and teardown

**Sources:** `manage.component.ts` lines 1614-1721 and 1762-1803.  
**Apply to:** YouTube Manage state.

Use immediate refresh + 2-second interval, one tracked timer per active flow, endpoint error surfaced as a safe retrying status, response guard by episode/job/source generation, and cleanup from terminal states/reset/destroy. Never leave the polling interval tied only to whether the form is visible.

### Honest progress

**Sources:** API DTO/OpenAPI progress fields and `episode-form.component.html` lines 48-89.  
**Apply to:** YouTube card.

Only `confirmedBytes / totalBytes` represents transfer progress. Provider processing fields may be null; use indeterminate UI unless both parts values are valid. `ready` means private-ready, not public or published.

## No Analog Found

No role lacked an implementation analog. However, these specific seams are not complete enough to copy without a product/API decision:

| Seam | Evidence | Risk |
|---|---|---|
| Retry API | repository/service requeue failed rows, but route surface has only start/status/cancel | UI Retry may need safe re-POST start or a dedicated retry endpoint |
| Reload discovery | status route requires `episodeId + jobId`; `Episode` list DTO has no current YouTube job reference | browser cannot restore a job after reload from existing `listEpisodes()` alone |
| YOUTUBE-01 metadata | start accepts selected/current title and summary; richer title authoring remains later | persist accepted values as job input and pass them to provider; Phase 9 owns richer authoring/validation |
| YOUTUBE-02 safe link | Phase 8 DTO exposes no provider ID but returns sanitized `privateWatchUrl` once known | validate URL construction and omit raw provider/session fields |
| Cancellation reconciliation action | backend returns `provider-video-retained` and may return private URL | Phase 8 provides status/link/guidance only; no automatic deletion or publication |
| Status vocabulary | locked UI states use `uploading`, `private-ready`, `canceled`; API uses `transferring`, `ready`, `cancelled` plus internal states | exact mapping and whether `obsolete` is browser-visible need tests/contract decision |
| Failure categories | provider has configuration/authorization/retryable/unrecoverable/session-expired; requirements name quota/timeout/network/provider/invalid trailer | category normalization and safe copy need explicit acceptance fixtures |

## Key Unresolved Pattern Risks

1. Do not plan “reload recovery” until the API exposes a safe current-source job reference or lookup. A job ID held only in component memory cannot satisfy D-07.
2. Do not implement Retry as a new job creation path. The backend’s safe pattern is same-row/provider-session reconciliation; the explicit retry route preserves it.
3. Accept basic title/summary in Phase 8 job start and expose only sanitized `privateWatchUrl`; Phase 9 owns richer metadata authoring/validation and Phase 9/10 owns publication UI.
4. Keep `cancel_requested` visible while remote work may continue, and treat `provider-video-retained` as reconciliation-required. Phase 8 provides status/link/guidance only; it does not delete or publish.
5. Preserve source identity guards on both worker and browser. Episode ID/job ID alone is insufficient after a finalized MP4 replacement.
6. Add frontend tests for the new mapping and teardown paths; existing tests cover artifact/trailer analogs but no YouTube API or Manage lifecycle yet.

## Metadata

**Analog search scope:** `src/app/core`, `src/app/pages/manage`, and sibling `../dragaocareca-admin-api/src/{routes,services,workers,database/repositories,scripts,docs}`.  
**Files scanned:** 13 primary analogs plus project docs and existing specs.  
**Pattern extraction date:** 2026-08-11
