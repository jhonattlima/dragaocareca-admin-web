# Phase 6: Browser Download & Release Validation - Context

**Gathered:** 2026-07-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete native browser delivery for the artifact ZIP job and validate the complete release flow, including partial, empty, failure, reset, retry, and the real DC 334 Season 3 fixture. This phase consumes the Episodes-tab modal and asynchronous job orchestration delivered in Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Native browser delivery
- **D-01:** Fetch the backend-provided `downloadUrl` as a Blob through Angular `HttpClient`, preserving authentication through the existing interceptor.
- **D-02:** Trigger one native browser download automatically as soon as the job reaches `completed`.
- **D-03:** Use the backend response’s `Content-Disposition` filename as the filename authority; Angular must not reconstruct a filename from the episode title or ID.
- **D-04:** Create a temporary object URL and revoke it after delivery. Do not add a ZIP, file-saver, or other download dependency.
- **D-05:** If automatic Blob delivery fails, keep the completed modal state open, show a clear download error, and offer a manual retry that reuses the completed archive without creating another artifact job.

### the agent's Discretion
The planner may choose the exact Blob response typing, anchor/object-URL cleanup timing, browser capability fallback, fixture seeding mechanism, validation fixture selectors, and concrete reset/retry copy, provided the roadmap success criteria, existing Phase 5 decisions, authentication boundary, and no-new-dependency constraint are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and requirements
- `.planning/ROADMAP.md` — Phase 6 goal, requirements UI-07/UI-08/VAL-01/VAL-02/VAL-03, and success criteria.
- `.planning/REQUIREMENTS.md` — browser delivery, recovery-state, DC 334 fixture, manual validation, and build requirements.
- `.planning/PROJECT.md` — thin Angular boundary, native browser download decision, authBypass, and milestone scope.
- `.planning/phases/05-episode-download-modal/05-CONTEXT.md` — completed modal lifecycle, partial-result, progress, and API orchestration decisions.
- `.planning/phases/05-episode-download-modal/05-VERIFICATION.md` — Phase 5 verified implementation and remaining browser-delivery boundary.

### Frontend and API contract
- `docs/README.md` — API base URL, auth modes, frontend feature map, and local runbook.
- `docs/ARCHITECTURE.md` — ApiService boundary, ManageComponent flow, polling patterns, and error handling.
- `docs/CONFIGURATION.md` — environment API URLs, authBypass behavior, and bearer-token assumptions.
- `.planning/codebase/INTEGRATIONS.md` — backend/auth integration and static frontend hosting assumptions.
- `.planning/codebase/TESTING.md` — Karma/Jasmine patterns and current browser-test limitations.
- `.planning/codebase/CONVENTIONS.md` — Angular service/component and UI feedback conventions.
- `src/app/core/api.service.ts` — artifact job snapshot contract and where Blob download orchestration belongs.
- `src/app/core/auth.interceptor.ts` — bearer authentication boundary for Blob requests.
- `src/app/pages/manage/manage.component.ts` — completed modal state, job polling, and terminal-state integration.
- `src/app/pages/manage/manage.component.html` — modal completion, warning, reset, and retry presentation.
- `src/app/pages/manage/manage.component.spec.ts` — existing artifact modal test seams.

### Sibling API and fixture
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — authenticated completed-download route and response headers.
- `../dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` — completed snapshot/download URL behavior and missing-artifact reporting.
- `../dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` — canonical artifact selectors and archive entry names.
- `../dragaocareca-admin-api/src/services/episode-media-layout.service.ts` — API media folder layout used for DC 334 fixture provisioning.
- `E:\Jhonatt\DC\_VersãoFinalParaPostagem\_Episódios - Season 3\DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras` — user-provided Windows fixture source to configure and manually inspect.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ApiService` already owns all HTTP calls and can expose a typed Blob download method using the existing `HttpClient`/interceptor path.
- `ManageComponent` already stores completed artifact snapshots, missing selectors, and retry state from Phase 5; Phase 6 should extend that terminal state rather than create a second job flow.
- Existing page-level success/error messaging and Bootstrap modal styling can present delivery/reset/retry feedback.

### Established Patterns
- Angular uses RxJS Observables and component-level `subscribe({ next, error })` handlers.
- Authentication is injected centrally through `AuthInterceptor`; direct unauthenticated navigation is not a safe download mechanism.
- The project uses native browser APIs where a dependency is unnecessary and keeps backend file logic out of Angular.
- Karma/Jasmine is the existing test runner; browser-level behavior may require a Chrome/Chromium-capable environment for final validation.

### Integration Points
- Add the completed-job Blob request and object-URL delivery at the existing ManageComponent terminal path.
- Preserve the Phase 5 job/polling state and avoid starting a second job for download retry.
- Add API/component tests for Blob response handling, filename/header behavior, cleanup, and retry/reset states.
- Configure the sibling API’s DC 334 media fixture and manually inspect the resulting archive entries.

</code_context>

<specifics>
## Specific Ideas

- The user accepted the authenticated Blob/object-URL approach and wants the browser download to start automatically at completion.
- The backend-provided filename is authoritative.
- Delivery failure must be recoverable without creating another artifact job.
- The provided DC 334 Season 3 Windows folder is the release-validation fixture.

</specifics>

<deferred>
## Deferred Ideas

- Cancellation, multi-episode batch downloads, and download history remain outside this milestone.
- Broader browser compatibility or an alternate download library is not part of this phase unless required by the existing browser target.

</deferred>

---

*Phase: 6-Browser Download & Release Validation*
*Context gathered: 2026-07-31*
