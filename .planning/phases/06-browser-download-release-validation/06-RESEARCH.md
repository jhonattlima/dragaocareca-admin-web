# Phase 6: Browser Download & Release Validation - Research

**Researched:** 2026-07-31
**Domain:** Angular 15 authenticated Blob delivery, native browser downloads, modal recovery states, and DC 334 release validation
**Confidence:** HIGH for repository/API facts; MEDIUM for browser-header exposure and manual fixture execution

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Native browser delivery
- **D-01:** Fetch the backend-provided `downloadUrl` as a Blob through Angular `HttpClient`, preserving authentication through the existing interceptor.
- **D-02:** Trigger one native browser download automatically as soon as the job reaches `completed`.
- **D-03:** Use the backend response’s `Content-Disposition` filename as the filename authority; Angular must not reconstruct a filename from the episode title or ID.
- **D-04:** Create a temporary object URL and revoke it after delivery. Do not add a ZIP, file-saver, or other download dependency.
- **D-05:** If automatic Blob delivery fails, keep the completed modal state open, show a clear download error, and offer a manual retry that reuses the completed archive without creating another artifact job.

### the agent's Discretion
The planner may choose the exact Blob response typing, anchor/object-URL cleanup timing, browser capability fallback, fixture seeding mechanism, validation fixture selectors, and concrete reset/retry copy, provided the roadmap success criteria, existing Phase 5 decisions, authentication boundary, and no-new-dependency constraint are preserved.

### Deferred Ideas (OUT OF SCOPE)
- Cancellation, multi-episode batch downloads, and download history remain outside this milestone.
- Broader browser compatibility or an alternate download library is not part of this phase unless required by the existing browser target.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-07 | The browser downloads the ZIP automatically when generation completes. | Use a typed authenticated `HttpClient` request with `observe: 'response'`, `responseType: 'blob'`, `Content-Disposition` filename extraction, one temporary object URL, and one native anchor activation. |
| UI-08 | The modal shows clear empty-selection, partial-download, failure, reset, and retry states. | Extend the existing Phase 5 terminal modal state with delivery-in-flight/success/error state; reset only view/delivery state, and retry only the completed download URL, never the job-start endpoint. |
| VAL-01 | API mock data is configured for the Season 3 DC 334 episode using the provided episode folder. | Seed episode 334 in the sibling API database/media layout and copy or map the external fixture into `episodes/334`; verify only available canonical selectors are requested. |
| VAL-02 | The complete UI flow is manually validated, including visible progress and ZIP contents. | Run the API with auth bypass or a real bearer token, exercise all five selector states, observe pending/processing/completed UI, capture the downloaded archive, and inspect central-directory entries. |
| VAL-03 | Existing frontend tests and `npm run build` remain passing. | Add `HttpTestingController` Blob/header tests and ManageComponent state tests, run the existing Karma suite in ChromeHeadless-capable environment, then run `npm run build`. |
</phase_requirements>

## Project Constraints (from AGENTS.md)

- Read `docs/README.md`, then `docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md`; those docs are the source of truth for UI architecture and backend contract assumptions. `[VERIFIED: project files]`
- Keep business logic in the backend; Angular orchestrates API calls. `[VERIFIED: AGENTS.md; docs/ARCHITECTURE.md]`
- Preserve the sectioned, legacy-inspired functional layout. `[VERIFIED: AGENTS.md; docs/README.md]`
- Respect `authBypass` in environment files. `[VERIFIED: AGENTS.md; docs/CONFIGURATION.md]`
- Verify with `npm run build` before finalizing. `[VERIFIED: AGENTS.md]`

## Summary

Phase 5 already has the correct integration seam: `ApiService` owns authenticated HTTP calls, `ManageComponent` owns the per-episode job snapshot and polling state, and the modal remains open when a job reaches `completed`. The implementation should add one download method at the `ApiService` boundary and one delivery state machine at the existing completed-job path. `[VERIFIED: Phase 5 source and artifacts]`

Use `HttpClient` with `observe: 'response'` and `responseType: 'blob'`, because Angular’s typed API returns `Observable<HttpResponse<Blob>>` for that combination and exposes response headers alongside the Blob body. The existing class-based `AuthInterceptor` is registered globally and clones outgoing requests with `Authorization: Bearer <token>`, so the new method must use the injected `HttpClient` rather than `window.location`, a plain anchor to the API URL, or `fetch`. `[CITED: https://v19.angular.dev/api/common/http/HttpClient] [VERIFIED: src/app/core/auth.interceptor.ts; src/app/app.module.ts]`

The backend download route is authenticated, returns `application/zip`, sends `Content-Disposition: attachment; filename="episode-${episodeId}-artifacts.zip"`, and may send `X-Missing-Artifacts`. The client must read the filename from the response header and never derive it from the episode title or ID. A cross-origin browser can expose a response header to JavaScript only when the server’s CORS response exposes it; the sibling API currently uses bare `cors()` and does not show `Access-Control-Expose-Headers`, so production validation must confirm or add exposure for `Content-Disposition` (and optionally `X-Missing-Artifacts` if the UI needs it). `[VERIFIED: sibling API `episodes.routes.ts` and `app.ts`] [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]`

**Primary recommendation:** Add `ApiService.downloadEpisodeArtifact(url): Observable<HttpResponse<Blob>>`, deliver exactly once per completed snapshot through a temporary object URL and a programmatically clicked native `<a download>`, revoke the URL in a guaranteed cleanup path after activation, and retain a completed snapshot plus a separate delivery-error flag so retry never calls `startEpisodeArtifactJob` again. `[VERIFIED: locked context; Angular/MDN docs]`

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authenticated ZIP request and response typing | API / Backend | Browser / Client | `ApiService` centralizes the HTTP contract; the interceptor supplies bearer auth and the API authorizes the route. `[VERIFIED: docs/ARCHITECTURE.md; source]` |
| Filename authority and header exposure | API / Backend | Browser / Client | The API creates the safe `Content-Disposition` value; the browser can use it only if CORS exposes it. `[VERIFIED: sibling API source]` |
| Object URL and native download activation | Browser / Client | — | Only the browser can turn a Blob into an object URL and initiate a user-visible save. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications]` |
| Modal delivery/retry/reset state | Browser / Client | API / Backend | `ManageComponent` presents state and reuses the completed job; the API remains responsible for archive existence/expiry. `[VERIFIED: Phase 5 context/source]` |
| DC 334 fixture provisioning and ZIP contents | Database / Storage | API / Backend | The API’s media layout and database episode row determine what the job can archive; UI only selects canonical keys. `[VERIFIED: sibling API media-layout/artifact services]` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular `HttpClient` | `^15.0.0` | Authenticated Blob request and response headers | Already installed and is the project’s sole HTTP boundary. `[VERIFIED: package.json; source]` |
| RxJS | `~7.5.0` | Observable completion/error handling and cleanup | Existing Angular workflows use subscriptions; use `finalize` or an equivalent guaranteed cleanup path for delivery state. `[VERIFIED: package.json; source]` |
| Browser `Blob`, `URL`, `HTMLAnchorElement` | Platform APIs | Temporary object URL and native download | Locked no-new-dependency decision; MDN documents the object URL lifecycle. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications]` |
| Karma/Jasmine + Angular HTTP testing | Karma `~6.4.0`, Jasmine `~4.5.0` | API/header and component-state tests | Existing test runner and test seams; `HttpTestingController` supports request matching and flushing Blob responses with headers. `[VERIFIED: package.json; source] [CITED: https://v18.angular.dev/api/common/http/testing/HttpTestingController/]` |

### Supporting

| API/fixture capability | Version | Purpose | When to Use |
|------------------------|---------|---------|-------------|
| `GET /v1/episodes/:episodeId/artifacts/jobs/:jobId/download` | Current sibling API | Authenticated completed ZIP stream | Call only after `state === 'completed'` and reuse the same URL on manual delivery retry. `[VERIFIED: sibling API source]` |
| `Content-Disposition` | HTTP standard | Filename authority | Read `filename*` first when present, then quoted/unquoted `filename`; do not fallback to episode-derived naming. `[CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]` |
| `X-Missing-Artifacts` | Current sibling API response | Optional delivery-time partial diagnostic | Prefer existing snapshot `missing` for the warning; use this header only to cross-check or update the warning if implementation needs delivery-time truth. `[VERIFIED: sibling API source]` |

**Installation:** No installation. Do not add `file-saver`, ZIP, parser, or other download dependency. `[VERIFIED: locked D-04; package.json]`

## Architecture Patterns

### System Architecture Diagram

```text
Phase 5 completed snapshot (state=completed, downloadUrl)
  -> ManageComponent delivery guard (one automatic attempt per completed job)
  -> ApiService HttpClient GET(downloadUrl, observe=response, responseType=blob)
       -> AuthInterceptor adds Bearer token
       -> API auth + completed-job validation + ZIP stream + Content-Disposition
  -> HttpResponse<Blob>
       -> parse Content-Disposition filename authority
       -> URL.createObjectURL(response.body)
       -> temporary <a href=objectUrl download=serverFilename>.click()
       -> URL.revokeObjectURL(objectUrl) in guaranteed cleanup
  -> modal remains Archive ready; partial warning remains visible

HTTP/auth/network failure
  -> preserve completed snapshot and jobId
  -> show delivery error + Manual retry
  -> retry same downloadUrl only; never POST a new artifact job
```

### Recommended Project Structure

Keep implementation in existing files; no new route or module is needed:

```text
src/app/core/api.service.ts                 # typed HttpResponse<Blob> method
src/app/core/api.service.spec.ts            # URL, responseType, Blob/header tests
src/app/pages/manage/manage.component.ts    # delivery guard, filename, object URL, retry/reset state
src/app/pages/manage/manage.component.html  # ready/error/retry/reset copy and disabled states
src/app/pages/manage/manage.component.spec.ts# terminal/recovery/object URL test seams
src/styles.scss                             # existing modal state styling if needed
```

The existing source confirms that modal/job state belongs in `ManageComponent`, while HTTP methods belong in `ApiService`; `manage.component.scss` is not the active style location for the current modal. `[VERIFIED: docs/ARCHITECTURE.md; Phase 5 source/artifacts]`

### Pattern 1: Typed authenticated Blob response

```typescript
downloadEpisodeArtifact(downloadUrl: string): Observable<HttpResponse<Blob>> {
  return this.http.get(downloadUrl, {
    observe: 'response',
    responseType: 'blob',
  });
}
```

The exact overload matters: `observe: 'response'` preserves headers and `responseType: 'blob'` yields a Blob body. The request must go through the injected `HttpClient` so the existing interceptor attaches the bearer token. `[CITED: https://v19.angular.dev/api/common/http/HttpClient] [VERIFIED: source and locked D-01]`

### Pattern 2: Server-authoritative filename extraction

Implement a small, tested helper at the client boundary:

1. Read `Content-Disposition` case-insensitively through Angular `HttpHeaders.get()`.
2. Prefer RFC 5987-style `filename*=` when present and decode its UTF-8 percent-encoded value.
3. Otherwise parse `filename=` with quoted-string support and remove surrounding quotes.
4. Reject empty/control-character/path-like values rather than inventing a title/ID filename; surface a delivery error or use a non-derived policy explicitly agreed during planning.
5. Pass the resulting server filename to the temporary anchor’s `download` property.

The current API emits a safe quoted ASCII filename, but testing `filename*` and spaces/quotes protects the client from a future safe backend filename format. MDN documents `filename` and `filename*` as response parameters and notes that attachment filenames are the browser’s suggested save name. `[VERIFIED: sibling API source] [CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]`

Do not use the episode row’s `title`, `episodeId`, `downloadUrl` basename, or a hard-coded `episode-${id}-artifacts.zip` as the filename authority. If the header is not readable cross-origin, fix the API CORS exposure/configuration or report delivery failure; do not silently reconstruct a name. `[VERIFIED: D-03; sibling API route/app]`

### Pattern 3: One automatic delivery plus same-job retry

Track delivery independently from the job snapshot, for example by completed `jobId`/URL plus `deliveryState: idle | downloading | delivered | error`. On the first completed snapshot, transition once to `downloading` and invoke the Blob request. Ignore duplicate status emissions or modal reopens for the same completed job after the attempt has started. On HTTP/auth/network failure, transition to `error`, preserve `artifactJob`, `downloadUrl`, and missing warnings, and expose a manual Retry action. Retry must call only the Blob method with the preserved URL. `[VERIFIED: D-02/D-05; Phase 5 job retention implementation]`

Reset should clear the modal’s delivery state and any stale completed snapshot only when the operator explicitly starts a fresh selection flow. It must not reset the API job by calling a nonexistent cancellation endpoint. A completed archive can expire after the sibling API’s retention window; a 404/409 on delivery should become a clear recoverable error, not a new job automatically. `[VERIFIED: sibling API route/service; Phase 4 research]`

### Pattern 4: Object URL lifecycle

```typescript
const objectUrl = URL.createObjectURL(response.body);
try {
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = serverFilename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
} finally {
  URL.revokeObjectURL(objectUrl);
}
```

Create one URL per delivery attempt, use it only for the native anchor activation, and revoke it in `finally` after the click. MDN describes `revokeObjectURL()` as releasing an existing object URL and recommends calling it when finished to prevent the browser retaining the file reference. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static]`

Test that `createObjectURL` and `revokeObjectURL` each run once for success, that a failed DOM activation still revokes, and that no URL remains when the modal closes or the component is destroyed. Do not revoke before `click()`; do not use a permanent Blob URL in template state. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications]`

### Pattern 5: Modal recovery state matrix

| Condition | Visible state | Allowed action | Job behavior |
|-----------|---------------|----------------|--------------|
| No selected artifacts | Inline validation/empty state | Select an available option or Close | No POST |
| Partial completed snapshot | Archive ready + named missing-artifact warning | Automatic delivery; Retry delivery if it fails; Close/reset | Same job |
| Completed, Blob in flight | Archive ready + Downloading | Disable duplicate delivery | Same job |
| Completed, delivery failed | Archive ready + clear download error | Retry download, Close, or reset selection | Same job; no POST |
| Failed job preparation | Preparation error | Retry job or Close | Retry may POST a new job only after terminal failure, preserving Phase 5 semantics |
| Poll/network/auth error before completion | Existing active job + recoverable status message | Wait/retry status per existing poller; Close | No POST |
| Reset/new selection | Fresh artifact options and no stale delivery state | Select and Prepare archive | New POST only from explicit fresh confirmation |

Keep partial warnings from `snapshot.missing` visible after successful Blob delivery. The archive may be valid even when requested artifacts were unavailable; the sibling API intentionally reports `requested`, `available`, and `missing` separately. `[VERIFIED: Phase 5 context; sibling API service]`

### Anti-Patterns to Avoid

- **Navigating to `downloadUrl` with `window.location` or an `<a>` pointing at the API:** bypasses the Angular interceptor and can lose bearer authentication. `[VERIFIED: auth boundary and D-01]`
- **Calling `fetch()` directly from the component:** bypasses the project’s centralized `HttpClient`/interceptor contract unless auth is reimplemented, which violates the thin frontend boundary. `[VERIFIED: AGENTS.md; docs/ARCHITECTURE.md]`
- **Using the `download` URL basename or episode title as filename:** violates D-03 and can mask missing CORS header exposure. `[VERIFIED: D-03]`
- **Starting a new artifact job when Blob delivery fails:** confuses transport recovery with archive preparation and creates duplicate jobs. `[VERIFIED: D-05; Phase 5 state model]`
- **Leaving object URLs unreclaimed or revoking before activation:** causes memory retention or can invalidate the download before the browser consumes it. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static]`
- **Assuming `Content-Disposition` is readable cross-origin because the API sends it:** JavaScript header visibility depends on CORS exposure; verify the actual browser response. `[VERIFIED: sibling API `cors()` source; implementation requirement]`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP assembly | Client-side ZIP generation or parsing | Sibling API artifact job/archive | Backend owns filesystem resolution, selector allowlist, ZIP entry names, and retention. `[VERIFIED: sibling API services; AGENTS.md]` |
| Authenticated download transport | Direct URL navigation or ad hoc token query parameter | `ApiService` + injected `HttpClient` + existing interceptor | Preserves the established bearer-auth boundary and avoids leaking tokens into URLs. `[VERIFIED: source/docs]` |
| Browser file-saving abstraction | `file-saver`, download library, or custom filesystem API | Blob URL + native anchor | Explicit D-04 prohibits a dependency; platform APIs cover this one-shot delivery. `[VERIFIED: D-04; MDN]` |
| Filename policy | Reconstructing a title/ID filename or trusting a URL path | Backend `Content-Disposition`, parsed and validated | Backend is the safe filename authority; client reconstruction violates D-03. `[VERIFIED: D-03; sibling API route]` |
| Job retry semantics | Starting another job for transport errors | Reuse completed `downloadUrl` and job snapshot | Avoids duplicate preparation and honors D-05. `[VERIFIED: D-05]` |

**Key insight:** The completed job and the binary delivery are separate operations. Keep them separate in state and tests: a successful archive preparation must remain reusable even if authentication, CORS, header parsing, Blob creation, or anchor activation fails. `[VERIFIED: API routes; locked context]`

## Common Pitfalls

### Pitfall 1: `Content-Disposition` is not exposed to the browser
**What goes wrong:** `response.headers.get('Content-Disposition')` returns `null` in production even though server tools show the header.
**Why it happens:** The frontend and API are cross-origin, and the current sibling API uses bare `cors()` without an observed `Access-Control-Expose-Headers` configuration. `[VERIFIED: sibling API `app.ts`]`
**How to avoid:** Verify the browser Network response and add/confirm `Access-Control-Expose-Headers: Content-Disposition` in the API CORS configuration before treating the frontend as complete. Do not fall back to an Angular-derived filename. `[CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]`
**Warning signs:** Header visible in curl but absent from Angular `HttpResponse.headers`; downloaded file gets browser-generated or hard-coded name.

### Pitfall 2: Duplicate automatic downloads
**What goes wrong:** Repeated polling, modal reopen, or Angular change detection starts multiple Blob requests/download prompts.
**Why it happens:** Completion is treated as an event without a job-scoped idempotence guard.
**How to avoid:** Key delivery attempts by completed `jobId` (or immutable completed URL), set the guard before subscribing, and only clear it for a new explicit delivery retry/reset. `[VERIFIED: Phase 5 duplicate-start guard pattern; D-02/D-05]`
**Warning signs:** More than one `downloadEpisodeArtifact` spy call for one job or multiple object URLs for one automatic attempt.

### Pitfall 3: Retry accidentally creates a new archive job
**What goes wrong:** A network/auth failure after preparation causes a second POST, potentially producing a duplicate archive and confusing progress.
**Why it happens:** Existing Phase 5 `retryArtifactJob()` is correctly a preparation retry for failed jobs, but delivery failure needs a distinct retry action.
**How to avoid:** Keep `retryArtifactJob()` for `state === 'failed'`; add a separate delivery retry that uses the completed snapshot’s unchanged `downloadUrl`. `[VERIFIED: Phase 5 source; D-05]`
**Warning signs:** `startEpisodeArtifactJob` count increases after a Blob transport error.

### Pitfall 4: Object URL cleanup occurs too early or never
**What goes wrong:** Browser download is intermittent, or Blob URLs accumulate during repeated manual retries.
**Why it happens:** URL is revoked before anchor activation or cleanup is omitted on exceptions.
**How to avoid:** Append/click/remove the temporary anchor, then revoke in `finally`; assert success and thrown-activation paths. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static]`
**Warning signs:** `revokeObjectURL` count is zero, or it runs before `anchor.click()` in a spy trace.

### Pitfall 5: Expired completed archive is treated as a preparation failure
**What goes wrong:** A valid completed modal shows a generic failed-job state after the archive expires or the download endpoint returns 404/409.
**Why it happens:** Delivery errors are collapsed into job state.
**How to avoid:** Preserve `artifactJob.state === 'completed'`, show “Download failed or expired; retry preparation” (copy may vary), and offer reset/new preparation separately from same-URL delivery retry. `[VERIFIED: sibling API route/service retention behavior; D-05]`
**Warning signs:** The UI offers only “Retry job” and POSTs immediately after a 404 download response.

### Pitfall 6: Manual DC 334 validation uses row metadata without matching storage
**What goes wrong:** The modal displays available files but the API archive omits them, or the fixture is copied into a directory the API does not resolve.
**Why it happens:** Phase 5 availability is based on row filename fields; the API uses canonical `episodes/<id>/<fixed-name>` paths and its own preflight.
**How to avoid:** Seed episode 334 and provision files in the sibling API’s configured `MEDIA_STORAGE_ROOT/episodes/334` layout, then verify the database row’s filename fields, API preflight `available/missing`, and ZIP entries together. `[VERIFIED: sibling API media-layout/artifact services]`
**Warning signs:** UI checks a selector that returns in `missing`, or ZIP entries do not use `episode-334/audio.mp3`, `trailer.mp3`, `cover.jpeg`, `cover.webp`, and `transcript.txt` names.

## Code Examples

### API response test seam

```typescript
let response: HttpResponse<Blob> | undefined;
apiService.downloadEpisodeArtifact('/v1/episodes/334/artifacts/jobs/job/download')
  .subscribe(value => response = value);

const request = httpTestingController.expectOne(
  `${environment.apiBaseUrl}/episodes/334/artifacts/jobs/job/download`
);
expect(request.request.method).toBe('GET');
expect(request.request.responseType).toBe('blob');
request.flush(new Blob(['zip-bytes'], { type: 'application/zip' }), {
  headers: new HttpHeaders({
    'Content-Disposition': 'attachment; filename="episode-334-artifacts.zip"',
  }),
});
expect(response?.body?.type).toBe('application/zip');
expect(response?.headers.get('Content-Disposition')).toContain('episode-334-artifacts.zip');
```

`HttpTestingController` is the project-appropriate way to assert method, URL, `responseType`, and response headers without starting a browser. `[CITED: https://v18.angular.dev/api/common/http/testing/HttpTestingController/]`

### Delivery test seams

Spy on `URL.createObjectURL`, `URL.revokeObjectURL`, `document.createElement`, and the temporary anchor’s `click`/`remove`. Assert:

- one Blob request and one anchor click when a completed snapshot first arrives;
- `anchor.download` equals the parsed server header filename;
- `URL.revokeObjectURL` runs after click and on thrown activation;
- partial warning remains visible;
- Blob error leaves modal open with completed state and delivery error;
- delivery retry calls the Blob method once and does not call `startEpisodeArtifactJob`;
- repeated completed snapshots and reopen do not auto-download again;
- reset clears delivery state and allows a deliberate new selection/job flow.

These are component/browser-API unit seams; final manual browser validation is still required because Karma cannot prove the operating system’s save dialog or actual downloaded file contents. `[VERIFIED: Phase 5 verification; test environment]`

### DC 334 manual validation procedure

1. Confirm the provided Windows fixture folder is available to the API runtime; it was not present under the Linux workspace during this research. `[VERIFIED: environment probe]`
2. Create or update the API episode row for `episodeId: 334` with title/metadata and filename fields matching the canonical media layout; use the API’s normal development database/configuration rather than introducing a frontend fixture. `[VERIFIED: sibling repository/service structure]`
3. Copy or map the source fixture’s available audio, trailer, cover, low-cover, and transcript files into the API’s resolved `MEDIA_STORAGE_ROOT/episodes/334/` names: `audio.mp3`, `trailer.mp3`, `cover.jpeg`, `cover.webp`, and `transcript.txt`. Preserve the source fixture; clean up only a dedicated validation copy. `[VERIFIED: sibling `episode-media-layout.service.ts` and artifact catalog]`
4. Run the sibling API build/start command and the Angular app with the intended `authBypass` mode. In bypass mode, verify the frontend and API bypass settings are both intentional; in normal mode, use a valid bearer-authenticated session. `[VERIFIED: docs/CONFIGURATION.md; sibling API verifier]`
5. Open episode 334, select all available artifacts, confirm, and record visible `Preparing files`, `Creating ZIP`, `Finalizing ZIP`, and `Archive ready` progress. Confirm exactly one Blob request/download. `[VERIFIED: Phase 5 state mapping; locked D-02]`
6. Inspect the downloaded ZIP using a standard archive listing tool or file manager. Expected canonical entries are `episode-334/audio.mp3`, plus each selected available entry under `episode-334/`; omitted selectors must match the visible warning. `[VERIFIED: sibling artifact catalog and Phase 4 verifier]`
7. Repeat with a partial selection/fixture, empty selection, failed preparation, expired/missing download, network/auth failure, reset, and delivery retry. Confirm delivery retry reuses the completed URL and never starts another artifact job. `[VERIFIED: requirements/UI-08; D-05; sibling API failure/expiry behavior]`
8. Restore API config/database/media fixture state in `finally`/cleanup steps and retain screenshots, request counts, header evidence, and ZIP entry listing as release evidence. `[VERIFIED: sibling verifier cleanup pattern]`

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma `~6.4.0` + Jasmine `~4.5.0` via Angular CLI 15. `[VERIFIED: package.json]` |
| Config file | `angular.json`, `tsconfig.spec.json`. `[VERIFIED: codebase]` |
| Quick run command | `npm test -- --watch=false --browsers=ChromeHeadless` when ChromeHeadless is installed. `[VERIFIED: Phase 5 verification command; browser availability remains environment-dependent]` |
| Full suite command | `npm test -- --watch=false --browsers=ChromeHeadless` plus `npm run build`. `[VERIFIED: package.json; Phase 5 verification]` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-07 | Completed snapshot triggers one authenticated Blob request, parses server filename, clicks one native anchor, and revokes object URL. | ApiService + component unit | `npm test -- --watch=false --browsers=ChromeHeadless` | Existing specs; add Phase 6 cases |
| UI-08 | Empty, partial, failed, delivery-error, reset, and same-job retry states render and preserve safe job boundaries. | component state/DOM | same | Existing `manage.component.spec.ts`; extend |
| VAL-01 | Episode 334 and media files resolve through the sibling API canonical layout. | API/manual integration | sibling API `npm run build` plus controlled runbook | No frontend test; manual fixture |
| VAL-02 | Visible progress and archive contents match selected available selectors. | manual browser + ZIP inspection | API/app runbook and archive listing | No existing E2E suite; manual evidence required |
| VAL-03 | Regression suite and production build pass. | build/test gate | `npm test -- --watch=false --browsers=ChromeHeadless && npm run build` | Existing scripts |

### Sampling Rate

- **Per task commit:** focused Angular test command for changed service/component specs.
- **Per wave merge:** full Karma suite plus `npm run build`.
- **Phase gate:** full suite green, build green, and DC 334 manual ZIP evidence before `$gsd-verify-work`.

### Wave 0 Gaps

- [ ] Add an `ApiService` Blob/header test using `HttpTestingController.flush()` with `HttpHeaders`.
- [ ] Add filename parser cases for quoted `filename`, `filename*`, whitespace, malformed/empty header, and unsafe path/control characters.
- [ ] Add Manage tests for exactly-once automatic delivery, object URL cleanup, error/retry without POST, partial warning persistence, reset, and completed-job reopen.
- [ ] Add/verify a sibling API CORS exposure test or browser check for `Content-Disposition`; this is a release blocker if the production frontend is cross-origin.
- [ ] Arrange Chrome/Chromium for Karma. Phase 5 verification compiled focused suites but could not execute them because ChromeHeadless was unavailable. `[VERIFIED: 05-VERIFICATION.md]`
- [ ] Prepare a dedicated DC 334 validation copy and cleanup procedure; the external Windows fixture was not found in this Linux workspace. `[VERIFIED: environment probe]`

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Angular/API build and tests | ✓ | v24.17.0 | — `[VERIFIED: environment probe]` |
| npm | project commands | ✓ | 12.0.1 | — `[VERIFIED: environment probe]` |
| Frontend `node_modules` | Angular build/tests | ✓ | project-installed | — `[VERIFIED: environment probe]` |
| Sibling API checkout | API contract and fixture validation | ✓ | source present | Mock/unit-only checks if API cannot run `[VERIFIED: environment probe]` |
| Chrome/Chromium executable | Karma behavior tests/manual UI | ✗ not found in this workspace | — | Install/configure a browser or use an equivalent browser-capable validation environment; source/build checks do not prove browser behavior `[VERIFIED: environment probe; 05-VERIFICATION.md]` |
| Windows DC 334 fixture path | VAL-01/VAL-02 | ✗ not mounted/found under `/home/jhonatt` | — | User-provided fixture must be mounted/copied into a controlled validation location; no meaningful real-content fallback `[VERIFIED: environment probe]` |

**Missing dependencies with no fallback:** Real DC 334 ZIP-content validation is blocked until the fixture is accessible; browser-level Karma/manual validation is blocked until a Chrome/Chromium-capable environment is available.

**Missing dependencies with fallback:** Angular service/component tests can still compile and use HTTP/browser API spies; API contract can still be inspected with the sibling verifier and synthetic fixtures, but those do not satisfy VAL-01/VAL-02.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Use `HttpClient` through the existing bearer-token interceptor; test missing/expired auth as a delivery error. `[VERIFIED: docs/CONFIGURATION.md; auth.interceptor.ts; sibling API verifier]` |
| V3 Session Management | yes | Do not put bearer tokens in `downloadUrl`, query params, DOM attributes, or logs; retain only opaque job URL/state in component memory. `[VERIFIED: docs/CONFIGURATION.md; D-01]` |
| V4 Access Control | yes | The API authorizes start/status/download; frontend row visibility is not authorization. Preserve 401/403/404/409 as recoverable, correctly worded states. `[VERIFIED: sibling API route/verifier]` |
| V5 Input Validation | yes | Accept only the backend-provided URL from the typed completed snapshot; validate the header filename before assigning it to `anchor.download`, and never accept a user-provided filename/path. `[VERIFIED: D-03; sibling API contract]` |
| V6 Cryptography | no new client cryptography | Reuse HTTPS/API auth configuration; do not sign or transform tokens in the frontend. `[VERIFIED: docs/CONFIGURATION.md]` |

### Known Threat Patterns for Angular authenticated downloads

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Direct unauthenticated API navigation | Spoofing/Elevation | Inject `HttpClient`; rely on `AuthInterceptor`; test `Authorization` at the request seam. `[VERIFIED: source]` |
| Header filename injection/path traversal | Tampering | Parse only the response header, reject control/path separators, and keep server safe-filename policy authoritative. `[CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]` |
| Stale/expired completed URL | Tampering/DoS | Bind retry to the retained job snapshot and surface 404/409; offer explicit reset/new preparation rather than silently replacing state. `[VERIFIED: sibling API route/service]` |
| Object URL retention | Information disclosure/resource exhaustion | Revoke every temporary URL after anchor activation or exception. `[CITED: https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static]` |
| Cross-origin header invisibility | Integrity/usability | Expose `Content-Disposition` through API CORS and verify in a real browser; do not invent a filename client-side. `[VERIFIED: sibling API app.ts; D-03]` |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Render completed `downloadUrl` as text only | Authenticated Blob response with native object URL delivery | Phase 6 scope, 2026-07-31 | Browser receives one ZIP while preserving bearer auth and server filename. `[VERIFIED: Phase 5 artifacts; Phase 6 context]` |
| Recreate a filename in Angular | Read `Content-Disposition` from the completed response | Locked D-03 | Backend controls safe filename; CORS exposure becomes a release check. `[VERIFIED: D-03; HTTP docs]` |
| Retry archive preparation for every failure | Separate transport retry from job retry | Locked D-05 | A completed archive is reusable without duplicate jobs. `[VERIFIED: D-05]` |

**Deprecated/outdated:**
- Phase 5’s plain-text `downloadUrl` display is only a handoff state; Phase 6 must invoke the URL through `HttpClient`, not turn it into a direct unauthenticated link. `[VERIFIED: Phase 5 source/context]`
- Any fallback that reconstructs `episode-${id}-artifacts.zip` in Angular is prohibited by D-03, even though that currently matches the sibling route’s emitted name. `[VERIFIED: D-03; sibling route]`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The production frontend is cross-origin from the API and therefore needs exposed response headers. | Summary/Common Pitfalls | If same-origin, CORS exposure may be unnecessary; if cross-origin, omission blocks server-authoritative filename handling. |
| A2 | The current API `Content-Disposition` filename is safe and stable enough for the client to accept after validation. | Filename pattern | A backend filename policy change could require parser/validation updates. |
| A3 | A temporary anchor click is the browser target for the project’s supported browsers. | Object URL pattern | A constrained browser may need a human-reviewed fallback, but no alternate library is in scope. |
| A4 | The user can provide or mount the Windows DC 334 fixture before manual validation. | DC 334 procedure | VAL-01/VAL-02 cannot be satisfied with synthetic fixtures alone. |

## Resolved Planning Questions

1. **Content-Disposition CORS exposure — authoritative prerequisite resolved.**
   - The sibling API checkout is `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api`; its authoritative Express CORS configuration is `../dragaocareca-admin-api/src/app.ts`, currently `app.use(cors())`.
   - Before Phase 6 browser acceptance, the API/deployment owner must change that authoritative CORS/deployment configuration to expose `Content-Disposition` with `Access-Control-Expose-Headers: Content-Disposition` for the Angular origin (and expose `X-Missing-Artifacts` only if the UI reads it).
   - Validation is concrete: build the sibling API with `npm run build`, start its normal development server, and use a real browser Network panel plus `HttpResponse.headers.get('Content-Disposition')` behavior to prove the header is readable cross-origin. A response that sends the header but does not expose it is a release blocker; Angular must not derive a filename.

2. **API fixture mounting/copy location — resolved.**
   - The provided Windows folder remains the immutable copy source: `E:\Jhonatt\DC\_VersãoFinalParaPostagem\_Episódios - Season 3\DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras`.
   - The controlled validation destination is the sibling API’s configured `MEDIA_STORAGE_ROOT/episodes/334/`; with the documented development default this is `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/data/media/episodes/334/`. If `MEDIA_STORAGE_ROOT` is overridden, resolve that configured value first and use its `episodes/334/` child. Never copy into the frontend repository and never mutate the Windows source.
   - The validation record must name the effective destination, preserve any pre-existing destination state, copy only the canonical available files, and restore/remove the dedicated copy after validation.

3. **Missing or unreadable filename header — resolved policy.**
   - Fail closed: keep the completed job visible, show a delivery error, offer the same-job delivery retry, and do not activate a download when `Content-Disposition` is absent, malformed, unsafe, or unreadable through CORS.
   - Release acceptance requires the authoritative API/deployment header exposure and a valid server-provided filename. No episode-title, episode-ID, URL-basename, hard-coded, or browser-default fallback is permitted under D-03.

## Sources

### Primary (HIGH confidence)

- `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md` — Angular boundary, auth modes, API assumptions, and runbook. `[VERIFIED: project files]`
- `.planning/phases/06-browser-download-release-validation/06-CONTEXT.md` — locked delivery/retry decisions. `[VERIFIED: project file]`
- `.planning/phases/05-episode-download-modal/05-CONTEXT.md`, `05-VERIFICATION.md`, `05-RESEARCH.md` — completed modal state and known browser-test limitation. `[VERIFIED: project files]`
- `src/app/core/api.service.ts`, `src/app/core/auth.interceptor.ts`, `src/app/app.module.ts`, `src/app/pages/manage/manage.component.*` — current HTTP, auth, modal, polling, and test seams. `[VERIFIED: codebase grep]`
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` — authenticated download response/status/header behavior. `[VERIFIED: sibling API source]`
- `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-download.service.ts`, `episode-artifact-preparation.service.ts`, `episode-media-layout.service.ts` — selector catalog, archive entries, paths, retention. `[VERIFIED: sibling API source]`

### Secondary (MEDIUM confidence)

- [Angular `HttpClient` API](https://v19.angular.dev/api/common/http/HttpClient) — `responseType: 'blob'` and `observe: 'response'` overloads. `[CITED: https://v19.angular.dev/api/common/http/HttpClient]`
- [Angular `HttpTestingController`](https://v18.angular.dev/api/common/http/testing/HttpTestingController/) — request matching and flushing test seam. `[CITED: https://v18.angular.dev/api/common/http/testing/HttpTestingController/]`
- [MDN Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) — attachment filename and `filename*` syntax. `[CITED: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition]`
- [MDN Using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications) and [MDN revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) — Blob URL delivery and cleanup. `[CITED: official MDN URLs]`
- [WAI-ARIA APG Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — existing modal focus/recovery expectations. `[CITED: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/]`

### Tertiary (LOW confidence)

- None for the core recommendation. Browser support and the deployment’s effective CORS policy remain environment-dependent assumptions listed above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing package manifest/source and official Angular API docs confirm the tools; no packages are added.
- Architecture: HIGH — Phase 5 state seams and sibling API routes are directly inspected; cross-origin header exposure is MEDIUM until browser-verified.
- Pitfalls: HIGH for auth/job/object-URL lifecycle; MEDIUM for deployment CORS and real fixture availability.

**Research date:** 2026-07-31
**Valid until:** 2026-08-07 for browser/API integration details; recheck if Angular, API CORS, or artifact contract changes.
