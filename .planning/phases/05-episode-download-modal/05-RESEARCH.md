# Phase 5: Episode Download Modal - Research

**Researched:** 2026-07-30
**Domain:** Angular 15 episode-list UI, accessible custom modal, authenticated asynchronous artifact-job orchestration
**Confidence:** HIGH for repository/API facts; MEDIUM for accessibility guidance applied to this custom modal

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)
- Native browser ZIP download and object URL cleanup remain in Phase 6.
- API job cancellation, batch downloads, and download history remain outside this milestone scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-01 | The user can see an artifact-download action on each episode row. | Extend the Episodes table with a dedicated Downloads column and native icon button; keep it out of the Add episode tab. |
| UI-02 | The user can open a download modal for the selected episode. | Reuse the existing Manage page custom backdrop/dialog baseline and add explicit dialog labeling/focus lifecycle. |
| UI-03 | The modal offers episode file, trailer, cover art, low cover art (`.webp`), and transcript options. | Use the five-field-to-selector mapping and fixed order documented below. |
| UI-04 | All available artifact options are checked by default, while unavailable options are clearly disabled or omitted. | Derive availability from trimmed row filename fields; preserve unavailable rows as disabled/unchecked with the locked message. |
| UI-05 | The user can select or deselect artifacts before confirming the download. | Use native checkbox inputs and submit only selected canonical selector values; validate the empty selection locally. |
| UI-06 | After confirmation, the modal shows ZIP-generation progress and prevents duplicate submissions. | Start one job, retain per-episode page-session job state, poll the status endpoint at a single cadence, stop on terminal state, and disable start/retry while active. |
</phase_requirements>

## Summary

The frontend integration is a thin extension of `ManageComponent` and `ApiService`. The persisted episode row already contains the five filename fields needed for initial availability, while the sibling API owns filesystem truth, selector validation, partial results, ZIP preparation, retention, and authenticated delivery. The frontend must send canonical selector strings only; it must never send filenames or paths. `[VERIFIED: codebase grep]`

The Phase 4 API is implemented and differs from earlier planning sketches in an important way: the public snapshot uses `state`, not `status`. It returns `jobId`, `episodeId`, `requested`, `available`, `missing`, `state`, integer `progress`, `stateText`, `queuePosition`, `downloadUrl`, `expiresAt`, `error`, and timestamps. Start returns the snapshot with HTTP 202 for a queued job or 200 for a cache hit/completed active result; status polling returns the same snapshot; the download URL is a separate authenticated binary endpoint and must not be invoked in Phase 5. `[VERIFIED: sibling API source]`

**Primary recommendation:** Add typed start/status methods to `ApiService`, keep a per-episode active-job map and one polling timer in `ManageComponent`, render a native-checkbox custom dialog in the existing Manage template/styles, and map API state/progress/missing selectors into the locked user-facing modal states.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Row download affordance and artifact picker | Browser / Client | — | The Angular Manage page owns table presentation, checkbox state, labels, and modal lifecycle. `[VERIFIED: docs/ARCHITECTURE.md; codebase grep]` |
| Initial artifact availability | Browser / Client | API / Backend | The modal must derive its initial state from `Episode` filename fields; the backend remains authoritative at job creation. `[VERIFIED: 05-CONTEXT.md; sibling API source]` |
| Selector validation and filesystem resolution | API / Backend | Database / Storage | The API allowlists selectors and resolves episode media paths; the client must not reproduce or replace that business rule. `[VERIFIED: sibling API source]` |
| ZIP job lifecycle and progress | API / Backend | Database / Storage | SQLite/job service persists state and the worker owns preparation; Angular only starts and polls. `[VERIFIED: Phase 4 context; sibling API source]` |
| Modal-local progress/error/partial-result presentation | Browser / Client | API / Backend | The client maps snapshots to messages, while the API supplies progress, error, and missing selector data. `[VERIFIED: 05-CONTEXT.md; sibling API source]` |
| Native ZIP delivery | Browser / Client | API / Backend | The API download route exists, but browser delivery is explicitly deferred to Phase 6. `[VERIFIED: 05-CONTEXT.md; sibling API source]` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 15.x from package manifest | Component/template rendering and lifecycle | Existing application framework; do not introduce a new UI framework. `[VERIFIED: package.json]` |
| `@angular/common/http` | 15.x from package manifest | Typed start/status HTTP calls | `ApiService` already centralizes all API calls and `AuthInterceptor` supplies bearer auth. `[VERIFIED: package.json; codebase grep]` |
| RxJS | `~7.5.0` from package manifest | Observable subscriptions and request completion handling | Existing polling and upload flows use RxJS subscriptions and `finalize`. `[VERIFIED: package.json; codebase grep]` |
| Bootstrap | `^5.3.8` from package manifest | Existing table/button/layout styling | Global stylesheet imports Bootstrap and the Manage page already uses Bootstrap table, grid, button, and form classes. `[VERIFIED: package.json; codebase grep]` |

### Supporting

| API shape | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `POST /v1/episodes/:episodeId/artifacts/jobs` | Phase 4 sibling API | Create one artifact job from canonical selectors | Only after local nonempty-selection validation; send `{ artifacts: string[] }`. `[VERIFIED: sibling API source]` |
| `GET /v1/episodes/:episodeId/artifacts/jobs/:jobId` | Phase 4 sibling API | Poll public job snapshot | While `state` is `pending` or `processing`; stop for `completed`/`failed`. `[VERIFIED: sibling API source]` |
| `GET .../download` | Phase 4 sibling API | Completed ZIP binary delivery | Do not call in Phase 5; Phase 6 owns browser download behavior. `[VERIFIED: 05-CONTEXT.md; sibling API source]` |

**Installation:** No new package is recommended. Reuse native HTML controls and existing Bootstrap/CSS. `[VERIFIED: package.json; codebase grep]`

## API Contract and Response Details

### Selector and row-field mapping

| UI row field | Canonical selector | Human label | Format hint | Availability rule |
|--------------|-------------------|-------------|-------------|-------------------|
| `fileName` | `episode` | Episode audio | `.mp3` | `fileName?.trim().length > 0` |
| `trailerFileName` | `trailer` | Trailer | `.mp3` | `trailerFileName?.trim().length > 0` |
| `coverFileName` | `image` | Cover art | `.jpeg`/`.jpg` | `coverFileName?.trim().length > 0` |
| `coverLowFileName` | `image-low` | Low cover art | `.webp` | `coverLowFileName?.trim().length > 0` |
| `transcriptFileName` | `transcript` | Transcript | `.txt` | `transcriptFileName?.trim().length > 0` |

The UI order is fixed as episode, trailer, image, image-low, transcript, even though the API catalog source lists transcript before image/image-low. The client should use a local readonly definition array in the locked UI order and map each definition to its selector. `[VERIFIED: 05-CONTEXT.md; sibling API source]`

### Start request and snapshot

```typescript
// Recommended frontend request shape; endpoint is verified in sibling API.
{ artifacts: selectedSelectors }
```

The sibling route validates a nonempty array containing only `episode`, `trailer`, `transcript`, `image`, or `image-low`; unknown episode is 404; zero available requested files is 404 with `No requested artifacts found`; valid partial requests create a job. `[VERIFIED: sibling API source]`

Use a frontend type equivalent to:

```typescript
export type EpisodeArtifactJobState = 'pending' | 'processing' | 'completed' | 'failed';

export interface EpisodeArtifactJobSnapshot {
  jobId: string;
  episodeId: number;
  requested: EpisodeArtifactSelector[];
  available: EpisodeArtifactSelector[];
  missing: EpisodeArtifactSelector[];
  state: EpisodeArtifactJobState;
  progress: number;
  stateText: string;
  queuePosition: number | null;
  downloadUrl: string | null;
  expiresAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}
```

The exact public API fields above are verified from `episode-artifact-preparation.service.ts`; do not name the field `status` or expect `filename` in the current implementation. `downloadUrl` is populated only for `completed`, and the sibling download route returns `application/zip`, a safe `Content-Disposition` filename, and `X-Missing-Artifacts`; Phase 5 should display the URL but leave binary delivery to Phase 6. `[VERIFIED: sibling API source]`

### State-to-UI mapping

| API snapshot | Modal presentation | Polling |
|--------------|--------------------|---------|
| `pending` | “Preparing files” plus API percentage; optionally include queue position as supporting text | Continue |
| `processing` with usable integer 0–100 | Map API stage/progress to “Preparing files”, “Creating ZIP”, or “Finalizing ZIP” and show `— N%` | Continue |
| `processing` with missing/invalid percentage | Same stage mapping, indeterminate progress bar, no fabricated percentage | Continue |
| `completed` | “Archive ready”, determinate 100% bar, backend `downloadUrl`, and any missing-artifact warning | Stop |
| `failed` | Error text, preserve selections, enable Retry and Close | Stop |

The API’s current `stateText` values are “Queued for preparation”, “Preparing artifact snapshot”, “Assembling archive”, “Finalizing archive”, and “Archive ready”. Because D-18 requires different user-facing stage labels, use a small mapping helper based on state/progress rather than displaying `stateText` verbatim. `[VERIFIED: sibling API source; 05-CONTEXT.md]`

## Architecture Patterns

### System Architecture Diagram

```text
Episodes table row
  -> native Downloads button
  -> modal builds availability from Episode filename fields
  -> user checks/unchecks canonical selectors
  -> ApiService POST /episodes/:id/artifacts/jobs
       -> 202/200 EpisodeArtifactJobSnapshot
  -> ManageComponent stores job by episodeId
  -> one GET status poller while pending/processing
       -> update progress, stage, missing warnings
       -> completed: show Archive ready + downloadUrl
       -> failed: show error + Retry/Close
  -> modal close hides view only; job/poller state remains for page session
```

### Recommended Project Structure

Keep the feature in existing files; no new route or module is needed:

```text
src/app/core/api.service.ts                         # selector/state types + start/status methods
src/app/pages/manage/manage.component.ts            # modal state, job map, polling, focus hooks
src/app/pages/manage/manage.component.html          # Downloads column + modal markup
src/styles.scss                                     # existing global Manage/modal styles
src/app/pages/manage/manage.component.spec.ts       # focused state/API/polling tests
```

`manage.component.scss` currently contains only a comment; actual page/modal styles live in `src/styles.scss`, so placing new styles in the component stylesheet would diverge from the established pattern. `[VERIFIED: codebase grep]`

### Pattern 1: Per-episode session job state

Use a `Record<number, EpisodeArtifactJobSnapshot>` or `Map<number, EpisodeArtifactJobSnapshot>` plus the selected episode/modal view state. Opening a row recomputes availability and defaults only when there is no active nonterminal job for that episode; reopening an active row displays its stored snapshot and continues/ensures polling instead of POSTing again. Clear only terminal state when the user explicitly starts a new retry, and never clear it merely because the modal closes. This satisfies D-11/D-12 and also protects against duplicate submissions caused by repeated clicks. `[VERIFIED: 05-CONTEXT.md; sibling API duplicate-active behavior]`

### Pattern 2: Single guarded polling interval

Follow the existing Manage polling pattern: store timer and job identity, start one immediate refresh, then `window.setInterval(refresh, 2000)`, guard when the same job is already active, clear on `completed`/`failed`, and clear all timers in `ngOnDestroy`. The existing summary/transcription pollers use this exact 2-second cadence and clear on terminal/error. `[VERIFIED: codebase grep]`

For D-15, a transient status request error should update a recoverable polling-error message but should not POST a new job or create a second timer. A practical implementation is to keep the active job ID and timer alive, let the next interval retry, and expose the latest error near the status area; if the component treats a terminal HTTP error as unrecoverable, it must provide an explicit retry-status action without creating a new job. The locked requirement is “do not start a duplicate job.” `[VERIFIED: 05-CONTEXT.md; codebase polling pattern]`

### Pattern 3: Native controls inside a custom dialog

Use a native `<button type="button">` for the icon-only row action and native `<input type="checkbox">` elements for artifact selection. The dialog should have `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to a visible heading. Add an explicit close/cancel button with an accessible name. On open, focus the heading (`tabindex="-1"`) or first enabled checkbox; on Escape or close, return focus to the exact row button that opened the dialog. WAI-ARIA APG specifies focus entry, containment, Escape, and return-to-invoker behavior for modal dialogs. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]`

Because this project does not currently depend on Angular Material/CDK and no new package is needed, implement the small focus lifecycle directly. If the implementation uses a custom dialog, it must also trap Tab/Shift+Tab within the modal; simply adding ARIA attributes does not provide keyboard behavior. Angular’s current accessibility guidance identifies CDK focus trapping as the standard solution for custom dialogs, but adding it would be a new dependency decision outside the locked scope. `[CITED: https://angular.dev/best-practices/a11y; VERIFIED: package.json]`

### Pattern 4: Partial-result transformation

Keep selector-to-label metadata in one local definition array. Transform `snapshot.missing` through that array to human-readable names and render a neutral warning near the progress/status area. Do not expose raw selector tokens alone, and do not treat `missing` as a failure when `state === 'completed'`; a completed partial archive must show both “Archive ready” and the warning. `[VERIFIED: 05-CONTEXT.md; sibling API source]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Artifact path/filesystem lookup | Client path logic or filename-to-path concatenation | Existing API selector catalog and preflight | Backend owns allowlisting and filesystem authority; client row filenames are only an initial availability hint. `[VERIFIED: sibling API source]` |
| ZIP creation or client ZIP parsing | Browser ZIP assembly, object URLs, or file-saver flow | Phase 4 API job; Phase 6 browser delivery | Explicit phase boundary defers native delivery and keeps business logic backend-owned. `[VERIFIED: 05-CONTEXT.md; AGENTS.md]` |
| Modal semantics | A clickable `<div>` pretending to be a button/dialog | Native buttons/checkboxes plus explicit dialog/focus behavior | Native controls provide keyboard behavior; ARIA alone does not implement focus containment. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/; https://angular.dev/guide/aria]` |
| Job deduplication | Blind POST on every modal open or click | Per-episode active-job state plus guarded polling | D-12 forbids duplicate jobs during the page session; API also suppresses identical active creation. `[VERIFIED: 05-CONTEXT.md; sibling API source]` |
| Progress simulation | Client-side fake timer/percentage | API `progress` and state snapshot | The backend reports persisted measurable archive stages; client only formats them. `[VERIFIED: sibling API source; Phase 4 context]` |

## Common Pitfalls

### Pitfall 1: Modeling the wrong API fields
**What goes wrong:** The client expects `status`, `filename`, or a `downloadUrl` object based on the earlier design sketch and fails against the implemented sibling API.
**Why it happens:** Phase 4 research contained recommended/assumed shapes before implementation; the final service exposes `state`, `stateText`, and `downloadUrl`.
**How to avoid:** Type and test the current `EpisodeArtifactPreparationStatus` shape directly; assert `state` transitions and `downloadUrl` only on completion.
**Warning signs:** Type casts to `any`, undefined status text, or a completed modal with no URL. `[VERIFIED: sibling API source; Phase 4 research history]`

### Pitfall 2: Treating row filenames as authoritative
**What goes wrong:** A file deleted after modal open causes a client-side rejection or stale success assumption.
**Why it happens:** Availability is intentionally optimistic UI state, while API preflight is authoritative.
**How to avoid:** Submit selected canonical selectors; handle 404/no-requested-artifacts and `missing` snapshot responses as recoverable UI states. `[VERIFIED: 05-CONTEXT.md; sibling API source]`

### Pitfall 3: Poller multiplication and duplicate jobs
**What goes wrong:** Reopening the modal or clicking confirm repeatedly starts multiple intervals or POST requests.
**Why it happens:** Modal visibility is confused with job lifecycle.
**How to avoid:** Gate start on active nonterminal job state, retain state after close, identify the poller by episode/job ID, and clear it only at terminal state or component destruction. `[VERIFIED: 05-CONTEXT.md; codebase polling pattern]`

### Pitfall 4: Losing focus or allowing background tabbing
**What goes wrong:** Keyboard users tab into the episode table behind the modal, Escape does nothing, or focus is lost on close.
**Why it happens:** Existing delete modal has semantic dialog attributes but no demonstrated focus trap/lifecycle.
**How to avoid:** Add open/close focus handling, a visible close button, Escape handling, Tab wrapping, visible focus styling, and tests for invoker focus restoration. `[VERIFIED: codebase grep; CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]`

### Pitfall 5: Reusing Add-tab progress state
**What goes wrong:** Artifact progress overwrites upload/transcription/summary progress or appears in the wrong tab.
**Why it happens:** `ManageComponent` already owns several progress fields and timers.
**How to avoid:** Use dedicated artifact modal state/timer fields; do not add artifact state to `EpisodeFormState` or `uploadStates`. `[VERIFIED: 05-CONTEXT.md; codebase grep]`

### Pitfall 6: Hiding partial completion as failure
**What goes wrong:** A valid ZIP with one missing file is shown as failed, or the warning is shown only before completion.
**Why it happens:** `missing` is mistaken for an error field.
**How to avoid:** Render missing selectors as a warning immediately when present and keep the warning alongside “Archive ready” after completion. `[VERIFIED: 05-CONTEXT.md; sibling API source]`

## Code Examples

### API methods

```typescript
startEpisodeArtifactJob(
  episodeId: number,
  artifacts: EpisodeArtifactSelector[]
): Observable<EpisodeArtifactJobSnapshot> {
  return this.http.post<EpisodeArtifactJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs`,
    { artifacts }
  );
}

getEpisodeArtifactJobStatus(
  episodeId: number,
  jobId: string
): Observable<EpisodeArtifactJobSnapshot> {
  return this.http.get<EpisodeArtifactJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/jobs/${jobId}`
  );
}
```

This follows the existing `ApiService` direct URL/typed `HttpClient` pattern and receives bearer auth through the existing interceptor. `[VERIFIED: codebase grep; sibling API source]`

### Progress normalization

```typescript
const progress = typeof snapshot.progress === 'number' && Number.isFinite(snapshot.progress)
  ? Math.max(0, Math.min(100, Math.round(snapshot.progress)))
  : null;
const determinate = progress !== null;
```

Use `determinate` to choose the progress-bar mode. Do not turn a missing processing percentage into 0% if D-19 requires an indeterminate visual. `[VERIFIED: 05-CONTEXT.md; sibling API progress clamp]`

### Focus lifecycle seam

```typescript
private downloadInvoker: HTMLButtonElement | null = null;

openArtifactModal(episode: Episode, invoker: HTMLButtonElement): void {
  this.downloadInvoker = invoker;
  // Set modal state, then use window.setTimeout(..., 0) to focus the heading/first checkbox.
}

closeArtifactModal(): void {
  this.downloadModalOpen = false;
  window.setTimeout(() => this.downloadInvoker?.focus(), 0);
  this.downloadInvoker = null;
}
```

The exact extraction boundary is discretionary; the seam must preserve focus when Angular removes/recreates modal DOM through `*ngIf`. `[VERIFIED: existing Angular template uses *ngIf; CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]`

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma 6.4 + Jasmine 4.5 via Angular CLI 15. `[VERIFIED: package.json; .planning/codebase/TESTING.md]` |
| Config file | `angular.json` / `tsconfig.spec.json`. `[VERIFIED: .planning/codebase/TESTING.md]` |
| Quick run command | `npm test -- --watch=false --browsers=ChromeHeadless` `[ASSUMED: conventional Angular CLI headless invocation; verify locally if ChromeHeadless is unavailable]` |
| Full suite command | `npm test -- --watch=false --browsers=ChromeHeadless` `[ASSUMED: no separate full-suite script exists; verify locally]` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Downloads column/action exists only in Episodes table and button has accessible label/title | component DOM | `npm test -- --watch=false --browsers=ChromeHeadless` | `manage.component.spec.ts` exists; add tests |
| UI-02 | Opening a row captures episode/invoker and creates labeled modal | component | same | add tests |
| UI-03 | Five selectors render in fixed order with correct labels/format hints | component/pure helper | same | add tests |
| UI-04 | Trimmed filenames determine defaults; unavailable entries disabled/unchecked; no-file state disables confirm | pure helper/component | same | add tests |
| UI-05 | Checkbox changes produce only selected canonical selectors; empty selection does not call API | component/service seam | same | add tests |
| UI-06 | Start is single-shot, status polls, progress/stage updates, terminal state stops polling, retry waits for failure terminal | component with spy Observables/timer control | same | add tests |
| Cross-cutting | Escape, Tab/Shift+Tab containment, visible focus, focus return, close-after-start preserves job | keyboard/component | same | add tests |

### Wave 0 Gaps

- Add artifact start/status spies to the existing `ApiService` Jasmine spy object; current spec only mocks transcription/summary methods. `[VERIFIED: manage.component.spec.ts]`
- Add focused pure-helper tests for field/selector mapping, trimmed availability, default selection, labels, progress normalization, and missing-selector wording.
- Add timer-controlled tests for immediate poll, duplicate poll prevention, terminal cleanup, transient status error recovery, retry after failure, and `ngOnDestroy` cleanup.
- Add DOM/keyboard tests for modal ARIA attributes, icon-button label/title, disabled unavailable checkboxes, Escape, focus restoration, and no accidental Add-tab impact.
- Existing root `app.component.spec.ts` is stale per project map; it is not a Phase 5 feature seam, but `npm test` may require it to be repaired or excluded by the implementation wave. `[VERIFIED: .planning/codebase/TESTING.md]`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Angular build/tests | ✓ | v24.17.0 observed | — `[VERIFIED: environment probe]` |
| npm | dependency/build commands | ✓ | 12.0.1 observed | — `[VERIFIED: environment probe]` |
| Angular CLI | build/test execution | command path found; version probe did not complete in the bounded check | — | Use local `npm run build`/`npm test`, which invoke project tooling. `[VERIFIED: environment probe; package.json]` |
| Frontend `node_modules` | local build/tests | not confirmed in bounded probe | — | Install dependencies only if the execution phase permits; no feature package is needed. `[VERIFIED: environment probe]` |
| Sibling API checkout | contract inspection/integration | ✓ | source present | Local frontend mocks/unit tests if API is not running. `[VERIFIED: environment probe]` |

No external browser service or new package is required to plan the phase. Runtime API availability is useful for manual integration but not required for component unit tests. `[VERIFIED: project docs; package.json]`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Keep `ApiService` calls behind existing `AuthInterceptor`; do not bypass auth for artifact endpoints. `[VERIFIED: docs/CONFIGURATION.md; sibling API source]` |
| V3 Session Management | yes | Preserve the existing token/interceptor flow; do not store job IDs or URLs as long-lived credentials. `[VERIFIED: docs/CONFIGURATION.md; AGENTS.md]` |
| V4 Access Control | yes | API remains authoritative for episode ownership/auth and status/download access; frontend must not infer authorization from row visibility. `[VERIFIED: sibling API source]` |
| V5 Input Validation | yes | Submit only fixed canonical selector union and positive episode ID from persisted row data; backend validates again. `[VERIFIED: sibling API source]` |
| V6 Cryptography | no new client cryptography | Do not add client-side signing or token handling; reuse centralized bearer auth. `[VERIFIED: docs/ARCHITECTURE.md]` |

### Known Threat Patterns for Angular artifact orchestration

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client submits filename/path instead of selector | Tampering / Elevation | Send only canonical selector strings; API resolves paths from episode identity. `[VERIFIED: sibling API source]` |
| Download URL rendered as executable/untrusted HTML | Spoofing / Tampering | Bind URL as text or a normal attribute only; do not use `[innerHTML]`; native download remains Phase 6. `[ASSUMED: standard Angular template safety guidance; verify during implementation]` |
| Poll response from stale job updates a newly opened row | Tampering / race | Check episode ID and job ID before applying snapshot; retain one active job per episode. `[VERIFIED: existing polling identity guards; 05-CONTEXT.md]` |
| Modal background remains keyboard-interactive | Information disclosure / usability | Trap focus, handle Escape, use `aria-modal`, and restore invoker focus. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous artifact preparation/download route | Persisted asynchronous job with start/status/download endpoints | Phase 4 implementation, 2026-07-29 | Frontend polls JSON state and does not infer progress from binary delivery. `[VERIFIED: sibling API source; Phase 4 summary]` |
| Filename/path-oriented artifact request | Allowlisted canonical selector array | Phase 4 contract | Client payload remains safe and stable across filesystem layout changes. `[VERIFIED: sibling API source; Phase 4 context]` |
| Existing custom delete modal with semantic attributes only | Artifact dialog with explicit focus lifecycle and keyboard containment | Phase 5 requirement | Accessibility behavior must be implemented and tested, not implied by `role=dialog`. `[VERIFIED: existing template; CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]` |

**Deprecated/outdated:**
- Earlier Phase 4 recommended shapes using `status`/`filename` are outdated for this frontend; use the implemented `state`/`downloadUrl` snapshot. `[VERIFIED: sibling API source]`
- Native ZIP download/object URL logic is out of scope until Phase 6. `[VERIFIED: 05-CONTEXT.md]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `npm test -- --watch=false --browsers=ChromeHeadless` is runnable in this environment. | Validation Architecture | Planner may need a different local browser/test command. |
| A2 | Angular CDK is intentionally not added; direct focus management is sufficient for this small existing custom modal. | Architecture Patterns | Missing focus trapping would create an accessibility defect; implementation must test it. |
| A3 | A transient status HTTP error can be retried by the existing poll timer without starting a new job. | Architecture Patterns | If product expects a terminal error state, a separate status-retry control may be needed. |
| A4 | Rendering the backend `downloadUrl` as text/link without invoking it satisfies Phase 5’s “show URL” requirement. | API Contract | Phase 6 may need to adjust markup for native delivery. |

## Open Questions (RESOLVED)

1. **Should the completed `downloadUrl` be plain text, a disabled/deferred link, or a clearly marked Phase 6 handoff link?** — RESOLVED: Render it as selectable, non-triggering text clearly labeled as the Phase 6 download handoff; do not make it a link or invoke it in Phase 5.
   - What we know: D-13 requires showing the backend-provided URL; native download behavior is deferred.
   - What’s unclear: Exact interaction affordance before Phase 6.
   - Recommendation: Render it as selectable text or a non-triggering labeled URL display in Phase 5; let Phase 6 own the clickable download behavior.

2. **What is the exact desired handling after a temporary status poll failure?** — RESOLVED: Keep the active job and existing poll timer alive, show “Could not refresh status; retrying…” near the status area, and let the next interval retry without creating a job.
   - What we know: D-15 requires recoverability and forbids duplicate jobs.
   - What’s unclear: Whether to keep the modal’s active status text unchanged with a warning or show a dedicated retry-status control.
   - Recommendation: Keep the timer/job alive, show a recoverable “Could not refresh status; retrying…” message, and test the next successful poll.

3. **Should active jobs continue polling while the modal is closed?** — RESOLVED: Continue one page-session poller while `ManageComponent` exists; closing only hides the modal, and reopening shows the retained snapshot without a new POST.
   - What we know: D-11 says closing does not cancel; D-12 says reopen resumes state and polling.
   - What’s unclear: Whether polling is allowed to continue invisibly.
   - Recommendation: Continue one page-session poller while the Manage component exists, so reopening shows current state immediately; always stop on terminal state/destroy.

## Sources

### Primary (HIGH confidence)
- `src/app/core/api.service.ts` — current `Episode` filename fields and Angular HTTP orchestration boundary. `[VERIFIED: codebase grep]`
- `src/app/pages/manage/manage.component.ts` — current Manage state, 2-second polling, timer cleanup, and component-owned workflow. `[VERIFIED: codebase grep]`
- `src/app/pages/manage/manage.component.html` and `src/styles.scss` — Episodes table, existing modal markup, Bootstrap/native control styling, and actual style location. `[VERIFIED: codebase grep]`
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` — implemented artifact start/status/download routes, request validation, response codes, auth, and no-store behavior. `[VERIFIED: sibling API source]`
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` — public job snapshot fields, four states, progress normalization, state text, and completion URL. `[VERIFIED: sibling API source]`
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-download.service.ts` — canonical selector catalog and preflight mapping. `[VERIFIED: sibling API source]`
- `.planning/phases/04-artifact-job-contract/04-CONTEXT.md` and `04-03-SUMMARY.md` — locked Phase 4 contract and verification boundary. `[VERIFIED: project planning docs]`

### Secondary (MEDIUM confidence)
- [WAI-ARIA APG Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — focus, keyboard, labeling, and modal semantics. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]`
- [Angular Accessibility Best Practices](https://angular.dev/best-practices/a11y) — native controls and CDK focus-trap guidance. `[CITED: https://angular.dev/best-practices/a11y]`
- [Angular Aria overview](https://angular.dev/guide/aria) — current Angular accessibility direction; not installed or directly required by this Angular 15 project. `[CITED: https://angular.dev/guide/aria]`

### Tertiary (LOW confidence)
- None for the recommended implementation. The test command and several interaction-policy choices are explicitly isolated as assumptions/open questions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing package manifest and source imports confirm Angular 15, RxJS, Bootstrap, and HttpClient; no new package is proposed. `[VERIFIED: package.json; codebase grep]`
- API contract: HIGH — final route and service source were inspected in the sibling API after Phase 4 completion. `[VERIFIED: sibling API source]`
- Architecture: HIGH — integration points and polling patterns are directly present in the frontend; modal focus details are MEDIUM because this custom dialog still needs implementation/testing. `[VERIFIED: codebase grep; CITED: WAI-ARIA APG]`
- Pitfalls: MEDIUM/HIGH — field-name, selector, auth, partial-result, and lifecycle risks are source-confirmed; browser test-command availability and transient-error UX remain assumptions. `[VERIFIED: sources; ASSUMED items listed above]`

**Research date:** 2026-07-30
**Valid until:** 2026-08-06 for API/UI integration details; recheck after sibling API contract changes.
