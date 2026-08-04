# Phase 7: Final Trailer Video Upload - Research

**Researched:** 2026-08-03
**Domain:** Angular 15 multipart upload UI and sibling API final trailer-video lifecycle
**Confidence:** HIGH for repository behavior; HIGH for the resolved reservation/save contract; MEDIUM for browser cancellation details

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Upload timing and media lifecycle
- **D-01:** Selecting the trailer file starts its upload immediately using the episode ID already present in the form; it must not wait for the final “Save episode” action.
- **D-02:** The Phase 7 API work must make that pre-save upload contract valid. If the existing route requires a persisted episode row, the API must support the form's known episode ID/draft lifecycle without weakening ownership or validation.
- **D-03:** Treat the video like the other media files: upload to the staging folder first, then promote atomically to the finalized media location.
- **D-04:** Preserve the previous finalized trailer until the replacement upload completes successfully; a failed or canceled replacement must not remove the last-known-good video.

#### Cancellation, retry, and replacement
- **D-05:** Canceling an in-progress local upload stops the browser request and leaves the selected file available for retry.
- **D-06:** Retry may reuse the selected file without requiring the operator to choose it again; the operator may also choose a different replacement video.
- **D-07:** The UI must distinguish selected, uploading, canceled, failed, staged/promoting, and finalized states and must not expose YouTube actions in this phase.

#### File Management presentation
- **D-08:** Add a dedicated Trailer video card alongside the existing Episode audio, Trailer audio, and cover upload cards.
- **D-09:** Match the established upload-card treatment for drag/drop, file selection, progress, busy state, success, error, and replacement behavior.

### the agent's Discretion
- Exact copy, iconography, spacing, and helper text within the established sectioned File Management card pattern.
- Whether the upload helper is generalized or a new video-specific definition is added, provided behavior remains consistent and testable.
- Exact client-side MP4 hinting, while the API remains authoritative for MIME, extension, and size validation.

### Deferred Ideas (OUT OF SCOPE)
- YouTube upload/processing progress, private link return, hashtag search count, title generation, and explicit public publishing — Phase 8/9.
- Adding `trailer-video` to the Episodes artifact modal and ZIP validation — Phase 11.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRAILER-01 | Select an MP4 final trailer video in New Episode File Management. | Extend the existing `uploadDefinitions`/`episode-form` card loop with a `trailerVideo` kind, `.mp4,video/mp4` hint, and the existing drag/drop/input handlers. |
| TRAILER-02 | Upload to the backend endpoint with byte-level progress. | Reuse `ApiService.uploadEpisodeFile()` with `observe: 'events'`, `reportProgress: true`, and `HttpEventType.UploadProgress`; add the exact `/episodes/:id/trailer-video` wrapper. |
| TRAILER-03 | Cancel upload while preserving the previous finalized trailer. | Keep the upload subscription and selected `File`; unsubscribe on cancel, model cancellation separately from failure, and rely on an API staging/promotion contract that never removes final media before successful promotion. |
| TRAILER-04 | Retry without reselecting or replace with another video. | Store the selected file outside the HTTP event stream; retry starts the same request with that file, while a new input/drop replaces the stored file only after the active request is canceled or terminal. |
| TRAILER-05 | Distinguish lifecycle states and expose no publish action before local success. | Use explicit client state for selected/uploading/canceled/failed/staged-promoting/finalized and render only local upload controls in this phase. |
</phase_requirements>

## Summary

The frontend already has the reusable shape required for this feature: `ApiService` builds authenticated multipart requests, `ManageComponent` owns a component-local `uploadStates` map and upload definitions, and `EpisodeFormComponent` renders every definition through one Bootstrap card loop. Existing cards show a generated/current filename, accept drag/drop and file input, disable controls while busy, expose byte progress, and update the editor’s media filename from the final `Episode` response. [VERIFIED: codebase grep]

The important difference is lifecycle semantics. Existing audio/trailer/cover routes are generic staging routes and the create/update routes promote their staged files later. The dedicated trailer-video route uses Multer’s episode staging path but then calls `replaceEpisodeTrailerVideo()`, which requires a persisted episode, copies the previous final file to a rollback path, atomically replaces the final file, updates `trailerVideoFileName`/sync status, and cleans the staging file. For a new form with only a known ID, this is not a valid immediate-upload contract: the route returns 404 after upload because no episode row exists. The create route’s `promoteStagedMedia()` also iterates `uploadSpecs`, which explicitly excludes `trailerVideo`. [VERIFIED: sibling API grep]

**Primary recommendation:** preserve the current card and `HttpClient` patterns, but make the API’s pre-save contract explicit through a server-issued reservation: New Episode first calls `POST /v1/episodes/drafts` with its positive form episode ID and receives an opaque `draftId`; the immediate trailer upload sends that draftId in `X-Episode-Draft-Id`; `POST /v1/episodes` sends the same episodeId/draftId and atomically consumes the reservation while promoting staged media. Unreserved, expired, mismatched, or other-owner IDs are rejected. For persisted episodes, retain the rollback-safe replacement service or make its same atomic behavior the shared promotion path. Do not solve the gap by silently making the browser wait for Save, by writing directly to a final path, or by deleting the old final video before promotion succeeds. [VERIFIED: sibling API grep] [RESOLVED]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| File picker, drag/drop, card state, progress display | Browser / Client | Frontend Server — | The existing Angular form owns interaction state and renders `HttpEventType.UploadProgress`; no business rule belongs here. [VERIFIED: codebase grep] |
| Authenticated multipart request and response typing | API / Backend | Browser / Client | `ApiService` is the shared HTTP boundary and the auth interceptor supplies the bearer token; the backend owns validation and response truth. [VERIFIED: codebase grep] |
| MP4 extension/MIME/size validation | API / Backend | Browser / Client | The API route’s Multer spec is authoritative; the client `accept` attribute is only a selection hint. [VERIFIED: sibling API grep] |
| Staging, promotion, replacement rollback, and finalized filename | Database / Storage | API / Backend | Filesystem transitions and `trailerVideoFileName` persistence must remain server-owned. [VERIFIED: sibling API grep] |
| Pre-save draft ownership and promotion-on-save contract | API / Backend | Database / Storage | `POST /episodes/drafts` issues an opaque reservation bound to the authenticated email and positive episodeId; trailer upload and `POST /episodes` require the same reservation, which is consumed only after successful create/promotion. [RESOLVED] |

## Project Constraints (from AGENTS.md)

- Read `docs/README.md`, `docs/ARCHITECTURE.md`, and `docs/CONFIGURATION.md` as the UI architecture/backend-contract source of truth. [VERIFIED: codebase grep]
- Keep business logic in the backend; the frontend orchestrates API calls. [VERIFIED: AGENTS.md]
- Preserve the sectioned, legacy-inspired functional layout. [VERIFIED: AGENTS.md]
- Respect the `authBypass` environment toggle. [VERIFIED: AGENTS.md]
- Verify `npm run build` before finalizing implementation. [VERIFIED: AGENTS.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 15.x (`^15.0.0`) | Component/template application framework | Existing routed admin application and form components use Angular. [VERIFIED: codebase grep] |
| `@angular/common/http` | 15.x (`^15.0.0`) | Authenticated multipart HTTP and progress events | Existing `ApiService` already returns `Observable<HttpEvent<Episode>>`. [VERIFIED: codebase grep] |
| RxJS | 7.5.x (`~7.5.0`) | Observable subscription lifecycle and teardown | Existing component uses RxJS observables and `finalize()`. [VERIFIED: codebase grep] |
| Bootstrap | 5.3.8 | Sectioned card, grid, button, alert, and progress styling | Existing File Management cards use Bootstrap classes and the project requires the established layout. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Karma/Jasmine | Karma 6.x, Jasmine 4.x | Existing Angular unit/component tests | Add focused upload service/component tests without introducing a new runner. [VERIFIED: codebase grep] |
| `@angular/common/http/testing` | Angular 15.x | Mock multipart requests and HTTP event/error paths | Use `HttpClientTestingModule`/`HttpTestingController` in the current test style. [VERIFIED: codebase grep] [CITED: https://angular.dev/guide/http/testing] |

No new frontend package is needed for Phase 7. Do not add a file-upload library or file-saver dependency for this workflow. [VERIFIED: codebase grep] [ASSUMED]

## Architecture Patterns

### Existing upload-card pattern to extend

1. Add one `UploadKind` and one `UploadDefinition` entry. The definition supplies `kind`, label, description, accept hint, generated fallback name, and the editor field to patch. Existing kinds are `audio`, `trailer`, `cover`, and `coverLow`. [VERIFIED: codebase grep]
2. Add a matching `UploadState` entry. The current state only has `busy`, `deleting`, `dragOver`, and `progress`; Phase 7 needs either a companion video-specific state or an expanded state that also stores the selected `File`, lifecycle status, error, and active subscription/token. [VERIFIED: codebase grep] [ASSUMED]
3. Reuse `onUploadDragOver`, `onUploadDragLeave`, `onUploadDrop`, and `onUploadInputChange`; the input handler clears `input.value` after capturing the `File`, which permits selecting the same file again. [VERIFIED: codebase grep]
4. Keep the card in `episode-form.component.html`: the `*ngFor` already renders title, filename, description, busy button, delete button, progress bar, and file input. Add video-specific cancel/retry/status controls conditionally, rather than creating a separate modal or HTTP owner. [VERIFIED: codebase grep]

### Recommended state machine

`selected → uploading → staged/promoting → finalized`

Failure branches:

`uploading → canceled` and `uploading → failed`; both retain the selected `File` and the last-known-good finalized filename. A new selection replaces the retained file only after the old request is no longer active. `finalized → uploading` represents replacement, and the UI must continue showing the prior finalized asset until the replacement response confirms success. [ASSUMED]

The final response is the commit point in the browser: only then patch `editor.formModel.trailerVideoFileName` and mark finalized. Progress reaching 100% is not itself success because the server still has to validate, promote, persist, and respond. [VERIFIED: sibling API grep] [ASSUMED]

### API contract gap and safe options

Current behavior is exact:

- `POST /v1/episodes/:episodeId/trailer-video` is authenticated, accepts one multipart field named `file`, validates `.mp4` plus `video/mp4` or `application/mp4`, and applies the configured maximum (default 500 MiB). [VERIFIED: sibling API README] [VERIFIED: sibling API grep]
- Multer writes `trailer.mp4` under the episode staging directory. [VERIFIED: sibling API grep]
- The route calls `replaceEpisodeTrailerVideo(episodeId, file.path)`. The service returns `null` when `episodeRepository.findByEpisodeId(episodeId)` is absent, so the route returns 404 and the catch/cleanup path removes the uploaded file. [VERIFIED: sibling API grep]
- On a persisted episode, the service copies the old final file to a rollback path, copies staged bytes to a temporary replacement, renames the temporary file to final, updates the repository, and restores the old final if post-promotion persistence fails. It always removes the staging file in `finally`. [VERIFIED: sibling API grep]
- `POST /v1/episodes` creates the row and then calls `promoteStagedMedia()`, but that function iterates `uploadSpecs`, whose type and value exclude `trailerVideo`; it therefore cannot promote a pre-save trailer-video staging file today. [VERIFIED: sibling API grep]

Safe contract options for the planner/API phase:

| Option | Contract | Safety and cost |
|--------|----------|----------------|
| Selected: explicit draft reservation resource | Add authenticated `POST /v1/episodes/drafts` issuing opaque `{draftId, episodeId, state, expiresAt}`; require that draftId on immediate trailer staging and Save/create, then consume it during atomic promotion. | Provides explicit ownership and orphan cleanup while preserving D-01/D-03/D-04 and rejecting arbitrary unreserved IDs. [RESOLVED] |
| Alternative: shared staged-upload service | Make trailer-video upload stage-only for both new and existing episodes; move rollback-safe final promotion into a single create/update/replace promotion service that validates the staged path and updates sync status after promotion. | Cleanest lifecycle symmetry, but changes the existing persisted replacement route and requires careful recovery tests. [ASSUMED] |
| Alternative: explicit draft resource | Same as the selected contract; retained here only as the naming of the chosen resource boundary. | Chosen because the existing API has no reservation mechanism and the locked pre-save timing requires one. [RESOLVED] |
| Not acceptable for this phase | Delay upload until Save, write directly to final storage, or remove the current final before a replacement is proven. | Contradicts D-01/D-03/D-04 and risks losing the last-known-good file. [VERIFIED: CONTEXT.md] |

The API decision is resolved: Angular receives a separate reservation DTO, a staged upload DTO, and a finalized create/replacement response. The browser may claim finalized only after the matching successful Save/create response, never at 100% transfer. [RESOLVED]

### Component responsibilities

`ApiService` should only encode the endpoint and return typed HTTP events. `ManageComponent` should select the current editor ID, retain the selected `File`, subscribe to progress/response/error, cancel by teardown, and guard response application against a changed editor or replacement token. `EpisodeFormComponent` should render the state and emit existing handler calls. The API should own MP4 validation, staging, promotion, canonical naming, row existence/draft eligibility, and rollback. [VERIFIED: codebase grep] [VERIFIED: sibling API grep]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multipart upload/progress | Custom `XMLHttpRequest` wrapper | Angular `HttpClient` with `observe: 'events'` and `reportProgress: true` | The project already has the typed helper and interceptor boundary; Angular exposes `UploadProgress` events. [VERIFIED: codebase grep] [CITED: https://angular.dev/api/common/http/HttpClient] |
| Browser transfer cancellation | Custom abort controller around a second transport | Retain and unsubscribe the Angular upload subscription; verify the XHR backend is used for upload progress | Browser upload abort is an XHR concern, while Angular owns request teardown. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest] [CITED: https://angular.dev/api/common/http/HttpRequest] [ASSUMED] |
| Final-file replacement | Client-side rename/delete or path manipulation | Sibling API staging/promotion service | Clients must not see filesystem paths or decide final filenames; rollback requires server-side atomicity. [VERIFIED: sibling API README] [VERIFIED: sibling API grep] |
| File validation | Trusting only `accept=".mp4,video/mp4"` | API Multer extension/MIME/size checks, with client hint as UX only | HTML accept is not an authorization or validation boundary. [VERIFIED: sibling API grep] [ASSUMED] |

**Key insight:** a browser-canceled request is not a proof that the server received zero bytes. The API must make incomplete staging harmless and must not replace the final file until the complete validated upload has passed its promotion/persistence boundary. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload] [ASSUMED]

## Common Pitfalls

### Pitfall 1: Treating 100% upload progress as finalized
**What goes wrong:** The progress bar reaches 100% but validation, promotion, or repository persistence fails; the UI claims success prematurely. [ASSUMED]
**Why it happens:** `UploadProgress` measures transfer bytes, not the server’s final response. [CITED: https://angular.dev/api/common/http/HttpProgressEvent]
**How to avoid:** Mark finalized only on the terminal `HttpResponse<Episode>` carrying the expected canonical trailer-video field/status; keep staged/promoting separate. [VERIFIED: sibling API grep] [ASSUMED]
**Warning signs:** A later 4xx/5xx changes a supposedly finalized card, or the card has no response payload to reconcile.

### Pitfall 2: Implementing D-01 against the current route without API work
**What goes wrong:** New Episode upload returns 404 and the staged file is deleted. [VERIFIED: sibling API grep]
**Why it happens:** The custom route calls a replacement service that requires an existing row; create-time promotion omits trailer video. [VERIFIED: sibling API grep]
**How to avoid:** Resolve the draft-aware contract and tests before wiring the client.
**Warning signs:** The endpoint works only after editing an existing episode.

### Pitfall 3: Replacing the retained `File` or final filename during an active request
**What goes wrong:** A late response from an older file overwrites the newer selection, or cancel/retry loses the only retryable object. [ASSUMED]
**Why it happens:** Component-local mutable state has no global store or automatic stale-response protection. [VERIFIED: codebase grep]
**How to avoid:** Use a per-upload generation token/subscription, ignore events for inactive generations, and retain the prior finalized value until the matching response succeeds. [ASSUMED]
**Warning signs:** Selecting B while A uploads ends with A displayed as finalized.

### Pitfall 4: Assuming `accept` enforces MP4 validity
**What goes wrong:** A renamed or incorrectly typed file reaches the server, or a browser’s MIME value differs from the client hint. [ASSUMED]
**Why it happens:** The input hint is advisory; the API uses both extension and MIME checks. [VERIFIED: sibling API grep]
**How to avoid:** Show a helpful client hint but treat API errors as authoritative and recoverable.
**Warning signs:** Client-only tests pass while API rejects the same file.

### Pitfall 5: Progress silently disappears after switching transport
**What goes wrong:** Upload still completes but no byte progress is emitted. [CITED: https://angular.dev/api/common/http/HttpRequest]
**Why it happens:** Angular’s Fetch backend does not support upload progress; progress requires the XHR backend. [CITED: https://angular.dev/api/common/http/HttpRequest]
**How to avoid:** Preserve the project’s current Angular 15 HTTP setup and test for `UploadProgress` events.
**Warning signs:** only `Sent`/`Response` events appear in a real browser.

### Pitfall 6: Resetting the editor while a video upload is active
**What goes wrong:** The form visually resets while the request can still finish and patch stale state; the selected file is lost. [ASSUMED]
**Why it happens:** `resetEditor()` replaces the form model and currently only clears generation polling. [VERIFIED: codebase grep]
**How to avoid:** Cancel active video uploads in reset/destroy paths, preserve server-side last-known-good state, and ignore late events after editor generation changes. [ASSUMED]

## Code Examples

### Existing service shape to extend

```typescript
private uploadEpisodeFile(episodeId: number, file: File, pathSuffix: string): Observable<HttpEvent<Episode>> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return this.http.post<Episode>(`${environment.apiBaseUrl}/episodes/${episodeId}/${pathSuffix}`, formData, {
    observe: 'events',
    reportProgress: true,
  });
}

uploadEpisodeTrailerVideo(episodeId: number, file: File): Observable<HttpEvent<Episode>> {
  return this.uploadEpisodeFile(episodeId, file, 'trailer-video');
}
```

This follows the repository’s current `ApiService` helper and Angular’s documented `observe: 'events'`/`reportProgress` upload contract. [VERIFIED: codebase grep] [CITED: https://angular.dev/api/common/http/HttpClient]

### Progress event handling

```typescript
if (event.type === HttpEventType.UploadProgress) {
  const total = event.total ?? file.size;
  state.progress = total > 0 ? Math.round((event.loaded / total) * 100) : 0;
}

if (event instanceof HttpResponse) {
  // Only here: patch trailerVideoFileName and enter finalized state.
}
```

Angular documents `loaded` and optional `total`; the fallback to the selected file size is a UI policy, not proof that the transport supplied a computable total. [CITED: https://angular.dev/api/common/http/HttpProgressEvent] [ASSUMED]

### Cancellation boundary

```typescript
cancelTrailerVideoUpload(): void {
  this.trailerVideoUploadSubscription?.unsubscribe();
  this.trailerVideoUploadSubscription = undefined;
  this.videoState = { ...this.videoState, status: 'canceled', busy: false };
  // Keep selectedFile and the previous finalized filename.
}
```

The exact state implementation is discretionary, but cancellation must be tied to the active subscription and tested as a teardown path. Browser XHR exposes an abort terminal event, while Angular’s progress-capable backend is XHR-based. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload] [CITED: https://angular.dev/api/common/http/HttpRequest] [ASSUMED]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma 6 + Jasmine 4; Angular CLI 15 test target. [VERIFIED: codebase grep] |
| Config file | `angular.json`; current specs use `HttpClientTestingModule`, `TestBed`, Jasmine spies, RxJS `Subject`/`of`/`throwError`. [VERIFIED: codebase grep] |
| Quick run command | `npx ng test --watch=false --browsers=ChromeHeadless` [ASSUMED] |
| Full suite command | `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRAILER-01 | File Management renders a dedicated Trailer video card with MP4 hint; input/drop dispatches the selected file. | component | `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/pages/manage/manage.component.spec.ts` [ASSUMED] | ❌ Add focused spec/Wave 0 |
| TRAILER-02 | `ApiService` posts `FormData` to `/episodes/:id/trailer-video`; component maps `UploadProgress.loaded/total` and only final response enters finalized. | service + component | `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED] | ❌ Add tests |
| TRAILER-03 | Cancel unsubscribes; selected file remains retryable; old finalized filename remains after cancel and API failure. | component + API integration contract | `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED] | ❌ Add tests |
| TRAILER-04 | Retry reuses the same `File`; selecting a different file starts a replacement generation; late A response cannot overwrite B. | component | `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED] | ❌ Add tests |
| TRAILER-05 | Selected/uploading/canceled/failed/staged-promoting/finalized labels and controls are correct; no YouTube controls render. | component/template | `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED] | ❌ Add tests |

### Concrete cases to add

- `ApiService.uploadEpisodeTrailerVideo()` uses POST, exact URL, multipart field `file`, `observe: 'events'`, and `reportProgress: true`; assert the `FormData` contains the selected `File`. [VERIFIED: codebase grep] [CITED: https://angular.dev/guide/http/testing]
- Emit `UploadProgress` at 0/50/100 with a known total and assert byte-derived percentage; emit `HttpResponse` separately and assert only the response sets finalized. [CITED: https://angular.dev/api/common/http/HttpProgressEvent] [ASSUMED]
- Defer the upload observable with a `Subject`, invoke cancel, assert the subscription is closed/no later event changes state, and assert the selected `File` plus previous server filename remain. [ASSUMED]
- Return 400/404/413/500-shaped errors and assert failed state, readable recovery text, retained prior finalized filename, and retry availability. The API’s size/type errors are authoritative. [VERIFIED: sibling API grep] [ASSUMED]
- Start A, then replace with B; emit A’s late response and assert it is ignored, then emit B’s response and assert B becomes finalized. [ASSUMED]
- Exercise reset and `ngOnDestroy` during upload to ensure teardown occurs and late events do not mutate a new form. [VERIFIED: codebase grep] [ASSUMED]
- Add sibling API tests/contract checks for new-ID staging, promotion during create/update, persisted replacement rollback, invalid MP4, size limit, missing file, malformed ID, canceled/disconnected upload cleanup, and no final-file loss. [VERIFIED: sibling API grep] [ASSUMED]

### Wave 0 Gaps

- [ ] Decide and implement the sibling API pre-save contract before treating the frontend endpoint as complete. [VERIFIED: sibling API grep]
- [ ] Add `trailerVideoFileName` and, if exposed, sync/status fields to frontend response/write typings. [VERIFIED: sibling API schema] [ASSUMED]
- [ ] Add focused `ApiService` multipart/progress tests and `ManageComponent` state/template tests. [VERIFIED: existing test inventory]
- [ ] Add backend contract tests for new-ID staging and create-time promotion; current route/service behavior makes this gap material. [VERIFIED: sibling API grep]

### Sampling Rate

- **Per task commit:** `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED]
- **Per wave merge:** `npm test -- --watch=false --browsers=ChromeHeadless` [ASSUMED]
- **Phase gate:** full suite green and `npm run build` green before verification. [VERIFIED: AGENTS.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Keep `requireAuth` on the trailer-video route and let `AuthInterceptor` attach the bearer token. [VERIFIED: sibling API grep] [VERIFIED: codebase grep] |
| V3 Session Management | yes | Preserve normal JWT and `authBypass` behavior; do not add browser-side provider credentials. [VERIFIED: docs/CONFIGURATION.md] |
| V4 Access Control | yes | Validate episode ID and draft/persisted ownership server-side; never authorize based only on a browser-supplied filename/path. [VERIFIED: sibling API grep] [ASSUMED] |
| V5 Input Validation | yes | Enforce `.mp4`, allowed MIME, and configured max bytes in Multer/API; client accept remains a hint. [VERIFIED: sibling API grep] |
| V6 Cryptography | no direct new control | No new cryptography; use existing authenticated transport/session boundary. [ASSUMED] |

### Known Threat Patterns for Angular + Express multipart upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Arbitrary destination/path or filename | Tampering / Elevation | Derive `episodes/{id}/trailer.mp4` server-side; accept only field `file`. [VERIFIED: sibling API README] |
| Uploading to another episode ID | Elevation | Authenticated route plus server-side ID ownership/reservation/draft validation. [VERIFIED: sibling API grep] [ASSUMED] |
| Oversized or non-MP4 upload | Denial of service | Multer file-size limit and extension/MIME validation. [VERIFIED: sibling API grep] |
| Replacement failure deletes current media | Tampering / Availability | Stage first, preserve rollback copy, promote only after complete upload, restore on persistence failure. [VERIFIED: sibling API grep] |
| Browser logs expose provider secrets | Information disclosure | Phase 7 has no YouTube controls or provider calls; keep later provider work API-owned. [VERIFIED: CONTEXT.md] |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js/npm | Angular tests/build | ✓ | Existing project toolchain; exact runtime not probed in this read-only research. [VERIFIED: codebase grep] | — |
| Angular CLI | build/test | ✓ | `@angular/cli ~15.0.4` in package manifest. [VERIFIED: codebase grep] | — |
| Sibling Dragao Careca API | Upload contract and integration tests | Source available at `../dragaocareca-admin-api`; running service not probed. [VERIFIED: filesystem/source grep] | — | Unit/mock API tests; planner must include backend contract work. |
| ChromeHeadless | Karma test execution | Not verified | — | Use the project’s configured browser/CI runner or document manual test fallback. [ASSUMED] |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|-------------|--------|
| Treat upload completion as the byte transfer reaching 100% | Treat final HTTP response and server promotion as the success boundary | Current Angular/API contract [CITED: https://angular.dev/api/common/http/HttpProgressEvent] [VERIFIED: sibling API grep] | Prevents a progress bar from claiming finalized media before API validation/persistence. |
| Browser-selected destination filename/path | Server-derived canonical `episodes/{episodeId}/trailer.mp4` | Existing API contract [VERIFIED: sibling API README] | Removes path control from the browser and keeps artifact lookup stable. |
| Replace final media in place without recovery | Staged upload plus rollback-safe replacement | Existing trailer-video service [VERIFIED: sibling API grep] | Preserves last-known-good media across replacement failures. |

**Deprecated/outdated:** Do not model this as the existing audio `trailer` field. The API explicitly distinguishes the final MP4 trailer video from the existing MP3 trailer artifact. [VERIFIED: sibling API README]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The API should expose an explicit staged/promoting distinction in its pre-save response. | Architecture Patterns | Planner may otherwise let the UI claim finalized state for a file not yet associated with a row. |
| A2 | Unsubscribing the Angular upload Observable is the correct browser cancellation boundary in the current XHR backend. | Don't Hand-Roll / Code Examples | If transport setup changes, cancellation/progress behavior must be revalidated. |
| A3 | Per-upload generation tokens are needed to prevent late replacement responses from overwriting newer state. | Architecture Patterns / Pitfalls | Without them, replacement races can corrupt the operator-visible state. |
| A4 | A draft-ID reservation/ownership and cleanup policy is required if uploads are allowed before persistence. | API contract gap | Without it, arbitrary IDs can accumulate orphaned staged files or cross-episode writes. |
| A5 | Exact CLI flags and ChromeHeadless availability are environment-dependent. | Validation / Environment | Test command may need adjustment on the target machine. |
| A6 | No new frontend upload package is necessary. | Standard Stack | Adding one would expand dependency/security surface without solving the backend contract. |

## Resolved Contract Decisions

The four planning questions are resolved as follows; these decisions are the contract that Plans 01–03 must implement and test.

1. **Reservation issuance and ownership:** The existing API has no reservation mechanism. Add authenticated `POST /v1/episodes/drafts` with body `{ episodeId: positive integer }`. The API rejects an ID that is persisted or already reserved, generates an opaque UUID `draftId`, binds it to `req.user.email` and the episodeId, stores `createdAt`, `expiresAt = createdAt + 24 hours`, and state `reserved`, then returns `{ draftId, episodeId, state: "reserved", expiresAt }` without returning owner internals. Trailer upload and create must present that server-issued draftId; arbitrary unreserved IDs are rejected.

2. **Promotion timing and transaction:** Selecting the MP4 still starts local upload immediately after the add form has obtained its reservation; it does not wait for the final Save click. `POST /v1/episodes/:episodeId/trailer-video` with `X-Episode-Draft-Id` validates the reservation and retains the MP4 at the server staging path, returning `{ episodeId, draftId, state: "staged", trailerVideoFileName: null, message }`. `POST /v1/episodes` carries the same episodeId/draftId and, after validating the owner and episode payload, creates the row, promotes staged trailer bytes atomically to `episodes/{episodeId}/trailer.mp4`, persists `trailerVideoFileName`, and marks the reservation consumed. If create or promotion fails, the row/reservation/final media are rolled back according to the failure point and the browser retains its File for retry; the prior finalized asset is never removed before successful replacement.

3. **Frontend DTO and state:** Reservation responses are typed separately from upload responses. A staged upload cannot be represented as a finalized `Episode`; the frontend keeps `draftId` and File in editor/upload state, marks the card staged after the upload response, and marks it finalized only after the matching successful create response. Persisted replacement responses remain finalized responses. A 100% browser progress event is never a commit signal.

4. **Cleanup policy:** Reservation expiry is 24 hours. A scheduled/API-start cleanup removes expired reservation records and their staging directory; a canceled browser request may leave a server partial that is removed by request/error cleanup or the expiry sweep, but the browser-selected File remains available for retry. Promotion failure removes prepared/rollback temporaries and restores previous final bytes and database fields. Resetting the add form calls the reservation cleanup endpoint or equivalent authenticated cleanup operation; cleanup never deletes a persisted last-known-good final trailer.

The phase remains local-only: no YouTube upload, processing, hashtag, title, publish, or artifact-download action is introduced.

## Sources

### Primary (HIGH confidence)

- Local frontend `src/app/core/api.service.ts`, `src/app/pages/manage/manage.component.ts`, and `src/app/pages/manage/episode-form.component.html` — upload helper, card definitions, form ID/save lifecycle, and current component state. [VERIFIED: codebase grep]
- Sibling API `README.md`, `src/routes/episodes.routes.ts`, `src/services/episode-trailer-video.service.ts`, `src/services/episode-media-layout.service.ts`, and episode schema/repository — route preconditions, staging paths, promotion, replacement rollback, canonical naming, and persistence. [VERIFIED: sibling API grep]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/phases/07-final-trailer-video-upload/07-CONTEXT.md`, `.planning/research/SUMMARY.md`, `.planning/codebase/STACK.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/INTEGRATIONS.md` — scope, decisions, requirements, stack, and constraints. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)

- [Angular HttpClient API](https://angular.dev/api/common/http/HttpClient) — `observe: 'events'`, `HttpEvent` streams, and upload request signatures. [CITED: https://angular.dev/api/common/http/HttpClient]
- [Angular HttpRequest API](https://angular.dev/api/common/http/HttpRequest) — progress cost and XHR-vs-Fetch upload-progress limitation. [CITED: https://angular.dev/api/common/http/HttpRequest]
- [Angular HttpClient testing guide](https://angular.dev/guide/http/testing) — `HttpTestingController` request matching, flushing, error simulation, and verification. [CITED: https://angular.dev/guide/http/testing]
- [MDN XMLHttpRequest upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) and [MDN XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) — upload progress and abort terminal events. [CITED: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload] [CITED: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing package manifest and source patterns are direct. [VERIFIED: codebase grep]
- Architecture: HIGH for current implementation and the selected reservation contract recorded above; implementation remains pending execution. [VERIFIED: sibling API grep] [RESOLVED]
- Pitfalls: HIGH for the 404/exclusion/rollback findings; MEDIUM for browser cancellation/stale-response details requiring tests. [VERIFIED: sibling API grep] [CITED: https://angular.dev/api/common/http/HttpRequest]

**Research date:** 2026-08-03
**Valid until:** 2026-08-31 for repository behavior; re-check Angular/API contract if dependencies or sibling API change.
