# Phase 10 Research: Operator Workflow Integration

Date: 2026-08-20  
Scope: planning research only; no application code was changed.

Evidence labels used below:

- **Verified** means directly observed in repository code/docs, the sibling API, or recorded phase evidence.
- **Audit finding** means reported by `.planning/v1.2-MILESTONE-AUDIT.md` and confirmed against current source where stated.
- **Assumption** means a planning recommendation or behavior that must be confirmed by tests/UAT.

## User Constraints

- **Verified:** Phase 10 is constrained to `OPS-05`: preserve authentication modes and `authBypass`, episode editing, generated-summary behavior, frontend tests, and `npm run build`. New trailer-video artifact selector/download integration is separately mapped to ARTIFACT-01/02 in Phase 11.
- **Verified:** The success path is the existing New Episode workflow: local MP4 staging, server-owned YouTube status polling, title preview, hashtag lookup, private-link review, and Save-time publication. Browser-side YouTube OAuth, provider calls, credentials, IDs, sessions, and raw provider errors are out of scope (`.planning/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`).
- **Verified:** The sectioned legacy-inspired layout must remain. The UI should expose distinct local upload and YouTube stages with cancellation boundaries, replacement warnings, and actionable recovery states.
- **Verified:** This research must not modify application code. The only created file is this planning artifact.
- **Assumption:** Phase 10 should repair the existing Angular seams and add regression coverage, not introduce a new state-management library, a second publish flow, or backend contract changes.

## Standard Stack

- **Verified:** Angular 15, strict TypeScript 4.8, RxJS 7.5, Bootstrap 5.3, Angular CLI/Karma/Jasmine, and ChromeHeadless/Playwright tooling are declared in `package.json`.
- **Verified:** The frontend uses `ApiService` as the typed HTTP boundary and component-owned mutable editor state in `src/app/pages/manage/manage.component.ts`.
- **Verified:** Existing polling uses `window.setInterval` plus RxJS `Subscription` references, with explicit teardown in `OnDestroy`, reset, and source-generation transitions.
- **Verified:** The standard gates are `npm run build`, spec compilation, focused Manage/ApiService tests, and the complete ChromeHeadless suite (`docs/TESTING.md`, Phase 09 verification).
- **Verified:** The sibling API is a separate TypeScript/Express service at `../dragaocareca-admin-api`; its routes and offline verifiers are the contract evidence for artifacts, summaries, and YouTube jobs.

## Architecture Patterns

### Thin frontend/API boundary

- **Verified:** `ApiService` wraps episode CRUD, media upload, summary status, hashtag lookup, artifact jobs/downloads, YouTube start/current/status/retry/cancel/commit, and draft reservation routes. `ManageComponent` only prepares payloads, displays status, and owns UI orchestration.
- **Verified:** The sibling API owns draft reservation, MP4 validation/staging/promotion, YouTube transfer/publication, cleanup, idempotency, artifact preflight/archive generation, and authentication.
- **Planning implication:** Keep Phase 10 changes inside `src/app/core/api.service.ts`, `src/app/pages/manage/manage.component.ts`, the artifact/template/spec surfaces, and test fixtures. Do not recreate provider or persistence logic in Angular.

### Identity-guarded polling

- **Verified:** YouTube state is held in a `WeakMap<EpisodeEditorState, YoutubeTrailerJobState>` and guarded by episode ID, job ID, source filename/draft identity, and `sourceGeneration` in `startYoutubeTrailerJob()`, `restoreCurrentYoutubeTrailerJob()`, retry/cancel, `storeYoutubeTrailerJob()`, and `ensureYoutubeTrailerJobPolling()`.
- **Verified:** Summary polling has episode and editor-generation checks in `syncSummaryStatusPolling()` (current `manage.component.ts:2343-2398`), but the edit restoration path does not invoke it for an already-pending summary.
- **Planning implication:** Reuse the existing identity/generation pattern. Do not add a second independent poller that can race the current timer.

### Server-owned artifact lifecycle

- **Verified:** Angular already has an artifact modal, start/status polling, authenticated native Blob download, delivery retry, expiry/error presentation, and duplicate-start guards.
- **Verified:** The API artifact schema accepts `episode`, `trailer`, `trailer-video`, `transcript`, `image`, and `image-low`; finalized trailer video is represented as canonical `trailer.mp4` by the sibling API verifiers.
- **Planning implication:** Phase 10 must leave the existing artifact option/request path unchanged. Exposing the missing finalized trailer-video selector and requesting the canonical ZIP entry are Phase 11 work; artifact generation and ZIP contents remain backend-owned.

## Findings

### 1. Pending summary polling is not resumed after edit/reload

- **Audit finding, verified in source:** `startEdit()` copies `summaryStatus`, timestamps, progress, error, and `summaryManuallyEdited` into `episodesEditorState.formModel` at `manage.component.ts:639-690`, then calls only `restoreCurrentYoutubeTrailerJob(editor)`.
- **Verified:** `syncSummaryStatusPolling()` is entered from transcription completion (`syncTranscriptionStatusPolling()`), not from `startEdit()`. It polls `GET /v1/episodes/:episodeId/episodes-generated-summary` and stops only at terminal summary/suggested-tag states.
- **Impact:** A persisted `pending`/`processing` summary visible after `listEpisodes()`/edit restoration can remain a static status. This directly matches the audit gap and weakens “editing and summary remain usable.”
- **Recommended boundary:** Add a small restoration decision at the end of `startEdit()` (or a named helper called there) that resumes summary polling when the restored summary or suggested-tag state is pending/processing, while leaving completed/error states terminal. If transcript is still pending/processing, resume transcript polling and let its existing done transition enter summary polling.
- **Important guard:** Preserve `summaryManuallyEdited`; restored/generated text must not overwrite operator text. Ensure restoration does not increment or invalidate the generation after the poll begins.

### 2. Save resets the editor before asynchronous YouTube commit feedback

- **Audit finding, verified in source:** `saveEpisode()` calls `createEpisode()`/`updateEpisode()`, then if a current job exists starts `commitYoutubeTrailerJob()` at `manage.component.ts:1079-1093`. The success message, `resetEditor()`, and `loadEpisodes()` follow immediately at `:1095-1101`, without waiting for commit completion.
- **Verified:** A deferred commit error currently writes the global `errorMessage` after the editor and its job state have been cleared. A successful commit’s returned private URL is assigned to the soon-to-be-reset form and is therefore not reliable operator feedback.
- **Impact:** Save can look successful while publication/metadata commit is still pending or fails; the operator loses the title/hashtag/job context needed to retry or recover.
- **Recommended boundary:** Treat episode persistence and YouTube commit as one UI save transaction when a current job exists: retain the editor, mark save/commit in flight, await commit success/error, surface a contextual message, then reset/reload only at the chosen terminal boundary. If no job exists, retain the existing ordinary-save behavior. Capture episode ID, job ID, source generation, and the authored title/hashtags for the request and ignore late callbacks after an explicit reset or replacement.
- **Assumption to resolve in tests:** On commit failure, retain the editor and its private-link/job state so the operator can retry; on commit success, show publication status/link before reset or reload. This is the least surprising recovery behavior and aligns with the audit’s “reported feedback” concern.
- **Do not do:** Call the sibling API’s direct `/:jobId/publish` route from Angular. The docs and Phase 09 verification identify Save-time `/commit` as the intended publication boundary; the direct publish route is an unused API surface.

### 3. Artifact selector compatibility is missing in Angular

- **Audit finding, verified in source:** `EpisodeArtifactSelector` in `src/app/core/api.service.ts:252` excludes `trailer-video`. `ArtifactDefinition.fileField` and `ManageComponent.artifactDefinitions` likewise omit `trailerVideoFileName` (`manage.component.ts:224-230`).
- **Verified:** `buildArtifactOptions()` derives availability from the definition’s file field; the existing modal/template is generic and will render a new definition without a separate layout branch.
- **Verified:** The sibling API accepts `trailer-video` and its artifact verifier asserts the canonical ZIP entry `episode-{id}/trailer.mp4`, while preflight excludes unavailable/staged/stale sources.
- **Recommended boundary:** Phase 11 adds the selector to the frontend union, `trailerVideoFileName` to the artifact field union, one definition in the existing canonical order, and the API/Manage specs and labels. Phase 10 must not make these changes or alter download URL handling/client-side ZIP logic.
- **Assumption:** The UI label should clearly distinguish “Trailer video” from the existing MP3 “Trailer”; exact wording can follow current UI terminology and should be asserted in the template test.

### 4. AuthBypass alignment is a deployment compatibility check, not a browser feature

- **Verified:** Frontend `environment.ts` has `authBypass: true`; production and staging environments have it false. `AuthService.isAuthenticated()`, `getProfile()`, and the route guard use this toggle. `AuthInterceptor` remains the centralized bearer-token injector.
- **Verified from docs/API contract:** Local bypass requires backend `AUTH_BYPASS`/development auth bypass to be enabled as well. Frontend bypass alone makes navigation look authenticated but does not authorize protected API routes.
- **Recommended boundary:** Add/retain a focused frontend assertion for the environment-facing auth behavior only if current test conventions allow it; perform paired frontend/backend bypass smoke checks manually. Do not make `ApiService` skip auth, add fake provider calls, or change the production toggle.
- **Manual-only:** Confirm normal Google/JWT mode with a real backend session and confirm local bypass with both toggles aligned. Unit tests cannot prove deployment configuration alignment.

### 5. Existing lifecycle guards are useful but not fully browser-proven

- **Verified:** Current source guards YouTube start/retry/cancel/poll responses by source generation and job identity, and clears timers/subscriptions on reset/destroy. Phase 09 automated evidence reports API reload/retry/stale/summary checks and 70/70 Angular tests passed at that time.
- **Audit finding:** The v1.2 audit did not run a live browser flow; Phase 08 remained `human_needed` for browser lifecycle and provider-error presentation. Phase 07’s original verification recorded earlier replacement/no-trailer-save failures, although the audit says current wiring later addressed them.
- **Planning implication:** Add regression tests around the existing guards, but retain a manual browser checkpoint for reload, replacement, cancellation, provider error, and deferred commit timing.

## Recommended Plan Boundaries

1. **API/type compatibility seam:** Extend only the frontend artifact selector/type and existing wrapper tests for `trailer-video`; verify no browser/provider API is introduced.
2. **Summary restoration seam:** Add one restoration helper used by `startEdit()` to resume the correct transcript/summary poll based on persisted statuses, with existing generation and manual-edit protections.
3. **Save transaction seam:** Add explicit save/commit in-flight state and stale callback identity checks. Keep ordinary episode save compatible; delay editor reset/reload until the relevant asynchronous commit has a terminal UI outcome.
4. **Sectioned UI seam:** Keep local Trailer video upload controls and the YouTube inline block separate. Add only missing pending/failed/commit messages or disabled states required by the transaction behavior; preserve existing labels and recovery buttons.
5. **Regression coverage seam:** Extend `manage.component.spec.ts` and `api.service.spec.ts`; do not broaden into a new integration framework unless existing Karma coverage cannot express the deferred-observable cases.
6. **Manual release seam:** Run paired auth modes and a live local/API browser workflow after automated gates. This is evidence collection, not new business logic.

## Common Pitfalls

- Resetting an editor while a commit, summary request, upload, or YouTube response is still subscribed; this recreates the exact lost-feedback/stale-state problem.
- Resuming both transcript and summary pollers indiscriminately. Choose the persisted stage and preserve the existing transition from transcript `done` to summary polling.
- Letting a restored summary response overwrite a manually edited summary. `summaryManuallyEdited` is part of the compatibility contract.
- Keying only on episode ID. Replacements can reuse an episode ID, so source filename/draft identity and generation must remain part of stale-response protection.
- Treating `trailer-video` as available merely because a staged/draft name exists. Availability must continue to be based on the finalized episode field returned by the API; the sibling API is authoritative about finalized versus staged.
- Assuming frontend `authBypass` authenticates the API. The backend bypass must align in local development; production must remain false.
- Calling YouTube directly from the browser or wiring the direct `/publish` route. Save-time `/commit` is the established contract.
- Resetting only global messages while leaving a failed asynchronous commit invisible in the form. Keep error/success semantics tied to the active save transaction.
- Overstating YouTube or hashtag progress as publication. `ready` is private readiness; publication status is a separate API-owned field.
- Treating the Phase 07 verification as current proof without noting its earlier failures and absent browser evidence.
- Running tests against unrelated dirty-worktree changes. At research time, `git status --short` showed pre-existing modified application files and an untracked milestone audit; no application files were touched by this research.

## Verification Matrix

| Area | Automated verification to add/run | Expected evidence | Manual-only or limitation |
|---|---|---|---|
| Artifact selector | `ApiService` request-body test with `['trailer-video']`; Manage modal option/availability test; complete Angular suite | Frontend sends canonical selector and shows “Trailer video” only when `trailerVideoFileName` is finalized | Sibling API verifier/live ZIP check should confirm `trailer.mp4` contents |
| Summary reload/edit | Deferred or immediate summary DTO tests for `startEdit()` with `pending`, `processing`, `done`, and manual summary text | Pending restoration starts exactly one poll; terminal states do not poll; generated text respects manual edit | Browser reload against a running API confirms persistence across navigation |
| Save/commit sequencing | Deferred `createEpisode`/`updateEpisode` and deferred `commitYoutubeTrailerJob` tests for success/error; reset-during-commit stale callback test | Editor/job context remains until commit outcome; commit error is actionable; stale callback cannot mutate a new editor | Live browser timing with real API/provider is manual |
| YouTube lifecycle | Existing focused Manage/API suites plus regression tests for duplicate start, reload restore, replacement, cancel, retry, and stale responses | No duplicate start; old job/source cannot update current title/link/status | Phase 08 provider/quota/timeout presentation remains manual/live |
| Local upload compatibility | Existing trailer upload specs; ordinary create without trailer and persisted replacement cases | New draft reservation only for new episode; ordinary save and existing replacement remain usable | Real MP4 progress/cancel/retry/replacement is manual if browser media behavior is not fully covered |
| Auth modes | Existing auth service/guard tests if present; run local backend with paired bypass settings; run normal JWT route | Bypass routes to app and API calls succeed only when backend bypass aligns; normal mode redirects/protects and uses bearer token | Deployment/env alignment and Google GIS/JWT are manual |
| Sectioned UI/recovery | Template/component assertions for separate local/YouTube blocks, cancellation boundary, errors, retry buttons, private link, and Save disabled/in-flight state | Operator can identify stage and next action without provider controls | Visual/accessibility and wording quality should be manual |
| Release gates | `./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit`; focused Manage/ApiService ChromeHeadless tests; complete `npm test -- --watch=false --browsers=ChromeHeadless`; `npm run build` | No regressions; build exits 0, with already recorded budget/selector-parser warnings documented | Existing warning cleanup is outside Phase 10 unless it becomes a new failure |

## Project Constraints

- **Verified:** Backend remains the source of truth for publication date, persistence, feed generation, authentication, media validation, YouTube provider operations, summary/provider selection, and artifact preparation.
- **Verified:** `authBypass` is a local development toggle and must not weaken server-side validation or production auth.
- **Verified:** Existing form stability behavior from Phase 08.1—publication defaults, backend-confirmed audio metadata, participant filtering, music-credit validation, and read-only fields—must remain intact.
- **Verified:** Existing artifact download behavior, authenticated native download, retry/reset, and sectioned layout must remain intact while adding one finalized trailer-video option.
- **Verified:** Existing Angular tests and build had passed in Phase 09, with known non-blocking selector-parser, metrics stylesheet-budget, and initial-bundle-budget warnings.
- **Audit finding:** The current v1.2 audit status is `gaps_found`; OPS-05 is pending because the two lifecycle feedback/recovery gaps remain, while live browser evidence is incomplete. ARTIFACT-01/02 are separate Phase 11 gaps.
- **Assumption:** Phase 10 can be considered implementation-complete only after automated regression gates pass and the manual matrix covers auth alignment, reload/no-duplicate behavior, stale replacement, summary recovery, commit feedback, and actionable provider errors. Phase 11’s artifact requirements remain separately traceable and are not prerequisites expressed through the OPS-05 contract.
