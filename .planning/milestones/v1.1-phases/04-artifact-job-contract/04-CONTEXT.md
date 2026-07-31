# Phase 4: Artifact Job Contract - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the backend-owned asynchronous lifecycle for generating one episode artifact ZIP: validate canonical artifact selectors, create and process a persisted job, report progress and terminal states, and serve the completed ZIP through authenticated endpoints. UI modal and browser download presentation remain in Phases 5–6.

</domain>

<decisions>
## Implementation Decisions

### Job API shape
- **D-01:** Use separate authenticated endpoints for job creation, status polling, and completed ZIP download.
- **D-02:** Start jobs with `POST /v1/episodes/:episodeId/artifacts/jobs` and a JSON body containing an allowlisted `artifacts` array.
- **D-03:** Poll with `GET /v1/episodes/:episodeId/artifacts/jobs/:jobId` and download with `GET /v1/episodes/:episodeId/artifacts/jobs/:jobId/download`.
- **D-04:** Return an opaque job ID and a JSON snapshot containing episode ID, requested/available/missing selectors, status, progress, filename, error, timestamps, and download information when complete.

### Progress and state semantics
- **D-05:** Use exactly `pending`, `processing`, `completed`, and `failed` states.
- **D-06:** Report monotonic integer progress from 0 to 100 using measurable archive stages; exact byte-level progress is not required.
- **D-07:** Do not mark a job completed until ZIP finalization, file close, and output existence have all succeeded.

### Missing artifacts and validation
- **D-08:** Preflight the selected canonical selectors before enqueueing and snapshot requested, available, and missing artifacts on the job.
- **D-09:** If at least one requested artifact exists, create a partial ZIP and expose missing selectors as a warning/result.
- **D-10:** If no requested artifacts exist, reject the request before creating a job with a consistent client-readable error; invalid selectors return `400` and unknown episodes return `404`.
- **D-11:** The API must resolve paths from episode identity and the canonical selector catalog only; it must never accept filenames or filesystem paths from the client.

### Job lifecycle and retention
- **D-12:** Persist job metadata in SQLite so status is available across separate requests and basic API restarts.
- **D-13:** Use opaque job IDs and job-specific temporary/final ZIP paths to prevent collisions.
- **D-14:** Prevent duplicate processing for an identical active episode/selector request, while allowing unrelated jobs to proceed according to the API's existing worker constraints.
- **D-15:** Remove incomplete ZIP output on failure and retain completed ZIPs for a short TTL (recommended 30–60 minutes), returning `404` for unknown or expired jobs.
- **D-16:** Job cancellation is deferred to the later download-management scope; Phase 4 only needs safe failure and retry behavior.

### the agent's Discretion

The planner may choose the exact SQLite table/repository shape, worker file boundaries, concrete progress stage weights, and whether the no-artifact response is `404` or `422`, provided the selected behavior is consistent, documented, and tested.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and phase scope
- `.planning/ROADMAP.md` — Phase 4 goal, requirements, dependencies, and success criteria.
- `.planning/REQUIREMENTS.md` — API-01 through API-05 and VAL-04 acceptance requirements.
- `.planning/PROJECT.md` — backend-owned business logic, auth, stack, and layout constraints.
- `.planning/phases/04-artifact-job-contract/04-RESEARCH.md` — verified sibling API baseline and recommended async contract.

### Frontend contract assumptions
- `docs/README.md` — backend contract assumptions and thin-frontend boundary.
- `docs/ARCHITECTURE.md` — API orchestration, authentication, and existing polling patterns.
- `docs/CONFIGURATION.md` — API base URL, auth bypass, and runtime contract.
- `.planning/codebase/ARCHITECTURE.md` — existing Angular service/page integration patterns.
- `.planning/codebase/INTEGRATIONS.md` — backend API and authentication integration inventory.

### Sibling API implementation
- `../dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` — canonical selectors, preflight, and safe artifact path resolution.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — existing synchronous artifact route and route/auth conventions.
- `../dragaocareca-admin-api/src/database/sqlite.ts` — SQLite schema and persistence conventions.
- `../dragaocareca-admin-api/src/services/episode-transcription.service.ts` — existing persisted worker/lifecycle pattern.
- `../dragaocareca-admin-api/src/workers/launch-notification.worker.ts` — existing serialized worker and overlap-guard pattern.
- `../dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts` — current artifact verification baseline to extend.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dragaocareca-admin-api/src/services/episode-artifact-download.service.ts`: preserve the selector catalog, preflight result, safe media-kind mapping, and existing `archiver` integration.
- `dragaocareca-admin-api/src/routes/episodes.routes.ts`: reuse authenticated episode-resource routing and error conventions.
- `dragaocareca-admin-api/src/services/episode-transcription.service.ts`: use as the closest persisted asynchronous lifecycle reference.
- `dragaocareca-admin-api/src/workers/launch-notification.worker.ts`: reuse serialized worker execution and active-run protection ideas.

### Established Patterns
- Backend routes use Express, bearer auth, Zod validation, and centralized API error handling.
- Backend persistence is SQLite-based; the frontend uses Angular `HttpClient` and bearer interception.
- The frontend already polls backend status endpoints and renders progress without owning business logic.
- `archiver` is already present in the API; no new ZIP dependency is needed.

### Integration Points
- API route registration and OpenAPI documentation in the sibling API.
- API SQLite schema/repository and worker startup lifecycle.
- Existing artifact verifier and API typecheck/test scripts.
- Future frontend `ApiService` integration in Phase 5, which depends on the finalized response shapes from this phase.

</code_context>

<specifics>
## Specific Ideas

- The user specifically wants a visible progress bar while the ZIP is being created, so progress must be meaningful and persisted rather than simulated only in the browser.
- The user accepted a backend job sequence, partial ZIP warnings, SQLite persistence, short-lived completed archives, and no cancellation in this phase.

</specifics>

<deferred>
## Deferred Ideas

- User cancellation of active ZIP jobs, batch downloads across multiple episodes, and download history belong to the later Download Management scope.

</deferred>

---

*Phase: 4-artifact-job-contract*
*Context gathered: 2026-07-29*
