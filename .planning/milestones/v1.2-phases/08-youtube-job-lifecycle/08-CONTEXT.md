# Phase 8: YouTube Job Lifecycle - Context

**Gathered:** 2026-08-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the durable, server-owned YouTube trailer lifecycle from staged draft upload through Save-time publication: private transfer immediately after trailer staging, sanitized private-link feedback, persisted job state, polling/reload/restart recovery, safe retry, honest cancellation, Save-time metadata/publication, provider-video deletion on replacement/deletion, duplicate protection, and bounded operator-facing failures. Browser-side YouTube OAuth, direct provider calls, and raw provider details remain outside this phase.

</domain>

<decisions>
## Implementation Decisions

### Job trigger and operator status
- **D-01:** Start the private job automatically after a valid trailer upload reaches staged state, using the draft reservation and current title/summary; persisted episodes may still restore or retry the same job.
- **D-02:** Expose clear lifecycle states: `queued`, `uploading`, `processing`, `private-ready`, `failed`, and `canceled`.
- **D-03:** Show transfer percentage only for the upload stage. Processing must use honest indeterminate/progress messaging when YouTube does not provide a reliable percentage; never imply public publication.

### Retry and cancellation
- **D-04:** Retry is available for recoverable failures and must reuse/reconcile accepted provider work where possible instead of creating a duplicate video.
- **D-05:** Cancellation stops local polling/request work, but the UI must state that provider work already accepted may continue.
- **D-06:** If cancellation leaves a private provider video, expose a reconciliation-required state/link rather than claiming the provider operation was fully undone.

### Restart, duplicate safety, and identity
- **D-07:** Persist jobs in the API and restore their status after browser reload or API restart through authenticated polling.
- **D-08:** Enforce one active job per episode and finalized trailer source identity. Repeated starts return or reuse the existing active job, or fail with an actionable conflict; they must not create duplicate active jobs or provider videos.
- **D-09:** Bind job updates to the episode and trailer source fingerprint/version so an older job cannot update a newer local trailer.

### Failure messaging and security
- **D-10:** Present stable operator-facing categories for authentication, quota, timeout, network/provider failure, invalid trailer, and reconciliation-required states.
- **D-11:** Keep provider credentials, OAuth tokens, raw Google payloads, filesystem paths, internal stack traces, and raw provider identifiers out of browser-visible job DTOs and logs; a validated sanitized `privateWatchUrl` is allowed once provider video evidence exists.
- **D-12:** Every failure state must communicate whether retry is available and, when relevant, the next retry time or reconciliation action.

### the agent's Discretion
- Exact endpoint names/DTO field names where the existing sibling API contract already provides a safe equivalent.
- Exact polling interval, worker scheduling details, persistence schema mechanics, and provider SDK implementation.
- Exact Bootstrap card layout, copy, icons, and indeterminate-processing presentation within the existing sectioned admin UI.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/PROJECT.md` — project boundary, backend-owned business logic, auth and layout constraints.
- `.planning/REQUIREMENTS.md` — `YOUTUBE-01` through `YOUTUBE-05` and `OPS-01` through `OPS-04`.
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria, dependencies, and boundaries.
- `.planning/STATE.md` — milestone decisions, provider/reconciliation concerns, and prior Phase 7 integration context.
- `.planning/phases/07-final-trailer-video-upload/07-CONTEXT.md` — finalized local trailer lifecycle, source identity, and explicit Phase 8 boundary.
- `.planning/phases/07-final-trailer-video-upload/07-VERIFICATION.md` — prior verification findings and compatibility expectations.

### Frontend architecture
- `docs/README.md` — product/UI assumptions and current workflow.
- `docs/ARCHITECTURE.md` — Angular page/API responsibility split and sectioned layout.
- `docs/CONFIGURATION.md` — environment and `authBypass` assumptions.
- `.planning/codebase/ARCHITECTURE.md` — ManageComponent, ApiService, and component-local state patterns.
- `.planning/codebase/INTEGRATIONS.md` — authenticated backend boundary and existing YouTube metrics integration.
- `.planning/codebase/TESTING.md` — Angular/Karma/Jasmine testing conventions and current browser-runner limitations.
- `src/app/pages/manage/manage.component.ts` — episode editor state, media workflow, and polling/teardown patterns.
- `src/app/core/api.service.ts` — typed authenticated HTTP boundary and existing episode/media wrappers.

### Sibling API YouTube implementation
- `../dragaocareca-admin-api/README.md` — existing API configuration, YouTube credentials, and media contract.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — current YouTube trailer start/status/cancel route surface and auth boundary.
- `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` — durable job state, idempotency, source identity, recovery, and public DTO mapping.
- `../dragaocareca-admin-api/src/services/youtube-trailer-upload.provider.ts` — provider adapter, private upload, resumability, and provider error boundary.
- `../dragaocareca-admin-api/src/workers/youtube-trailer-job.worker.ts` — background processing and restart recovery.
- `../dragaocareca-admin-api/src/database/repositories/youtube-trailer-job.repository.ts` — persisted job identity/state/progress/provider metadata.
- `../dragaocareca-admin-api/src/scripts/verify-youtube-trailer-job-lifecycle.ts` — lifecycle, retry, duplicate, cancellation, and recovery verification.
- `../dragaocareca-admin-api/src/docs/openapi.ts` — public DTO/schema and sensitive-field exclusion contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ApiService` — central authenticated HTTP service for start/status/cancel calls and response typing.
- `ManageComponent` editor-local state and existing polling/teardown helpers — suitable for a YouTube job state machine without adding a global store.
- Existing sectioned File Management/media cards — provide the visual and interaction pattern for a separate YouTube lifecycle section.
- Sibling API `youtube-trailer-job.service.ts` and worker — existing backend-owned durable job foundation to validate and extend rather than duplicate.

### Established Patterns
- Business logic and provider credentials remain in the backend; Angular only orchestrates authenticated calls and renders returned state.
- Component-local state, RxJS subscriptions, explicit teardown, and stale-generation guards are the established frontend approach.
- Backend DTOs are sanitized before reaching the browser; raw provider errors and credentials are not client data.
- Existing workers persist/recover long-running jobs and use bounded user-visible states.

### Integration Points
- Add YouTube start/status/cancel wrappers at `src/app/core/api.service.ts`.
- Add job state, polling, retry, cancellation, stale-source protection, and UI presentation in the manage episode workflow without mixing it into local MP4 upload progress.
- Coordinate frontend DTO assumptions with the sibling API routes, service, repository, worker, provider adapter, OpenAPI contract, and lifecycle verifier.
- Preserve existing summary, episode editing, local trailer upload, artifact flow, auth interceptor, and `authBypass` behavior.

</code_context>

<specifics>
## Specific Ideas

- The operator should see one clear action to start YouTube transfer and a truthful staged lifecycle, not one generic progress bar that implies publication.
- A private video left after cancellation is a recoverable reconciliation outcome, not an invisible failure.
- Repeated clicks, page reloads, API restarts, and replacement of the local trailer must not create or display duplicate/stale jobs.

</specifics>

<deferred>
## Deferred Ideas

- Public publishing, richer editable title assembly, 100-Unicode-character validation, hashtag lookup/count, and YouTube link persistence after publishing — Phase 9. The basic title/summary accepted by the Phase 8 start request is in scope.
- Full end-to-end placement of every YouTube control in the final operator workflow and compatibility release integration — Phase 10.
- Adding finalized `trailer-video` to the Episodes artifact modal and ZIP flow — Phase 11.
- Scheduled publication, playlists, thumbnails, captions, analytics, batch operations, and automatic replacement/deletion of already-public videos — future scope.

</deferred>

---

*Phase: 08-youtube-job-lifecycle*
*Context gathered: 2026-08-11*
