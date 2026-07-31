# Phase 4: Artifact Job Contract - Pattern Map

**Mapped:** 2026-07-29  
**Files analyzed:** 8 API files (existing and implied by CONTEXT/RESEARCH)  
**Analogs found:** 7 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `../dragaocareca-admin-api/src/routes/episodes.routes.ts` | route/controller | request-response + binary file-I/O | same file, current artifact preparation routes | exact |
| `../dragaocareca-admin-api/src/services/episode-artifact-job.service.ts` (recommended new boundary, or refactor existing preparation service) | service | event-driven/batch file-I/O | `src/services/episode-artifact-preparation.service.ts` | exact role/data-flow |
| `../dragaocareca-admin-api/src/workers/episode-artifact.worker.ts` (recommended new name, or adapt existing worker) | worker | event-driven batch | `src/workers/episode-artifact-preparation.worker.ts` | exact |
| `../dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` | utility/service | transform + file-I/O | same file | exact |
| `../dragaocareca-admin-api/src/database/sqlite.ts` | config/schema/persistence | CRUD/batch persistence | same file schema initialization | role-match; no job-table analog |
| `../dragaocareca-admin-api/src/database/repositories/artifact-job.repository.ts` (recommended new) | repository/model | CRUD state transitions | `src/database/repositories/episode.repository.ts` | role-match |
| `../dragaocareca-admin-api/src/docs/openapi.ts` | config/documentation | transform/request-response contract | current artifact preparation OpenAPI entries | exact |
| `../dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts` | test/verifier | batch/request-response + file-I/O | same verifier, current preparation lifecycle assertions | exact |

The frontend repository has no application files in this phase. Phase 5 may later add `ApiService` methods, but Phase 4 ends at the backend-owned contract.

## Pattern Assignments

### `src/routes/episodes.routes.ts` (route, request-response + binary file-I/O)

**Analog:** `../dragaocareca-admin-api/src/routes/episodes.routes.ts`

**Imports and middleware** (lines 4-29): use `Router`, `RequestHandler`, `requireAuth`, the episode repository, selector/preflight service, and job service. Keep auth on every start/status/download route.

```typescript
import { Router, type RequestHandler } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { episodeRepository } from "../database/repositories/episode.repository";
import {
  EpisodeArtifactSelectorValidationError,
  parseEpisodeArtifactSelectors,
  preflightEpisodeArtifactDownloads,
} from "../services/episode-artifact-download.service";
```

**No-store and validation pattern** (lines 55-58, 436-465):

```typescript
const noStoreArtifactPreparation: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

const episodeId = Number(req.params.episodeId);
if (!Number.isInteger(episodeId) || episodeId <= 0) {
  res.status(400).json({ message: "Invalid episodeId" });
  return;
}
```

Catch selector-specific validation and return `400`; check `episodeRepository.findByEpisodeId()` and return `{ message: "Episode not found" }` with `404`; preflight before enqueueing and return `{ message: "No requested artifacts found" }` with `404` when nothing is available.

**Status route pattern** (lines 480-505): return `404` for missing or episode-mismatched opaque job IDs, set `Cache-Control: no-store`, and serialize only the public snapshot.

**Download pattern** (lines 507-568): reject expired jobs with `410`, non-ready jobs with `409`, set ZIP headers, add `X-Missing-Artifacts` from the persisted snapshot, pipe a validated `fs.ReadStream`, and destroy the response on stream errors.

### `src/services/episode-artifact-job.service.ts` (service, event-driven batch/file-I/O)

**Analog:** `../dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` (lines 1-76, 128-169, 256-362).

This is the closest existing implementation. If the planner retains the existing preparation naming, extend that service instead of creating a duplicate job service. Preserve these concrete patterns:

**Imports, opaque IDs, job-scoped paths, and bounded status** (lines 1-20, 60-80, 128-145):

```typescript
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { once } from "node:events";
import { config } from "../config/env";
import {
  parseEpisodeArtifactSelectors,
  preflightEpisodeArtifactDownloads,
} from "./episode-artifact-download.service";

const preparationRoot = path.join(config.media.storageRoot, ".artifact-preparations");
const archivesRoot = path.join(preparationRoot, "archives");
const retentionMs = 24 * 60 * 60 * 1000;

let activeProcess: Promise<EpisodeArtifactPreparationStatus | null> | null = null;
const activePreparationByCacheKey = new Map<string, Promise<EpisodeArtifactPreparationStatus>>();
```

Use `randomUUID()` for opaque job IDs, isolate temporary/final files by job ID, clamp progress to `0..100`, and retain immutable requested/available/missing selector arrays in the public snapshot. The research/CONTEXT decision says the final state names must be `pending | processing | completed | failed`; map the analog’s `queued | preparing | ready | failed | expired` to that contract rather than copying names unchanged.

**Duplicate active request suppression** (lines 261-295): cache the in-flight operation by `episodeId + normalized selector order`, return the existing active operation, and only create a new job after checking prior active/cache records. This is the direct pattern for D-14.

**Snapshot then process** (lines 283-290, 321-350): preflight and record selector availability before enqueueing; when processing, re-preflight, copy source files into a job-specific snapshot directory, compare source evidence, then archive only the snapshot paths.

**Archive finalization and cleanup** (lines 191-223, 345-359):

```typescript
const temporaryPath = path.join(archivesRoot, `.${fileName}.part`);
const output = fs.createWriteStream(temporaryPath, { flags: "wx" });
archive.pipe(output);
await archive.finalize();
await completed;
await fs.promises.rename(temporaryPath, finalPath);
```

Set `completed` only after finalize, stream close, and final-file existence/rename succeed. On failure remove snapshot and `.part` output, then persist `failed` with a nonempty error. The existing analog currently loses the error in its public status; Phase 4 must add the required `error` field.

### `src/workers/episode-artifact.worker.ts` (worker, event-driven batch)

**Analog:** `../dragaocareca-admin-api/src/workers/episode-artifact-preparation.worker.ts` (lines 1-47); secondary analog `src/workers/launch-notification.worker.ts` (lines 4-49).

**Serialized run and overlap guard:**

```typescript
let pollTimer: NodeJS.Timeout | undefined;
let activeRun: Promise<void> | null = null;

const runOnce = async (): Promise<void> => {
  if (activeRun) return activeRun;
  activeRun = (async () => {
    await initializeEpisodeArtifactPreparations({ recoverInterrupted: !recoveredAtStartup });
    recoveredAtStartup = true;
    await processNextEpisodeArtifactPreparation();
  })().finally(() => { activeRun = null; });
  return activeRun;
};
```

Keep startup recovery before polling, call one run immediately, use a configured interval, call `.unref()` where appropriate, and return a cleanup function that clears the timer. Process pending jobs serially unless the chosen API policy explicitly permits more concurrency.

### `src/services/episode-artifact-download.service.ts` (service/utility, transform + file-I/O)

**Analog:** same file, lines 4-14, 19-64, 71-106.

**Canonical selector boundary:**

```typescript
const artifactCatalog = [
  { selector: "episode", kind: "audio", fileName: "audio.mp3" },
  { selector: "trailer", kind: "trailer", fileName: "trailer.mp3" },
  { selector: "transcript", kind: "transcript", fileName: "transcript.txt" },
  { selector: "image", kind: "cover", fileName: "cover.jpeg" },
  { selector: "image-low", kind: "coverLow", fileName: "cover.webp" },
] as const;
```

Preserve catalog order, deduplication, rejection of empty/unknown values, and `getEpisodeMediaFinalPath(episodeId, kind)` resolution. The new JSON request should validate an array but retain exactly these selector strings; never accept filename, path, or internal media-kind values from the client.

### `src/database/sqlite.ts` and `src/database/repositories/artifact-job.repository.ts` (persistence, CRUD state machine)

**Analogs:** `../dragaocareca-admin-api/src/database/sqlite.ts` (lines 77-85, 250-290) and `src/database/repositories/episode.repository.ts` (lines 1-25, 831-867).

The API uses `DatabaseSync`, a single `getDb()` accessor, schema creation in one SQL template, WAL mode, and prepared statements. Repository methods should mirror `episodeRepository`: typed row mapping, `nowIso()`, parameterized `SELECT/INSERT/UPDATE`, and return `null` for unknown episode/job IDs. Add an `artifact_jobs` table or migration with opaque ID, episode ID, selector snapshots, lifecycle status, integer progress, filename/path metadata, error, created/updated/completed/expiry timestamps, and an index supporting pending-job order and episode/job lookup.

There is no existing artifact-job repository analog. Do not copy the current preparation service’s JSON-manifest persistence if D-12 (SQLite persistence across requests/restarts) remains locked; use the file-manifest implementation only for filesystem atomic-write and cleanup patterns.

### `src/docs/openapi.ts` (contract documentation, request-response)

**Analog:** same file, current preparation entries at lines 720-797.

Reuse bearer security, positive integer `episodeId` parameters, `no-store` response headers, JSON status schemas, binary `application/zip` content, deterministic `Content-Disposition`, `X-Missing-Artifacts`, and `400/401/404/409/410` response conventions. Replace the current query-string prepare operation with the locked `POST /v1/episodes/{episodeId}/artifacts/jobs` JSON body and document the exact four-state enum plus `error`, timestamps, filename, and download information.

### `src/scripts/verify-episode-artifact-downloads.ts` (verifier/test, batch/request-response + file-I/O)

**Analog:** same file, lines 125-169, 171-300, 314-398, 400-559.

Copy the verifier’s fixture strategy, in-memory `MemoryResponse`, direct Express router handler invocation, ZIP central-directory entry inspection, auth-bypass toggling, OpenAPI assertions, and cleanup assertions. Extend scenarios for: invalid JSON selectors, unknown episode, no artifacts/no job creation, partial snapshot, duplicate active request, pending → processing → completed, progress bounds/monotonicity, failed archive cleanup, restart recovery, expired job `404`, mismatched job `404`, and authenticated completed download. Keep `assertNoInternalFields` so filesystem paths, manifest details, and storage roots never leak.

## Shared Patterns

### Authentication and cache control

**Sources:** `src/routes/episodes.routes.ts:436-569`, `src/middleware/auth.middleware.ts`, `src/scripts/verify-episode-artifact-downloads.ts:400-417`

Apply `requireAuth` to all three endpoints, including binary download. Use `Cache-Control: no-store` on every job response and assert unauthenticated requests return `401` before business logic.

### Error and response handling

**Sources:** `src/routes/episodes.routes.ts:444-475,520-547`

Use route-local early returns for expected `400/404/409/410` cases and `next(error)` for unexpected failures. Public JSON should contain stable messages and contract fields only; do not serialize internal paths, cache keys, manifests, or raw filesystem errors.

### Safe archive construction

**Sources:** `src/services/episode-artifact-download.service.ts:78-91`, `src/services/episode-artifact-preparation.service.ts:191-223`

Use catalog-derived archive entry names (`episode-{episodeId}/{catalog fileName}`), job-specific `.part` and final paths, `archiver`, atomic rename, and cleanup on failure. Never derive archive paths from request strings.

### Worker lifecycle

**Sources:** `src/workers/episode-artifact-preparation.worker.ts:12-47`, `src/workers/launch-notification.worker.ts:7-49`

Use one active run promise, serialized pending selection, startup recovery, interval polling, logged failures, and an explicit timer cleanup function.

## No Analog Found

| File/Concern | Reason |
|---|---|
| `src/database/repositories/artifact-job.repository.ts` and the `artifact_jobs` schema | No persisted artifact-job table or repository exists. Existing preparation uses JSON manifests under `.artifact-preparations`; SQLite must be designed using the generic SQLite/repository conventions. |
| Exact `pending | processing | completed | failed` contract | Closest implementation uses `queued | preparing | ready | failed | expired`; planner must define the locked Phase 4 mapping and terminal/expiry behavior. |

## Metadata

**Analog search scope:** sibling API `src/routes`, `src/services`, `src/workers`, `src/database`, `src/docs`, and `src/scripts`; frontend docs and planning artifacts for scope only.  
**Strong analogs scanned:** 7 files.  
**Pattern extraction date:** 2026-07-29
