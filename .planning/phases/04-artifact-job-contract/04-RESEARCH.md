# Phase 4: Artifact Job Contract - Research

**Researched:** 2026-07-28
**Domain:** Express/TypeScript artifact resolution, asynchronous ZIP jobs, authenticated polling and download
**Confidence:** MEDIUM

## User Constraints

No phase-specific `*-CONTEXT.md` exists. The following constraints are locked by the project and milestone documents:

- `[VERIFIED: codebase grep]` Keep ZIP creation and artifact resolution in the backend; Angular remains a thin API orchestrator.
- `[VERIFIED: codebase grep]` Do not accept arbitrary filesystem paths; resolve artifacts from an episode identity and an allowlisted selector set.
- `[VERIFIED: codebase grep]` Respect backend `AUTH_BYPASS` and frontend `authBypass` behavior.
- `[VERIFIED: codebase grep]` Preserve the existing Angular 15 / TypeScript 4.8 / Bootstrap 5.3.8 stack.
- `[VERIFIED: codebase grep]` Keep the existing sectioned, legacy-inspired episode-management layout.
- `[VERIFIED: codebase grep]` `npm run build` must remain green in the frontend repository.
- `[VERIFIED: codebase grep]` Phase scope is API-01 through API-05 and VAL-04; UI modal and browser delivery details belong to Phases 5-6.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | Start a ZIP-generation job for one episode using selected artifact keys. | Existing episode route and selector parser are verified; async start route is a required backend extension described below. |
| API-02 | Report progress percentage with pending, processing, completed, and failed states. | Existing transcription/worker state pattern supplies the reusable lifecycle shape; artifact job persistence and worker polling are recommended. |
| API-03 | Return the completed ZIP through an authenticated download response. | Existing protected synchronous ZIP route, `archiver` usage, and auth middleware are verified; split into status and download endpoints for the async contract. |
| API-04 | Provide a safe filename and report requested artifacts that were unavailable. | Existing deterministic `Content-Disposition` filename and `X-Missing-Artifacts` behavior are verified; expose the same data in job status. |
| API-05 | Validate selectors and reject arbitrary filesystem paths. | Existing five-value selector catalog and path resolution through `getEpisodeMediaFinalPath` are verified. |
| VAL-04 | Verify creation, transitions, completion, failure, and missing artifacts. | Existing verifier covers synchronous selector/preflight/auth/ZIP cases; it must be expanded or replaced with job lifecycle assertions. |

## Summary

`/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api` already has the important artifact primitives, but not the Phase 4 asynchronous contract. `[VERIFIED: codebase grep]` `src/services/episode-artifact-download.service.ts` defines the canonical selectors, preflights only final files, and returns available/missing artifacts. `[VERIFIED: codebase grep]` `src/routes/episodes.routes.ts:430-526` currently exposes only `GET /v1/episodes/:episodeId/artifacts/download`, performs ZIP assembly during the request, and returns the ZIP stream directly. Therefore the planner must treat the current route as the implementation baseline to refactor or preserve for compatibility, not as evidence that job start/status endpoints already exist.

The API has an established in-process background pattern that is suitable for a first artifact-job implementation: queue state, process pending records serially, guard overlapping worker runs with an `activeRun` promise, and poll on a configured interval. `[VERIFIED: codebase grep]` This pattern is used by transcription and launch-notification workers. For artifact jobs, persist job metadata and status in SQLite so status survives request boundaries and can be inspected by a separate polling request; use a job-specific temporary ZIP path and deterministic archive entry names. `[ASSUMED]` The exact new route names and SQLite table shape below are recommendations because no async artifact-job symbols currently exist.

**Primary recommendation:** Add an authenticated `POST` job-start route plus authenticated status and download routes under the existing episode resource, reuse the selector/preflight/media-layout services, persist jobs in SQLite, and process them through a serialized worker with explicit cleanup/retention.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Selector validation and allowlist | API / Backend | — | `[VERIFIED: codebase grep]` The sibling API already owns `parseEpisodeArtifactSelectors`; keeping this server-side prevents path injection and vocabulary drift. |
| Episode artifact availability and path resolution | API / Backend | Database / Storage | `[VERIFIED: codebase grep]` Episode identity and media layout determine files; the browser must not supply paths. |
| Job persistence and lifecycle | Database / Storage | API / Backend | `[ASSUMED]` Status must be shared across start, polling, worker, and download requests; SQLite matches the existing backend persistence model. |
| ZIP assembly and temporary-file cleanup | API / Backend | Database / Storage | `[VERIFIED: codebase grep]` The API already uses `archiver`; filesystem access and retention belong to the backend. |
| Progress polling and user-facing state | Browser / Client | API / Backend | `[VERIFIED: codebase grep]` Angular already polls transcription/summary endpoints; it should consume job snapshots and render state without business rules. |
| Authenticated ZIP delivery | API / Backend | Browser / Client | `[VERIFIED: codebase grep]` `requireAuth` protects existing episode routes and the frontend interceptor attaches bearer tokens. |

## Current API Contract (Verified Baseline)

### Episode and artifact fields

`[VERIFIED: codebase grep]` The episode schema in `src/schemas/episode.ts:3-26` exposes these artifact-related input fields:

| Artifact | Episode field | Canonical media kind | Final relative path | Archive entry |
|----------|---------------|----------------------|---------------------|---------------|
| Episode audio | `fileName` | `audio` | `episodes/{episodeId}/audio.mp3` | `episode-{episodeId}/audio.mp3` |
| Trailer | `trailerFileName` | `trailer` | `episodes/{episodeId}/trailer.mp3` | `episode-{episodeId}/trailer.mp3` |
| Cover art | `coverFileName` | `cover` | `episodes/{episodeId}/cover.jpeg` | `episode-{episodeId}/cover.jpeg` |
| Low cover art | `coverLowFileName` | `coverLow` | `episodes/{episodeId}/cover.webp` | `episode-{episodeId}/cover.webp` |
| Transcript | `transcriptFileName` | `transcript` | `episodes/{episodeId}/transcript.txt` | `episode-{episodeId}/transcript.txt` |

`[VERIFIED: codebase grep]` `transcriptFileName` is stored in the SQLite `episodes` table and returned by `EpisodeRow`, although it is maintained by transcription services rather than the public `episodeSchema` input. `[VERIFIED: codebase grep]` `getEpisodeMediaFinalPath()` resolves the canonical final path from `(episodeId, kind)`; `preflightEpisodeArtifactDownloads()` checks that resolved path is a regular file with `lstat`.

### Canonical selectors

`[VERIFIED: codebase grep]` The only accepted selector strings in `src/services/episode-artifact-download.service.ts:4-14` are:

```text
episode      -> audio      -> audio.mp3
trailer      -> trailer    -> trailer.mp3
transcript   -> transcript -> transcript.txt
image        -> cover      -> cover.jpeg
image-low    -> coverLow   -> cover.webp
```

`[VERIFIED: codebase grep]` The current parser accepts one nonempty CSV query string, rejects empty values and unknown selectors, deduplicates repeated selectors, and returns catalog order (`episode`, `trailer`, `transcript`, `image`, `image-low`). An omitted query currently means all five selectors. The new JSON body should preserve these exact values rather than introduce UI labels such as `audio` or `cover-webp` as API selectors.

### Existing endpoint behavior

`[VERIFIED: codebase grep]` Current route: `GET /v1/episodes/:episodeId/artifacts/download?artifacts=episode,trailer`.

`[VERIFIED: codebase grep]` It requires `requireAuth`, returns `400` for invalid episode IDs/selectors, `404 {"message":"Episode not found"}` for an absent episode, and `404 {"message":"No requested artifacts found"}` when preflight finds no available file. A successful response is `200 application/zip` with `Content-Disposition: attachment; filename="episode-{episodeId}-artifacts.zip"`; partial requests add `X-Missing-Artifacts: trailer,image,image-low`. ZIP entries are rooted below `episode-{episodeId}/`, so client input never becomes an archive path.

`[VERIFIED: codebase grep]` OpenAPI documents this route in `src/docs/openapi.ts:702-762`, including bearer security, the selector enum, binary ZIP content, and the missing-artifacts header. It documents no job resource, status response, job ID, progress field, or retention behavior.

## Recommended Async Contract

The following is a prescriptive contract for planning, but the route names and response fields are not present in the current API and are therefore `[ASSUMED]` until implemented and cross-repo agreed.

### 1. Start a job

```http
POST /v1/episodes/{episodeId}/artifacts/jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "artifacts": ["episode", "image", "image-low", "transcript"]
}
```

Recommended response:

```http
202 Accepted
Location: /v1/episodes/334/artifacts/jobs/7e8c...
Content-Type: application/json
```

```json
{
  "jobId": "7e8c2d2e-...",
  "episodeId": 334,
  "requested": ["episode", "transcript", "image", "image-low"],
  "available": ["episode", "transcript"],
  "missing": ["image", "image-low"],
  "status": "pending",
  "progress": 0,
  "filename": "episode-334-artifacts.zip",
  "downloadUrl": null,
  "error": null,
  "createdAt": "2026-07-29T...Z",
  "updatedAt": "2026-07-29T...Z",
  "completedAt": null,
  "expiresAt": "2026-07-29T...Z"
}
```

`[ASSUMED]` Preflight should occur before enqueueing, so invalid selectors fail synchronously with `400`, an unknown episode returns `404`, and a request with zero available artifacts returns `404` or `422` without creating a useless job. A partial request should still create a job and retain `missing` in the immutable snapshot. The planner should select one no-artifacts status code and make the verifier assert it consistently; retaining the current `404` minimizes migration risk.

### 2. Poll status

```http
GET /v1/episodes/334/artifacts/jobs/7e8c2d2e-...
Authorization: Bearer <token>
Cache-Control: no-cache
```

```json
{
  "jobId": "7e8c2d2e-...",
  "episodeId": 334,
  "requested": ["episode", "transcript"],
  "available": ["episode", "transcript"],
  "missing": [],
  "status": "processing",
  "progress": 60,
  "filename": "episode-334-artifacts.zip",
  "downloadUrl": null,
  "error": null,
  "createdAt": "2026-07-29T...Z",
  "updatedAt": "2026-07-29T...Z",
  "completedAt": null,
  "expiresAt": "2026-07-29T...Z"
}
```

`[ASSUMED]` Status values must be exactly `pending | processing | completed | failed`, with `progress` clamped to an integer `0..100`; completed must be `100`, pending should be `0`, and failed should retain the last known progress plus a nonempty `error`. Terminal states must stop the frontend polling loop. The frontend can poll at the existing 2-second cadence used by `ManageComponent`, but that cadence is a client choice rather than an API requirement. `[VERIFIED: codebase grep]` Existing status routes set `Cache-Control: no-store`; the artifact status route should do the same.

### 3. Download completed ZIP

```http
GET /v1/episodes/334/artifacts/jobs/7e8c2d2e-.../download
Authorization: Bearer <token>
```

`[ASSUMED]` Only `completed` jobs should return `200 application/zip`. The response should use the stored safe filename in `Content-Disposition`, expose the immutable missing-artifact result either through the status response or `X-Missing-Artifacts`, and reject `pending`/`processing` with `409` and `failed` with `410` or `409`. Unknown job IDs and jobs belonging to another episode should not leak state; return `404`. The download route must re-check ownership/authorization and never accept a path or filename query parameter.

### Lifecycle sequence

```text
POST /episodes/{id}/artifacts/jobs
  -> validate episodeId + selectors
  -> preflight final paths; snapshot requested/available/missing
  -> persist pending job; enqueue
  -> 202 { jobId, status: pending, progress: 0 }

GET /episodes/{id}/artifacts/jobs/{jobId}
  -> 200 pending/processing with integer progress
  -> 200 completed with downloadUrl/filename
  -> 200 failed with error

GET /episodes/{id}/artifacts/jobs/{jobId}/download
  -> 200 streamed persisted ZIP after completed
```

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | `v24.17.0` observed locally | API runtime and filesystem/stream primitives | `[VERIFIED: environment probe]` Existing sibling API uses Node runtime APIs and SQLite `DatabaseSync`. |
| Express | `5.2.1` lockfile | HTTP routing and middleware | `[VERIFIED: codebase grep]` Existing API is an Express 5 application with route-local auth and centralized error handling. |
| TypeScript | `6.0.3` lockfile | API type safety/build | `[VERIFIED: codebase grep]` Sibling API `typecheck` and `build` use the package’s TypeScript compiler. |
| `archiver` | `8.0.0` lockfile | ZIP creation and streaming | `[VERIFIED: codebase grep]` Existing synchronous route constructs an archive with `archive.file()`, `pipe()`, and `finalize()`. |
| SQLite built-in `DatabaseSync` | Node runtime | Job persistence and existing episode storage | `[VERIFIED: codebase grep]` `src/database/sqlite.ts` owns the SQLite schema and WAL mode. |
| `zod` | `4.4.3` lockfile | Request validation | `[VERIFIED: codebase grep]` Existing episode routes parse bodies with `episodeSchema`; reuse the same validation style for job bodies. |

### Supporting

| Library / API | Version | Purpose | When to Use |
|---------------|---------|---------|-------------|
| `crypto.randomUUID()` | Node built-in | Opaque job IDs | `[ASSUMED]` Use for non-guessable job identifiers without adding a package. |
| `fs/promises` | Node built-in | Preflight, temporary ZIP writes, cleanup | `[VERIFIED: codebase grep]` Existing media and artifact services already use it. |
| `setInterval` plus an `activeRun` promise | Existing pattern | Worker polling and overlap prevention | `[VERIFIED: codebase grep]` Used by `src/services/episode-transcription.service.ts` and `src/workers/launch-notification.worker.ts`. |

**Installation:** No new package is required for the recommended design. `[VERIFIED: codebase grep]` `archiver`, `zod`, Express, and TypeScript are already in the API dependency/lock files.

## Package Legitimacy Audit

No external package installation is proposed for this phase. Existing packages are reused; no legitimacy gate is required for a new dependency.

## Architecture Patterns

### System Architecture Diagram

```text
Angular ApiService + bearer interceptor
        |
        | POST selectors
        v
Express episodes router + requireAuth
        |
        +--> Zod selector/body validation
        +--> episodeRepository lookup
        +--> episodeArtifactDownloadService preflight
        |       |-- allowlisted selector -> canonical media kind/path
        |       `-- available/missing snapshot
        v
SQLite artifact_jobs row (pending)
        |
        v
Serialized artifact worker
        |-- processing + progress updates
        |-- archiver writes job-scoped ZIP
        |-- completed: path/filename/expiresAt
        `-- failed: error + cleanup
        ^
        | GET status polling (no-store)
        |
        `--> GET completed download -> auth -> stream stored ZIP -> retention cleanup
```

### Recommended Project Structure

```text
dragaocareca-admin-api/src/
├── routes/episodes.routes.ts                         # authenticated route wiring
├── services/episode-artifact-download.service.ts     # selectors + preflight (existing)
├── services/episode-artifact-job.service.ts          # [ASSUMED] job lifecycle + worker API
├── workers/episode-artifact.worker.ts                # [ASSUMED] serialized processing/polling
├── database/sqlite.ts                                 # [ASSUMED] artifact_jobs schema/migration
├── database/repositories/artifact-job.repository.ts  # [ASSUMED] persistence boundary
└── scripts/verify-episode-artifact-downloads.ts      # existing verifier to extend
```

### Pattern 1: Snapshot then process

**What:** Validate the selector set and resolve `available`/`missing` before enqueueing; persist that immutable snapshot with the job.

**When to use:** Every job start request.

`[ASSUMED]` This prevents files being added or removed during a long archive operation from changing the meaning of the request, and it makes partial-download messaging deterministic. The worker should still handle a file disappearing between preflight and `archive.file()` as a failed job or a newly missing item according to one documented policy.

```typescript
// [ASSUMED] Contract shape; exact implementation belongs in sibling API.
const preflight = await preflightEpisodeArtifactDownloads(episodeId, selectedArtifacts);
if (preflight.available.length === 0) {
  return res.status(404).json({ message: 'No requested artifacts found' });
}
const job = artifactJobRepository.create({
  episodeId,
  requested: preflight.requested,
  available: preflight.available.map((item) => item.selector),
  missing: preflight.missing,
  status: 'pending',
  progress: 0,
});
void artifactJobQueue.enqueue(job.jobId);
res.status(202).location(buildJobUrl(job)).json(toJobSnapshot(job));
```

### Pattern 2: Persisted state machine with one worker run

**What:** Use explicit transitions `pending -> processing -> completed|failed`; update progress at known archive stages and guard worker overlap with `activeRun`.

**When to use:** Worker startup, each poll, and every status response.

`[VERIFIED: codebase grep]` The existing transcription worker processes pending records serially and turns provider failures into persisted error state. `[ASSUMED]` The artifact worker should use the same shape but persist the ZIP path and expiry only on completion, remove partial output on failure, and not report completed until `archive.finalize()` and file close succeed.

### Pattern 3: Separate metadata status from binary delivery

**What:** Poll JSON until terminal completion, then make one authenticated binary request.

**When to use:** Angular Phase 5/6 integration.

`[ASSUMED]` Do not make the browser poll a `Blob` endpoint or infer progress from HTTP download bytes. The API should report job progress as JSON and only stream the ZIP after it is complete.

### Anti-Patterns to Avoid

- **Client-supplied path or filename:** `[VERIFIED: codebase grep]` The current service already resolves paths from the allowlisted catalog; preserve that boundary.
- **Synchronous ZIP assembly in the request:** `[VERIFIED: codebase grep]` This is the current route and is incompatible with reliable progress for large audio files; move assembly to the worker.
- **In-memory-only job map:** `[ASSUMED]` It loses status on restart and cannot coordinate route requests with worker state; persist job metadata in SQLite.
- **One shared temporary filename:** `[ASSUMED]` Concurrent requests can overwrite one another; key temporary and final ZIP paths by opaque job ID.
- **Marking completed before archive finalization:** `[ASSUMED]` The client could receive a truncated or missing ZIP; set completed only after the output file is closed and exists.
- **Trusting episode database filename fields as paths:** `[VERIFIED: codebase grep]` The current final layout intentionally maps the episode ID and media kind to fixed names; use `getEpisodeMediaFinalPath()` instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP format/streaming | Custom ZIP byte writer | Existing `archiver` 8.0.0 | `[VERIFIED: codebase grep]` Already integrated and tested by the current verifier; ZIP edge cases are nontrivial. |
| Artifact path resolution | Concatenate user input into paths | `episodeArtifactCatalog` + `getEpisodeMediaFinalPath()` | `[VERIFIED: codebase grep]` Keeps selector vocabulary and filesystem scope fixed. |
| Authentication | Route-local token parsing | Existing `requireAuth` and `AuthInterceptor` | `[VERIFIED: codebase grep]` Centralized backend verification and frontend bearer injection already exist. |
| Job lifecycle | Ad hoc booleans/timers in route handlers | Persisted state machine plus existing worker overlap guard | `[VERIFIED: codebase grep]` Matches the API’s transcription/notification patterns and makes polling deterministic. |
| Filename sanitization | Accept a requested filename | Server-generated `episode-{episodeId}-artifacts.zip` | `[VERIFIED: codebase grep]` Existing route already uses this safe deterministic name. |

## Runtime State Inventory

This is not a rename, refactor, or migration phase, so the rename inventory is not applicable. `[VERIFIED: codebase grep]` The async job design does introduce new runtime state: a planned `artifact_jobs` table and job-scoped ZIP files, both of which require cleanup and restart semantics in the implementation plan.

## Common Pitfalls

### Pitfall 1: Planning against the current synchronous route

**What goes wrong:** The frontend receives a direct ZIP stream and has no job ID or progress state.

**Why it happens:** `[VERIFIED: codebase grep]` The current implementation already works for small synchronous downloads and OpenAPI documents only that route.

**How to avoid:** Add and verify the async route sequence before Phase 5 consumes it; keep the old route only if compatibility is explicitly required.

**Warning signs:** No `202`, no `jobId`, no status endpoint, or `progress` missing from OpenAPI.

### Pitfall 2: Selector vocabulary drift

**What goes wrong:** UI sends `audio`, `cover-webp`, or display labels that the API rejects.

**Why it happens:** `[VERIFIED: codebase grep]` API selectors are `episode`, `trailer`, `transcript`, `image`, and `image-low`, while media kinds are different internal names.

**How to avoid:** Export/share one typed selector union in the frontend contract and copy the API catalog exactly.

**Warning signs:** `unknown artifact selector` responses or selectors not matching the existing verifier’s order.

### Pitfall 3: Missing artifacts discovered only during streaming

**What goes wrong:** The UI cannot distinguish a partial successful ZIP from a failed archive.

**Why it happens:** Files can disappear after preflight; current synchronous behavior only reports missing values in a response header.

**How to avoid:** Persist `requested`, `available`, and `missing` on job creation; define a single policy for files disappearing after snapshot and assert it in VAL-04.

### Pitfall 4: Temporary ZIP retention leaks disk space

**What goes wrong:** Completed or failed jobs accumulate under media storage.

**Why it happens:** `[ASSUMED]` Job artifacts are new persistent files and no current cleanup service exists for them.

**How to avoid:** Delete failed partial files immediately; delete completed files after an explicit TTL; run cleanup at worker startup and on an interval; expose expiry in status.

**Warning signs:** Job rows with expired files, completed status with `ENOENT`, or storage growth after repeated verification.

### Pitfall 5: Auth bypass differs between worker and routes

**What goes wrong:** Local route verification passes without bearer auth, while production requests correctly require a token.

**Why it happens:** `[VERIFIED: codebase grep]` `requireAuth` bypasses only when `NODE_ENV=development` and `AUTH_BYPASS=true`.

**How to avoid:** Test both `AUTH_BYPASS` and real bearer paths; never let the worker itself make authorization decisions—the job owner/scope check belongs in each route.

### Pitfall 6: API build verification cannot run from the frontend workspace

**What goes wrong:** A frontend-only plan claims the backend contract is verified without compiling or running the sibling API.

**Why it happens:** `[VERIFIED: environment probe]` The sibling API is outside the writable workspace in this session, and `npm run build` failed there with `EROFS` while `npm run typecheck` passed.

**How to avoid:** Execute API build and compiled verifier in the API repository or CI with write access; record the exact command and result in the phase verification.

## Code Examples

### Selector-to-path boundary

```typescript
// [VERIFIED: codebase grep] Existing implementation pattern.
const selected = parseEpisodeArtifactSelectors(input.artifacts);
const preflight = await preflightEpisodeArtifactDownloads(episodeId, selected);
// preflight entries carry server-resolved `path` and safe `archiveEntryName`.
```

### Existing archive entry construction

```typescript
// [VERIFIED: codebase grep] src/services/episode-artifact-download.service.ts:78-91
const finalPath = getEpisodeMediaFinalPath(episodeId, artifact.kind);
const archiveEntryName = `episode-${episodeId}/${artifact.fileName}`;
archive.file(finalPath, { name: archiveEntryName });
```

### Existing worker overlap guard

```typescript
// [VERIFIED: codebase grep] Pattern used in src/workers/launch-notification.worker.ts.
let activeRun: Promise<void> | null = null;
const runOnce = async (): Promise<void> => {
  if (activeRun) return activeRun;
  activeRun = processPendingJobs().finally(() => { activeRun = null; });
  return activeRun;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct synchronous ZIP response | `[ASSUMED]` Persisted async job + status polling + completed binary download | Phase 4 target | Enables visible progress and separates long work from request timeout. |
| Missing artifacts only in `X-Missing-Artifacts` header | `[ASSUMED]` Immutable `missing` array in job status plus optional header | Phase 4 target | JSON polling can render partial results before download. |
| No artifact-job retention model | `[ASSUMED]` Job expiry and cleanup policy | Phase 4 target | Prevents completed ZIP accumulation and stale download links. |

**Deprecated/outdated:** `[VERIFIED: codebase grep]` The current synchronous `GET /v1/episodes/:episodeId/artifacts/download` should not be the only contract for the v1.1 requirements because it cannot report asynchronous progress. Whether it remains as a backward-compatible endpoint is an unresolved compatibility decision.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | New routes should be nested as `POST /episodes/{episodeId}/artifacts/jobs`, status under the same resource, and download under `/download`. | Recommended Async Contract | Cross-repo route disagreement would block frontend integration. |
| A2 | SQLite `artifact_jobs` persistence is preferable to an in-memory map. | Architecture Patterns | Requires schema/migration work; a different durable store would change the plan. |
| A3 | A serialized worker with one active run is sufficient for the first release. | Architecture Patterns | Large concurrent downloads could require a bounded worker pool. |
| A4 | Preflight snapshots `available` and `missing` at job creation. | Recommended Async Contract | Files changing during processing could produce different partial semantics. |
| A5 | No-available-artifact requests retain the current `404` behavior. | Recommended Async Contract | Product/API convention may prefer `422`. |
| A6 | Completed ZIPs should expire after a short TTL and failed files should be removed immediately. | Common Pitfalls | Retention period affects operations, storage, and user retry behavior. |
| A7 | The missing DC 334 media fixture must be supplied or generated outside the checked-in API data currently inspected. | Environment Availability | Release validation cannot prove full artifact contents without it. |

## Open Questions

1. **Which exact async route names and job response schema should the API and frontend lock?**
   - What we know: Existing route namespace is `/v1/episodes/:episodeId/artifacts/download`; no job routes exist.
   - What's unclear: Nested job resource naming, `202` response fields, and whether to retain the synchronous route.
   - Recommendation: Decide this before Phase 5 and update API OpenAPI plus a shared frontend contract table in the plan.

2. **What is the concurrency policy?**
   - What we know: Existing workers serialize processing and prevent overlapping runs with `activeRun`.
   - What's unclear: Whether multiple jobs may queue for one or many episodes, and whether duplicate selector sets are deduplicated.
   - Recommendation: Allow independent persisted jobs but process with a bounded/serialized worker for v1.1; add a clear duplicate policy and test it.

3. **What retention period and restart recovery are required?**
   - What we know: No artifact-job retention/configuration exists today.
   - What's unclear: TTL, cleanup interval, and whether `processing` jobs are reset to `pending` after restart.
   - Recommendation: Lock TTL and recovery transitions in the API plan; do not expose a download URL that can outlive its stored file.

4. **Where is the DC 334 Season 3 episode folder?**
   - What we know: `[VERIFIED: codebase grep]` `data/all_episodes.json` contains episode ID 334 metadata; no `data/media/.../334` directory or supplied artifact folder was found in the sibling API checkout.
   - What's unclear: Whether the fixture is external, ignored, mounted in deployment, or expected to be created during Phase 6.
   - Recommendation: Make fixture provisioning an explicit prerequisite for VAL-04/Phase 6, not an implicit test assumption.

5. **Should status expose a download URL or should the frontend construct the endpoint?**
   - What we know: Existing frontend builds endpoint URLs directly in `ApiService`; existing API uses deterministic paths.
   - What's unclear: Whether job URLs should be absolute, relative, or omitted.
   - Recommendation: Return a relative `downloadUrl` only after completion, while keeping frontend URL construction typed and backend-controlled.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | API typecheck/build/worker | ✓ | `v24.17.0` | — |
| npm | API/frontend scripts | ✓ | `12.0.1` | — |
| Angular CLI | Frontend build/test | ✓ via project dependencies | `15.0.4` package range | — |
| `ffmpeg` / `ffprobe` | Existing transcript path, not ZIP job | ✓ | system-installed | Not required for artifact ZIP itself |
| Sibling API checkout | Contract implementation and verifier | ✓ read-only | local checkout | API changes must be performed in API workspace/CI |
| Writable API `dist/` | `npm run build` and compiled verifier | ✗ in this session | — | Run in API workspace with write access or CI |
| DC 334 media fixture directory | Artifact content validation | ✗ not found in inspected checkout | — | Provision fixture explicitly before Phase 6 |

**Missing dependencies with no fallback:** API compilation and compiled verification are blocked in this session’s read-only sibling checkout; this is an environment permission issue, not a code failure.

**Missing dependencies with fallback:** DC 334 fixture can be provisioned separately, but no meaningful full-content ZIP validation exists until it is supplied.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| API framework | No test runner configured; `package.json:test` intentionally exits with “no test specified”. `[VERIFIED: codebase grep]` |
| API verifier | `src/scripts/verify-episode-artifact-downloads.ts`, compiled and run through `npm run verify:episode-artifact-downloads`. `[VERIFIED: codebase grep]` |
| API quick command | `npm run typecheck` in `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api` |
| API full command | `npm run build && npm run verify:episode-artifact-downloads` in the API repository |
| Frontend framework | Karma 6.4 + Jasmine 4.5 through Angular CLI. `[VERIFIED: codebase grep]` |
| Frontend quick command | `npm run build` (mandatory project gate) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | Authenticated valid episode + canonical selectors creates `pending` job and returns job ID. | API contract script | `npm run verify:episode-artifact-downloads` | Existing script; extend |
| API-02 | Job transitions pending → processing → completed and reports `0..100` progress; failure reports error. | API integration/contract | Same verifier, with deterministic worker seam/fake archive failure | Existing script; gap |
| API-03 | Completed job download is authenticated, binary ZIP, and uses safe filename. | API integration | Same verifier; assert status/download routes | Existing synchronous assertions; adapt |
| API-04 | Partial job completes with available ZIP and requested missing selectors. | API integration | Same verifier; assert status JSON and ZIP entries | Existing preflight fixture; extend |
| API-05 | Unknown/empty selectors and path-like values are rejected; no arbitrary path is read. | API unit/route | Same verifier plus traversal/path inputs | Existing selector assertions; extend |
| VAL-04 | Creation, transitions, completion, failure, and missing artifacts all have evidence. | API contract suite | `npm run build && npm run verify:episode-artifact-downloads` | Existing script; substantial extension |

### Required verifier scenarios

`[ASSUMED]` Extend `src/scripts/verify-episode-artifact-downloads.ts` in the API repo to assert:

1. `401` for start, status, and download without bearer auth when `AUTH_BYPASS` is disabled.
2. `400` for unknown selector, empty CSV/array, duplicate normalization behavior, path-like input (`../../data/...`), and non-array/non-string body shapes.
3. `404` for missing episode and no available artifacts; no job row created in either case.
4. `202` start response, `Location`, stable job ID, selector snapshot, and `pending` status.
5. `pending -> processing -> completed`, monotonic progress, `100` on completed, one valid ZIP, deterministic entry names, and safe `Content-Disposition`.
6. Partial request with a missing cover/trailer: completed ZIP contains only available artifacts and status exposes `missing`.
7. Forced archive/filesystem failure: `failed` status, nonempty error, no downloadable partial ZIP, and cleanup.
8. Unknown job ID / wrong episode path does not reveal another job and returns `404`.
9. Expired completed job cannot download and cleanup removes its ZIP.

### Wave 0 gaps

- `[ASSUMED]` Add an injectable/fake archive or worker seam so failure and deterministic progress can be tested without relying on timing or real large files.
- `[ASSUMED]` Add job repository/schema test fixtures and a reset/cleanup helper to keep verifier runs isolated.
- `[ASSUMED]` Add OpenAPI assertions for all three async operations and each response status.
- `[ASSUMED]` Provision or document the DC 334 media fixture path before manual ZIP-content validation.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | `[VERIFIED: codebase grep]` Apply `requireAuth` to start, status, and download; preserve `AUTH_BYPASS` only for development. |
| V3 Session Management | yes | `[VERIFIED: codebase grep]` Use the existing JWT bearer middleware and frontend `AuthInterceptor`; do not put tokens in query strings or download URLs. |
| V4 Access Control | yes | `[ASSUMED]` A job status/download request must verify the job’s episode/resource scope and return `404` for unknown or mismatched job IDs. |
| V5 Input Validation | yes | `[VERIFIED: codebase grep]` Use allowlisted selector parsing/Zod; reject arbitrary paths, empty values, invalid episode IDs, and unsupported body shapes. |
| V6 Cryptography | yes | `[VERIFIED: codebase grep]` Reuse JWT verification; use `crypto.randomUUID()` for opaque job IDs; do not invent custom token or signature formats. |

### Known Threat Patterns for Express + filesystem ZIP jobs

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal through selector/path input | Tampering / Elevation | `[VERIFIED: codebase grep]` Never accept paths; map fixed selectors to fixed `EpisodeMediaKind` and use `path.resolve` on server constants. |
| Job ID enumeration | Information disclosure | `[ASSUMED]` Use opaque UUIDs and return generic `404` for unknown/mismatched jobs. |
| Unauthorized ZIP retrieval | Information disclosure | `[VERIFIED: codebase grep]` Run `requireAuth` on every job route, including binary download. |
| ZIP overwrite/cross-job collision | Tampering | `[ASSUMED]` Use job-ID-scoped output paths and atomic completion/rename. |
| Disk exhaustion from retained ZIPs | Denial of service | `[ASSUMED]` Bound selectors/job size or concurrency, enforce TTL cleanup, and remove failed partial output. |
| ZIP entry traversal | Tampering | `[VERIFIED: codebase grep]` Use server-generated `episode-{id}/{catalog filename}` archive names only. |

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` — selector catalog, parser, preflight, safe archive entry names.
- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-media-layout.service.ts` — canonical media kinds, final paths, legacy fallback behavior.
- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` — current protected synchronous ZIP route and endpoint conventions.
- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts` — existing selector/preflight/OpenAPI/auth/ZIP verification.
- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-transcription.service.ts` and `src/workers/launch-notification.worker.ts` — persisted status and serialized worker patterns.
- `[VERIFIED: codebase grep]` `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/sqlite.ts` and `src/database/repositories/episode.repository.ts` — SQLite schema and episode artifact fields.
- `[VERIFIED: codebase grep]` frontend `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — frontend boundary, locked decisions, requirements, and phase dependencies.

### Secondary (MEDIUM confidence)

- `[VERIFIED: environment probe]` Local command results — Node/npm availability, frontend build result, API typecheck result, and API build write-permission failure.

### Tertiary (LOW confidence)

- `[ASSUMED]` Async route names, SQLite job table, retention period, concurrency policy, and exact status/download error codes; these require cross-repository agreement before implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing package lock, source imports, and scripts confirm the stack; no new package is proposed.
- Architecture: MEDIUM — current selector/media/auth/worker patterns are directly confirmed, but the async job resource is a new design recommendation.
- Pitfalls: MEDIUM — security and lifecycle risks follow directly from the current route and filesystem behavior; retention/concurrency details remain assumptions.

**Research date:** 2026-07-28
**Valid until:** 2026-08-05 for async contract recommendations; current code facts should be rechecked after sibling API changes.
