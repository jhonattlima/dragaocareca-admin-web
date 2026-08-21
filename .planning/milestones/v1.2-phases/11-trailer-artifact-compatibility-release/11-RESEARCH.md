---
phase: 11-trailer-artifact-compatibility-release
type: research
status: complete
---

# Phase 11: Trailer Artifact & Compatibility Release — Research

## User Constraints

- Add finalized local trailer video to the existing episode artifact-download workflow.
- Do not expose staged, failed, unavailable, or stale replacement media as downloadable.
- Preserve the existing artifact job, progress polling, authenticated native ZIP delivery, retry/reset behavior, tests, build, and sectioned operator UI.
- Keep Angular thin: the backend remains authoritative for final-file availability, selector validation, ZIP contents, canonical names, and stale-source safety.
- Do not modify application code during research. This artifact is the only intended new file.
- The worktree already contains unrelated dirty Phase 9/10 application changes; they were inspected and must remain untouched.

## Standard Stack

- Angular 15 + strict TypeScript; `ApiService` is the shared `HttpClient` boundary.
- `HttpClient`/`HttpResponse<Blob>` with `AuthInterceptor` for authenticated native ZIP delivery.
- Express/TypeScript sibling API with Zod request validation, SQLite-persisted artifact jobs, `archiver`, and server-derived media paths.
- Existing frontend verification: TypeScript spec compilation, focused/full Karma ChromeHeadless suites where available, and `npm run build`.
- No new package or browser ZIP/file-saver dependency is needed.

## Architecture Patterns

1. **Typed selector boundary.** `ApiService` owns the frontend selector union and POST wrapper; `ManageComponent` owns labels, availability presentation, selection, polling, and delivery orchestration.
2. **Backend preflight.** The API maps allowlisted selectors to canonical media kinds and checks `lstat(finalPath).isFile()` before creating a job. The browser’s episode DTO is only a display hint.
3. **Snapshot-before-archive.** The API copies/hash-checks finalized sources into a job-scoped snapshot, archives those snapshots under the canonical archive entry names, and refuses or invalidates changed sources.
4. **Persisted job lifecycle.** Start returns a job snapshot; the component polls every two seconds until `completed`/`failed`; completed jobs are delivered through the authenticated Blob route.
5. **Native delivery and recovery.** `ManageComponent` validates the server `Content-Disposition` filename, creates one temporary object URL/anchor, revokes it in `finally`, retries delivery without starting another job, and resets the flow for a new job.
6. **Finalized-vs-staged media separation.** Trailer-video upload state is explicitly `staged` until Save/create promotes it; only the API’s finalized path is an artifact source.

## Findings

### Requirements and project state

- `.planning/ROADMAP.md` defines Phase 11 as the final v1.2 release slice and requires `trailer-video` selection plus canonical `trailer.mp4` ZIP inclusion while excluding unavailable/staged/stale replacements.
- `.planning/REQUIREMENTS.md` leaves ARTIFACT-01 and ARTIFACT-02 pending; OPS-05 is otherwise assigned to Phase 10.
- `.planning/v1.2-MILESTONE-AUDIT.md` identifies the concrete gap: the finalized trailer is not exposed by the Angular selector/modal. It also records that build passes with existing selector-parser and Angular budget warnings, and that live browser evidence is incomplete.
- Phase 10 summaries explicitly state that artifact selector/download behavior was not changed. Phase 10’s stale identity guards concern editor/YouTube callbacks and should not be replaced by a client-side artifact-path rule.
- Phase 4–6 established the current artifact job contract, modal, native delivery, retry/reset, and verification seams. Existing artifact recovery coverage is partly mocked; historical/live release evidence has known unsupported cases, so Phase 11 should add focused trailer-specific assertions without claiming unrelated live coverage.

### Exact frontend symbols and files

- `src/app/core/api.service.ts:252`: `EpisodeArtifactSelector` currently omits `trailer-video`; add the API selector without renaming existing selectors.
- `src/app/core/api.service.ts:254-269`: `EpisodeArtifactJobSnapshot` already has generic `requested`, `available`, `missing`, progress/state, URL, expiry, and error fields; no DTO shape expansion is indicated.
- `src/app/core/api.service.ts:493-499`: `startEpisodeArtifactJob()` already POSTs `{ artifacts }` to `POST /episodes/:episodeId/artifacts/jobs`; `getEpisodeArtifactJobStatus()` already polls the matching route.
- `src/app/core/api.service.ts:547-560`: `downloadEpisodeArtifact()` resolves relative API URLs and requests `HttpResponse<Blob>`; the interceptor supplies authentication. It should remain unchanged.
- `src/app/pages/manage/manage.component.ts:108-123`: `EpisodeArtifactOption` and `ArtifactDefinition` are the modal’s typed seams. The definition’s `fileField` union must accept `trailerVideoFileName`.
- `src/app/pages/manage/manage.component.ts:237-243`: `artifactDefinitions` is the single selector/label/format/file-field catalog. Add one `trailer-video` entry, preferably in the API catalog order after `trailer`.
- `src/app/pages/manage/manage.component.ts:406-419`: `openArtifactModal()` rebuilds options from the episode DTO and restores active-job selections.
- `src/app/pages/manage/manage.component.ts:2550-2565`: `buildArtifactOptions()` currently treats a nonempty DTO filename as a UI availability hint. For trailer-video this should mean a finalized filename only as represented by the API; the start/preflight response remains authoritative.
- `src/app/pages/manage/manage.component.ts:534-579`: `confirmArtifactJob()` filters available checked options and sends their selector values. No separate trailer path or request flow is needed.
- `src/app/pages/manage/manage.component.ts:2567-2615`: `storeArtifactJob()` and the guarded two-second poller already handle terminal states and ignore responses for a different job ID.
- `src/app/pages/manage/manage.component.ts:2651-2760`: completed Blob delivery, server filename validation, object URL cleanup, delivery retry, and error mapping are reusable unchanged.
- `src/app/pages/manage/manage.component.html:127-180`: the generic `*ngFor` modal renders, disables, labels, warns, retries, resets, and prepares all artifact definitions without selector-specific markup. A format hint of `.mp4` is sufficient.

### Current API selector contract

The sibling API is the authoritative current contract:

| selector | media kind | canonical source | ZIP entry |
|---|---|---|---|
| `episode` | `audio` | finalized `episodes/{id}/audio.mp3` | `episode-{id}/audio.mp3` |
| `trailer` | `trailer` | finalized `episodes/{id}/trailer.mp3` | `episode-{id}/trailer.mp3` |
| `trailer-video` | `trailerVideo` | finalized `episodes/{id}/trailer.mp4` | `episode-{id}/trailer.mp4` |
| `transcript` | `transcript` | finalized `episodes/{id}/transcript.txt` | `episode-{id}/transcript.txt` |
| `image` | `cover` | finalized cover path | `episode-{id}/cover.jpeg` |
| `image-low` | `coverLow` | finalized low-cover path | `episode-{id}/cover.webp` |

Verified API locations:

- `../dragaocareca-admin-api/src/services/episode-artifact-download.service.ts:6-20,76-111` defines the catalog, parser, and regular-file preflight.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts:90-92,735-779` accepts the six canonical selectors, preflights before job creation, and returns 404 when no requested final file is available.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts:822-889` preserves the existing status/download routes, authenticated delivery, safe server filename, and missing-artifact header.

The frontend’s current five-value union is therefore stale relative to the sibling API. The request value must be exactly `trailer-video`; do not use `trailerVideo`, `video`, `trailer.mp4`, a filename, or a new endpoint.

### Finalized-file preflight and stale/replacement safety

- The trailer-video upload contract returns `state: "staged"` with no finalized filename for a new draft; Save/create promotes the bytes to the server-owned canonical `trailer.mp4` and returns `state: "finalized"` with `trailerVideoFileName`.
- Staged bytes live under the API staging path and are not consulted by `preflightEpisodeArtifactDownloads()`. The frontend must not infer availability from a selected `File`, upload progress, YouTube readiness, or a staged state.
- A missing/failed/staged request should be rejected by API preflight or represented in the job’s `missing` list; Angular should surface the existing unavailable/partial behavior rather than manufacture a URL.
- Replacements are safe because the API resolves the final server-owned path by `(episodeId, trailerVideo)` rather than trusting the DTO filename. During preparation it snapshots and hashes the source, compares evidence, and invalidates a completed archive whose current source evidence no longer matches. The download route revalidates the job and evidence.
- Consequently, adding a client availability check improves modal affordance but is not a security or correctness boundary. The frontend must continue handling a 404/partial result after a list refresh race.
- The existing `markArtifactOptionsUnavailable()` behavior is broad (it marks all current options unavailable after a no-artifacts response). Preserve it unless a focused test demonstrates that a partial response requires a narrower presentation change; this phase does not need a new recovery model.

### How options are disabled/hidden

- Options are rendered, not removed: `available === false` applies the unavailable class, disables the checkbox, and shows `Unavailable — file not uploaded.`
- `buildArtifactOptions()` initially marks all definitions with a nonempty filename available and checked by default; active job selections restore only selectors in `requested`.
- The entire selection set is disabled while a job is pending/processing. Prepare is disabled with no checked available option or while a terminal job remains open. Retry and reset retain their existing semantics.
- For trailer-video, the expected UI behavior is a visible `Trailer video .mp4` row enabled only when the episode DTO reports finalized `trailerVideoFileName`. A staged draft has no finalized name and must remain unavailable; an old/stale row can still be rejected by API preflight.

### Test seams

- `src/app/pages/manage/manage.component.spec.ts` `describe('ManageComponent artifact download modal', ...)` is the primary UI seam. Existing assertions cover option order/labels, empty selection, one start request, duplicate-start suppression, status/missing labels, modal focus, one native delivery, unsafe filename rejection, delivery retry, and reset.
- Existing fixture data around lines 551–604 contains `trailerFileName` but no `trailerVideoFileName`; extend it for finalized and absent/staged cases.
- The expected option array around lines 641–650 and request assertions around lines 667–671 must be updated for the new row and selector.
- Add focused cases for: finalized DTO exposes/enables `trailer-video`; absent/staged DTO hides/disables it; a selected `trailer-video` is sent unchanged; a completed snapshot with `available: ['trailer-video']` still uses the generic delivery path; a backend 404/no-final-file response leaves no fabricated download.
- `src/app/core/api.service.spec.ts` is the HTTP wrapper seam if selector typing/request-body coverage exists; verify the existing test fixture contract before changing it. No new download wrapper is expected.
- Backend verification is outside this writable frontend repo, but the sibling `src/scripts/verify-episode-artifact-downloads.ts` already exercises selector validation, canonical entries, regular-file/symlink rejection, ZIP route behavior, and no-job-on-empty-preflight. Its trailer-video-specific assertions are the source-of-truth evidence for ARTIFACT-02.

## Recommended Plan Boundaries

1. Update only the Angular artifact selector type and the shared `artifactDefinitions` metadata/file-field typing.
2. Add the finalized trailer-video modal row using `Episode.trailerVideoFileName`, label `Trailer video`, and `.mp4`.
3. Preserve the existing `ApiService` start/status/download methods and generic `ManageComponent` job/delivery flow; only type compatibility and selector payload coverage should change.
4. Extend focused Manage/API specs for option availability, exact selector payload, partial/missing behavior, and existing retry/reset/native download invariants.
5. Run the frontend type/spec/build gates. If ChromeHeadless is unavailable, record that limitation; do not weaken production code or fabricate browser evidence.
6. Treat API-side catalog/preflight/hash/snapshot behavior as already implemented and out of frontend implementation scope. Any API contract mismatch found during verification should be reported, not silently compensated in Angular.

## Common Pitfalls

- Using the UI label or internal media kind (`trailerVideo`) as the request selector instead of canonical `trailer-video`.
- Checking the staging directory, selected `File`, upload status, YouTube job status, or `trailerVideoSyncStatus` in Angular to decide artifact availability.
- Trusting `trailerVideoFileName` as proof that the file still exists; it is only an initial display hint, while API preflight/evidence is authoritative.
- Adding a direct MP4 download, a second endpoint, client ZIP creation, or a browser-side filesystem path.
- Renaming the canonical ZIP entry or using the DTO filename; the API must produce `episode-{id}/trailer.mp4`.
- Resetting/restarting a completed artifact job merely because a replacement happened; the API’s source evidence invalidation is the intended stale safety boundary.
- Updating generic delivery code unnecessarily and regressing authenticated headers, server filename validation, object URL cleanup, or same-job delivery retry.
- Marking a staged upload finalized in the browser before the Save/create response.
- Assuming full live Phase 6 recovery evidence exists; preserve the documented unsupported/human-needed limitations.

## Verification Matrix

| Area | Check | Expected evidence |
|---|---|---|
| Selector contract | TypeScript/API request uses `trailer-video` | Compile plus focused `startEpisodeArtifactJob` payload assertion |
| Modal availability | Finalized DTO with `trailerVideoFileName` | `Trailer video .mp4` row enabled/checked according to normal selection rules |
| Staged/unavailable | Empty/null trailer-video filename | Row disabled/unavailable; no selector submitted |
| Backend preflight | No finalized regular file, directory, symlink, or staged-only source | API 404/no job or `missing` entry; no fabricated frontend download |
| ZIP naming | Finalized source selected | API verifier sees `episode-{id}/trailer.mp4`, not a client filename |
| Replacement safety | Source changes after job/cache creation | API evidence mismatch invalidates/rejects stale archive; Angular reports recoverable unavailable/expired state |
| Partial archive | Other selected files available, trailer-video missing | Existing missing-artifact warning remains visible; available files still follow the generic flow |
| Progress/polling | pending → processing → completed/failed | Existing status labels, two-second polling, terminal teardown, and job-ID guard remain green |
| Delivery | Completed ZIP | Authenticated `HttpResponse<Blob>`, server `Content-Disposition`, one anchor activation, object URL revoke |
| Recovery | Blob failure, retry, reset, reopen, duplicate completion | Existing UI-07/UI-08 behavior remains green; retry uses same completed URL and reset permits a new job |
| Compatibility | Auth modes, other artifact selectors, Manage workflow | Focused/full frontend tests and `npm run build` pass with only known warnings |

## Project Constraints

- Source-of-truth project docs: `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/CONFIGURATION.md`; backend-owned media and authentication rules override UI assumptions.
- `authBypass` remains an environment/local development toggle and must not alter artifact authorization or validation.
- Preserve legacy-inspired sectioned Manage layout and existing generic artifact controls.
- Preserve current known non-blocking Angular selector-parser and bundle/style budget warnings unless a new failure appears.
- The current web worktree is dirty in unrelated Phase 9/10 files; do not revert, reformat, or include those changes as part of Phase 11 research.
- No application code was modified by this research pass; only this planning artifact is intended to be written.

