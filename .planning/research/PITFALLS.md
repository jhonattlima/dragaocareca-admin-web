# Domain Pitfalls

**Project:** Dragao Careca Admin Web
**Milestone:** Episode artifact downloads
**Domain:** Angular admin UI for selectable episode artifact downloads and backend-generated ZIPs
**Researched:** 2026-07-28
**Overall confidence:** MEDIUM-HIGH

This file is scoped to the requested v1.1 download milestone. Confirmed facts are derived from the current repository and project docs; recommendations are implementation guidance for the new endpoint and UI contract.

## Confirmed Integration Context

- The frontend is an Angular 15 / TypeScript 4.8.2 client with a shared `ApiService`; backend business rules and ZIP generation remain out of scope for the browser.
- The episode model already exposes the relevant availability fields: `fileName`, `trailerFileName`, `coverFileName`, `coverLowFileName`, and `transcriptFileName`.
- The episode list is rendered by `ManageComponent`, which already owns pagination, editing, upload/delete state, transcription polling, and several custom overlays. Adding download behavior there has a meaningful regression surface.
- Normal API requests receive `Authorization: Bearer <token>` from `AuthInterceptor`. With `environment.authBypass=true`, the frontend guard/login bypasses auth, but the backend must also be running in a compatible local bypass mode.
- Existing tests are sparse. `ManageComponent` has focused summary-polling tests, but no coverage for episode CRUD/media flows or binary downloads. The root component spec is stale according to `docs/TESTING.md`.
- The supplied validation fixture is the Season 3 DC 334 episode on the user’s Windows path. A browser cannot read that Windows path directly; validation must either seed/mock the episode through the app/API or use the file only in a backend/local fixture workflow.

## Critical Pitfalls

### 1. Treating “checked” as “file exists”

**What goes wrong:** The modal opens with all five checkboxes checked, including artifacts whose filename field is empty, stale, or not actually present on disk. The request then asks the backend for unavailable files, producing an avoidable whole-download failure or a ZIP with surprising omissions.

**Why it happens:** The UI has five known artifact types, but availability is represented by optional filename fields and may change after the episode list was loaded. A checkbox’s selected state is not the same as backend availability.

**Consequences:** Operators cannot tell why an item was omitted; “all available checked” is violated; a transcript still processing can be presented as downloadable; the backend may return a 4xx for a selection that was valid when the modal opened.

**Prevention:** Build modal rows from an explicit artifact descriptor containing a stable API key, label, filename, and `available` flag. Default `selected` to `available`, disable unavailable rows, and display a reason such as “Not uploaded” or “Transcript not ready.” Before submit, send only selected available keys. Keep the backend authoritative and handle a file disappearing between list and download as a normal error.

**Detection:** Test an episode with all files, one missing file, no files, and a transcript status other than `done`. Verify checkbox defaults, disabled state, outgoing selection, and user-visible messaging.

### 2. Confusing artifact names, API keys, and filesystem paths

**What goes wrong:** The frontend sends display labels or filenames where the endpoint expects stable artifact identifiers, or it infers paths such as `episodes/334/...` from a filename. It may also send `coverLow` while the backend expects `cover-webp`.

**Why it happens:** Existing upload endpoints use path suffixes (`audio`, `trailer`, `cover`, `cover-webp`), while the new download request may have a different contract. The frontend should not reconstruct backend storage paths.

**Consequences:** Files are omitted, the wrong asset is selected, backend validation fails, or a future storage layout change breaks the UI.

**Prevention:** Define one typed request contract in `ApiService` using the exact backend vocabulary. Map UI-only labels to API keys in one place. Do not derive a path from the user’s Windows fixture path, `fileName`, or episode number. Confirm the request shape and response headers with the API contract before implementation.

**Detection:** Unit-test the exact URL, HTTP method, JSON body, and selected artifact keys for DC 334 and a mixed selection. Treat a test that only checks “some request happened” as insufficient.

### 3. Parsing a ZIP response as JSON or assuming the response is always a Blob

**What goes wrong:** The new method reuses the default `HttpClient` JSON behavior, or types the response as `Blob` while the backend actually returns an error JSON/HTML document. The code then creates a download from an error payload or reports an opaque browser failure.

**Why it happens:** Existing `ApiService` methods are predominantly JSON and text calls. Angular’s generic type is a compile-time assertion, not runtime validation. Binary downloads require `responseType: 'blob'`; an error still arrives through the HTTP error channel and can itself have a Blob body when the request’s response type is binary.

**Consequences:** A corrupt `.zip` is downloaded for a 401/404/500 response, error messages are lost, or TypeScript overload workarounds hide a mismatch in the actual response.

**Prevention:** Implement the download request centrally in `ApiService` with an explicit literal `responseType: 'blob'`. Use `observe: 'response'` if the filename or MIME type comes from headers. In the component, distinguish success from `HttpErrorResponse`, and if an error body is a Blob, read it as text only as a bounded error-message fallback. Do not trust the generic type as validation; check that the successful Blob is non-empty and has a plausible ZIP MIME type when the contract makes that guarantee.

**Detection:** Flush a real Blob in an Angular HTTP test; separately simulate 400/401/404/500 responses with JSON and Blob error bodies. Assert that no anchor is clicked and no ZIP is reported as successful on error.

### 4. Losing the backend-generated filename

**What goes wrong:** The browser saves every file as `download.zip`, uses an unsafe title verbatim, or ignores a `Content-Disposition` filename supplied by the backend.

**Why it happens:** The response body and filename are separate concerns. Returning only the body from `HttpClient` discards headers, and parsing `Content-Disposition` casually can mishandle quoting, encoding, or malicious path components.

**Consequences:** Operators overwrite similarly named downloads, cannot identify the episode, or receive a filename with path traversal characters or unusable characters.

**Prevention:** Prefer a backend-provided safe filename and expose it through `observe: 'response'`; otherwise generate a conservative fallback such as `episode-334-artifacts.zip`. Strip directory components and unsafe control/path characters before assigning the anchor’s `download` value. Do not trust a filename as an instruction to write outside the browser’s download directory.

**Detection:** Test absent, quoted, encoded, and malformed `Content-Disposition` headers, plus titles containing slashes, quotes, accents, and very long text.

### 5. Creating an object URL and never releasing it

**What goes wrong:** Each download creates a new Blob URL that remains referenced for the lifetime of the page.

**Why it happens:** The happy path often ends immediately after `anchor.click()`, while cleanup is forgotten or placed in a branch that does not run after an error.

**Consequences:** Repeated large episode downloads retain Blob memory and can degrade or crash a long-lived operator session.

**Prevention:** Create one object URL per successful response, trigger the temporary anchor, and revoke the URL after the browser has had a chance to begin the download. Put cleanup in a `finally`-equivalent path for created URLs; also clean any outstanding URL on component destruction if the implementation keeps one as state.

**Detection:** Spy on `URL.createObjectURL` and `URL.revokeObjectURL`; assert one revoke per created URL, including close/navigation and failed-trigger paths.

### 6. Bypassing the interceptor with a direct `fetch()` or download URL

**What goes wrong:** The implementation constructs a plain `<a href="...">` or calls `window.fetch()` against the API URL. The request lacks the bearer token, or it relies on credentials/cookies that this application does not use.

**Why it happens:** Native navigation looks simpler for downloads, but `AuthInterceptor` only applies to Angular `HttpClient` requests. The project stores a JWT in local storage and attaches it centrally to `HttpClient` traffic.

**Consequences:** Downloads work in `authBypass` development mode but fail with 401 in production, leading to a misleading “download feature works locally” result. A cross-origin redirect can also lose the intended auth context.

**Prevention:** Route the download through `ApiService` and `HttpClient` so the existing interceptor applies. Do not put the JWT in a query string or expose it in a generated link. Verify both `authBypass=true` local behavior and normal bearer-token behavior with `authBypass=false`.

**Detection:** In an HTTP unit test, assert the `Authorization` header on the download request when a token exists. In browser validation, test an expired/missing token and confirm a visible auth failure rather than a downloaded error file.

### 7. Shipping or testing with the wrong auth bypass configuration

**What goes wrong:** The local mock path masks missing auth headers, or `authBypass: true` is accidentally included in a production build.

**Why it happens:** The current development environment enables bypass and the login page redirects immediately. This makes the happy path convenient but removes an important integration check.

**Consequences:** Production operators see unauthorized downloads, or protected artifact contents become reachable without the intended guard if the production environment replacement is mispackaged.

**Prevention:** Keep bypass handling limited to the existing environment contract. Add a production-build/configuration check that asserts `authBypass` is false. Include a normal-auth test for the new method and a local mock-data test that does not pretend to validate production auth.

**Detection:** Inspect the built environment configuration and test a non-bypass run against the backend. Treat a passing bypass-only validation as incomplete.

### 8. Leaving the modal or row in a contradictory loading state

**What goes wrong:** Double-clicking submits duplicate ZIP jobs; closing the modal does not cancel or invalidate the request; the modal closes before the download is created; or an error leaves the Download button disabled forever.

**Why it happens:** The request is asynchronous and the manage screen has independent upload, delete, polling, and global message state. A single boolean can be reset by the wrong callback or shared across episodes.

**Consequences:** Duplicate backend work, stale ZIPs for a different episode, buttons that stop responding, or an operator who cannot distinguish “preparing ZIP” from “browser download started.”

**Prevention:** Track download state with an episode identity and explicit phases such as `idle`, `submitting`, `success`, and `error`. Disable submit while active, allow safe cancellation/close behavior, and ignore late results whose episode no longer matches the active modal. Always reset state in success and error handlers. Keep download loading separate from upload progress and summary/transcription polling.

**Detection:** Test double submit, close-while-pending, switch-page-while-pending, success, error, and retry. Verify that only one backend request is made and that retry is possible after failure.

### 9. Building an inaccessible or fragile custom modal

**What goes wrong:** The icon-only action has no accessible name; the modal lacks `role="dialog"`, `aria-modal`, a labelled heading, keyboard close, focus handling, or a backdrop that prevents interaction with the page. Alternatively, Bootstrap’s CSS modal markup is combined with its JavaScript plugin without adding/configuring the required JS dependency, or a second modal mechanism conflicts with the existing custom overlays.

**Why it happens:** The project already uses state-driven custom overlays for delete/duplicate/reset confirmations, while Bootstrap 5.3 modal behavior is a JavaScript plugin separate from the CSS classes.

**Consequences:** Keyboard and screen-reader users cannot complete the download; clicks leak to the episode table; focus is lost; or modal scroll/z-index behavior is inconsistent.

**Prevention:** Reuse the project’s established overlay pattern unless there is a deliberate reason to adopt Bootstrap’s JS modal. Give the icon a tooltip/title and `aria-label`, make the dialog labelled and keyboard-dismissible, restore focus to the trigger, and prevent submit when no artifacts are selected. Keep the modal at a top-level position compatible with fixed overlays.

**Detection:** Validate keyboard-only open/close/submit, Escape behavior, focus restoration, screen-reader labels, backdrop clicks, mobile viewport scrolling, and repeated open/close cycles.

### 10. Validating only the “all five files present” happy path

**What goes wrong:** Validation uses the DC 334 fixture with every expected file and concludes the feature is complete. It misses empty selections, missing transcript, stale list data, backend partial-file policy, malformed ZIP, and large audio download behavior.

**Why it happens:** The requested fixture is useful for an end-to-end smoke test, but it does not cover the availability matrix or failure boundaries.

**Consequences:** Operators encounter failures only on real historical episodes, where media is commonly incomplete or transcript generation is still pending.

**Prevention:** Make DC 334 the named happy-path fixture, then add a mock matrix: all available; audio only; no transcript; missing cover-webp; no files; selected unavailable item; backend rejects one selection; empty/corrupt Blob; unauthorized; network failure; and retry after failure. Verify the resulting ZIP entries and that no unselected artifact appears.

**Detection:** Use `HttpTestingController` for deterministic request/response tests and a real browser/backend validation for the DC 334 ZIP. A passing `npm run build` is required by project rules but does not prove binary behavior.

### 11. Treating a successful HTTP response as proof the ZIP is usable

**What goes wrong:** The UI reports success for a zero-byte, HTML error page returned with status 200, or ZIP whose entries do not match the requested selection.

**Why it happens:** The frontend cannot fully validate ZIP structure without adding a ZIP parser, and the backend owns archive generation. Status-only checks are still too weak for a useful operator result.

**Consequences:** Operators save an archive that fails to open or silently lacks requested files.

**Prevention:** Keep ZIP creation and archive policy backend-owned. At the frontend boundary, require a non-empty Blob, use the backend’s documented MIME/filename contract, and surface a generic “download received but may be invalid” only if the contract allows such a state. Put entry-level correctness checks in backend tests or the milestone’s integration validation, not in a new browser ZIP library unless explicitly required.

**Detection:** Open the downloaded DC 334 archive and compare entries against the selected set. Include backend tests for partial/missing artifacts and archive integrity.

### 12. Letting user-visible error extraction assume JSON

**What goes wrong:** The existing pattern `error?.error?.message` is applied unchanged to a Blob error. The UI shows a generic message even when the backend supplied a useful reason, or attempts to render binary data as text.

**Why it happens:** Current JSON endpoints usually provide an object-shaped error; a `responseType: 'blob'` request changes the error body representation.

**Consequences:** Missing-file and auth failures become indistinguishable, increasing support burden and making retry decisions unclear.

**Prevention:** Centralize a small, bounded error-message helper for this flow: handle object JSON, text, Blob text, status 0, and fallback status messages. Never display raw HTML or unbounded backend content. Preserve the existing manage-screen alert conventions and avoid overwriting unrelated upload/transcription messages.

**Detection:** Assert messages for 401, 403, 404, 409/validation, 500, status 0, and Blob-encoded JSON errors.

## Moderate Pitfalls

### Selection state leaks between episodes

Reset the descriptor array whenever a modal opens for a new episode. Do not store selection by row index; use artifact keys so pagination and reordering cannot select the wrong file.

### Modal submit sends an empty selection

Disable the action and explain the requirement when all checkboxes are cleared. Do not call the backend merely to discover that an empty artifact list is invalid.

### Missing transcript status is interpreted as missing transcript file

`transcriptFileName` and `transcriptStatus` are different facts. Show a transcript as available only under the contract’s readiness rule, normally a present file plus a completed status. Confirm whether an existing filename is sufficient for historical episodes.

### Download feedback is global and gets overwritten

Use a download-specific message/state region or keyed state. The existing component has global `errorMessage`/`successMessage` fields and concurrent upload/polling work; a late unrelated response must not erase the download result.

### Browser behavior is assumed to be identical everywhere

Test the supported desktop browser used by operators, plus at least one alternate browser if required by deployment. Programmatic anchor downloads and object URL timing can differ from a normal navigation, especially for large Blobs and popup/download restrictions.

### Artifact labels expose backend filenames as trusted HTML

Render filenames as interpolated text, not `[innerHTML]`. Filenames are backend-derived data and should be treated as untrusted even if uploads are normally controlled.

## Minor Pitfalls

### Icon affordance is ambiguous

Use a download icon with an accessible name and a visible tooltip/title. The action should be discoverable without relying on color alone.

### Large ZIPs freeze the impression of the page

Disable only the relevant download controls, retain a clear “Preparing download…” state, and avoid tying the operation to the entire manage-screen loading state.

### Browser download starts after the modal has been destroyed

If closing the modal destroys the trigger or clears state before the response callback runs, the download callback may lose its filename/episode context. Capture immutable request context and make cleanup independent of modal DOM lifetime.

## Phase-Specific Warnings

| Phase topic | Likely pitfall | Mitigation |
|-------------|----------------|------------|
| Backend contract / `ApiService` | Wrong method, key names, or binary response type | Confirm exact endpoint/body/headers; test `responseType: 'blob'` and `observe: 'response'` explicitly |
| Artifact availability model | Checkbox defaults include missing or not-ready files | Derive disabled/selected state from explicit availability; test all five artifact combinations |
| Manage-screen UI | Download state collides with upload/delete/polling state | Keep a keyed download state machine and preserve existing custom overlay conventions |
| Auth integration | Bypass-only testing hides missing bearer auth | Assert interceptor header and run one non-bypass validation with a real/expired token |
| Browser download | Corrupt filename or leaked object URLs | Sanitize fallback names, revoke URLs, and test anchor-trigger cleanup |
| Error handling | Blob-encoded JSON errors are treated as successful ZIPs | Cover HTTP and network errors; decode bounded Blob error text where useful |
| DC 334 validation | Happy-path fixture proves only one matrix cell | Verify archive entries, then run missing-file, empty-selection, auth, retry, and large-file cases |
| Release verification | Build passes while download contract is untested | Run focused unit tests, browser/API smoke test, and required `npm run build` |

## Verification Checklist for Requirements Planning

- [ ] API method and request body are specified with exact artifact keys.
- [ ] Successful response is a Blob; filename/MIME header behavior is specified.
- [ ] Missing and not-ready artifacts are visibly disabled and excluded from the request.
- [ ] Empty selection is blocked locally.
- [ ] Authenticated and `authBypass` paths are tested separately.
- [ ] 401/403/404/409/500/status-0 and Blob error bodies produce actionable UI messages.
- [ ] Double-submit, close-while-pending, retry, and stale-episode races are covered.
- [ ] Object URL creation/revocation and filename sanitization are tested.
- [ ] DC 334 mock data is used for deterministic UI tests; the real/browser validation opens the resulting ZIP and checks entries.
- [ ] `npm run build` remains green; known Angular budget warnings are not confused with download correctness.

## Sources

### Project sources (confirmed facts)

- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONFIGURATION.md`
- `docs/TESTING.md`
- `src/app/core/api.service.ts`
- `src/app/core/auth.interceptor.ts`
- `src/app/pages/manage/manage.component.ts`
- `src/app/pages/manage/manage.component.html`
- `.planning/codebase/CONCERNS.md`

### External sources (recommendations; MEDIUM confidence)

- [Angular: Making HTTP requests](https://angular.dev/guide/http/making-requests) — `responseType: 'blob'`, literal typing, response headers, and `HttpErrorResponse` behavior.
- [Angular: HttpClient API](https://angular.dev/api/common/http/HttpClient) — Blob and full-response overloads.
- [Angular: Interceptors](https://angular.dev/guide/http/interceptors) — request/response middleware boundary.
- [MDN: Using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications) — object URL creation and explicit release.
- [MDN: `URL.revokeObjectURL()`](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) — releasing object URLs.
- [Bootstrap 5.3: Modal](https://getbootstrap.com/docs/5.3/components/modal/) — modal JavaScript, focus, backdrop, and fixed-position considerations.

## Research Limitations

- The new backend download endpoint and its exact request/response contract were not present in this frontend repository, so endpoint path, artifact key spelling, partial-file policy, and `Content-Disposition` guarantees remain open integration questions.
- External documentation was used for browser/Angular behavior; the final implementation should pin decisions to the backend API contract and the browsers supported by deployment.
