# Phase 5: Episode Download Modal - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Add an artifact-download action to each persisted episode row in the Episodes tab, open an accessible artifact picker for that episode, and orchestrate one asynchronous artifact ZIP job with modal-local progress and recoverable states. This phase does not change the Add episode tab and does not own native browser ZIP delivery, which remains in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Artifact availability and selection
- **D-01:** Determine initial artifact availability from the existing episode row filename fields; do not add a preflight request when opening the modal.
- **D-02:** Map fields to the canonical selectors: episode file → `episode`, trailer → `trailer`, cover art → `image`, low cover art → `image-low`, transcript → `transcript`.
- **D-03:** Treat a trimmed non-empty filename as available. The backend remains authoritative if the filesystem changes after the modal opens.
- **D-04:** Show all five options in a fixed order: Episode audio, Trailer, Cover art, Low cover art (.webp), Transcript.
- **D-05:** Check every currently available option by default. Keep unavailable options visible, disabled, unchecked, and labeled “Unavailable — file not uploaded.”
- **D-06:** Use human-readable labels with file-format hints. Show the stored filename as secondary text, truncating long names with an ellipsis and exposing the full value through a tooltip.
- **D-07:** Recompute availability and reset all available options to checked whenever the modal is reopened; do not persist selections.
- **D-08:** If no artifacts are available, open the modal with all options disabled, explain the empty state, and disable confirmation.
- **D-09:** If a selected artifact disappears before submission, submit the canonical selectors and surface the backend’s partial/missing result. If the backend reports all selected files unavailable, refresh the options as unavailable and show a retryable “No selected files are currently available” message.

### Modal lifecycle and API orchestration
- **D-10:** Place the action only in the Episodes tab’s episode list; it must not affect the Add episode tab or its existing upload/transcript progress.
- **D-11:** Closing the modal after a job starts dismisses the view but does not cancel the backend job, because cancellation is not part of the API contract.
- **D-12:** Reopening the action during the current page session resumes the current job state and polling instead of creating a duplicate job.
- **D-13:** Keep the modal open after completion and show “Archive ready” with the backend-provided download URL. Native browser download behavior is deferred to Phase 6.
- **D-14:** On failure, keep the modal open, preserve selections, show the error, and offer Retry and Close. Retry creates a new job only after the previous job is terminal.
- **D-15:** Poll the Phase 4 status endpoint while a job is pending or processing. Treat temporary polling failures as recoverable and do not start a duplicate job.

### Progress and partial results
- **D-16:** Use a distinct progress bar inside the download modal; it is separate from the Add episode tab’s progress UI.
- **D-17:** Place the progress bar below the artifact list and above the action buttons.
- **D-18:** Show user-facing stages: “Preparing files”, “Creating ZIP”, “Finalizing ZIP”, and “Archive ready”, with the API percentage beside the stage label (for example, “Creating ZIP — 65%”).
- **D-19:** Use a determinate bar for valid API percentages. If a processing snapshot has no usable percentage, temporarily use an indeterminate bar while continuing to poll.
- **D-20:** Show partial-result warnings inside the modal near the progress/status area as soon as the API reports them, using neutral wording that lists human-readable names. A completed partial job shows both “Archive ready” and the warning.

### Row action and accessibility
- **D-21:** Add a dedicated Downloads column to the Episodes table rather than placing the action beside Edit/Delete.
- **D-22:** Use an icon-only native button with a tooltip and accessible label such as “Download episode artifacts”.
- **D-23:** Use normal native button keyboard behavior, visible focus styling, Tab, Enter, and Escape behavior. Move focus to the modal heading or first checkbox on open and return focus to the row download button on close.

### the agent's Discretion
The planner may choose the concrete icon asset, component extraction boundary, polling interval, exact API response type names, and the implementation used to retain active job state during the page session, provided the decisions above and existing Angular conventions are preserved.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and phase scope
- `.planning/ROADMAP.md` — Phase 5 goal, requirements, success criteria, and Phase 6 boundary.
- `.planning/REQUIREMENTS.md` — UI-01 through UI-06 acceptance requirements and UI-07/UI-08/validation boundary.
- `.planning/PROJECT.md` — thin frontend boundary, authBypass, legacy-inspired layout, and milestone scope.
- `.planning/phases/04-artifact-job-contract/04-CONTEXT.md` — locked API job endpoints, selectors, states, progress, partial results, and cancellation boundary.

### Frontend architecture and contract assumptions
- `docs/README.md` — frontend feature map, backend contract assumptions, auth modes, and local runbook.
- `docs/ARCHITECTURE.md` — ManageComponent flow, ApiService boundary, existing polling patterns, and error handling.
- `docs/CONFIGURATION.md` — API base URL, authBypass behavior, and Angular runtime configuration.
- `.planning/codebase/CONVENTIONS.md` — Angular naming, template-driven state, service orchestration, and UI feedback conventions.
- `.planning/codebase/STRUCTURE.md` — source locations and where feature code/tests belong.
- `.planning/codebase/STACK.md` — Angular 15, Bootstrap 5.3.8, RxJS, and browser constraints.

### Existing implementation integration points
- `src/app/core/api.service.ts` — shared Episode model, HTTP orchestration, and where artifact job types/methods belong.
- `src/app/pages/manage/manage.component.ts` — episode-list state, polling/timer patterns, and row actions.
- `src/app/pages/manage/manage.component.html` — Episodes-tab table, pagination, existing modal markup, and action-column layout.
- `src/app/pages/manage/manage.component.scss` — existing table, modal, focus, and responsive styling patterns.
- `src/app/pages/manage/manage.component.spec.ts` — current ManageComponent test boundary.
- `src/app/app.module.ts` — component declarations and Angular module imports.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — Phase 4 artifact job routes and response behavior.
- `../dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` — public status snapshot and download URL semantics.
- `../dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` — canonical selector vocabulary and artifact catalog mapping.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ManageComponent` owns episode filtering, pagination, row actions, timers, and page-level messages; extend this state boundary or extract only tightly scoped modal state.
- `ApiService` centralizes all Angular HTTP calls and already exposes transcript/summary status types; add artifact job request/status methods there.
- Existing delete/reset modal markup and SCSS provide the legacy-inspired backdrop, dialog, button, and responsive styling baseline.
- Existing `AuthInterceptor` supplies the bearer token for artifact job requests and downloads.

### Established Patterns
- Template-driven Angular forms and component-owned mutable state are the established approach.
- HTTP requests use RxJS `Observable` subscriptions with component-level success/error handling.
- Existing long-running workflows use timer-based polling and tear down timers on component destruction or terminal state.
- The Episodes tab is a sectioned Bootstrap table; feature work should extend it without replacing the layout.

### Integration Points
- Add the new row action only to `manage.component.html` under the Episodes tab.
- Add the modal to the Manage page template and styles; it is not part of `episode-form.component.*`.
- Add API start/status orchestration in `ApiService` and `ManageComponent`.
- Add focused unit coverage for selector payloads, availability/default checks, lifecycle states, duplicate prevention, and polling cleanup.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly clarified that the button belongs in each episode row inside the Episodes tab and has nothing to do with the Add episode tab.
- The user wants a progress bar inside the modal after pressing the download confirmation button.
- Existing episode filename fields are the UI availability source; backend responses handle races and partial results.

</specifics>

<deferred>
## Deferred Ideas

- Native browser ZIP download and object URL cleanup remain in Phase 6.
- API job cancellation, batch downloads, and download history remain outside this milestone scope.

</deferred>

---

*Phase: 5-Episode Download Modal*
*Context gathered: 2026-07-30*
