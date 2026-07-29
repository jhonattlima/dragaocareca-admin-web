# Technology Stack

**Project:** Dragao Careca Admin Web — episode artifact downloads
**Researched:** 2026-07-28
**Overall confidence:** MEDIUM

## Scope and confirmed baseline

This is a narrow v1.1 addition to the existing Angular 15 admin client. The repository currently uses Angular 15.2.10 in the lockfile, TypeScript 4.8.2, RxJS 7.x, Bootstrap 5.3.8, `HttpClientModule`, template-driven forms, a shared `ApiService`, and a hand-built Angular-controlled modal overlay for delete/reset confirmations. `AuthInterceptor` already attaches the bearer token to API requests, and `environment.apiBaseUrl` already provides the correct `/v1` boundary.

The frontend should remain an orchestrator. The backend should select the requested stored artifacts, construct the ZIP, set the response headers, and return the binary response. The browser should only collect selection state and save the returned ZIP.

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Angular `@angular/common/http` `HttpClient` | Existing 15.2.10 lockfile resolution | Submit artifact selection and receive ZIP bytes | Angular supports `responseType: 'blob'` as a typed `Observable<Blob>` response; this is the native fit for a backend-generated archive. No new HTTP client is needed. |
| TypeScript | Existing 4.8.2 | Type the artifact enum, selection payload, and binary response | It is already the project’s supported compiler line. Angular’s compatibility table lists Angular 15.1/15.2 with TypeScript `>=4.8.2 <5.0.0`. |
| RxJS | Existing 7.x (`~7.5.0` package range) | Observable lifecycle for the download request and UI busy/error state | Consistent with `ApiService`; no promise wrapper or global state layer is necessary. |

### API Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing `ApiService` | Repository pattern | Add one typed download method | Keeps URL construction, request typing, and future contract changes in the shared service rather than in `ManageComponent`. |
| Existing `AuthInterceptor` | Repository pattern | Authenticate the POST/download request | The request is made through Angular `HttpClient`, so the current bearer-token path and `authBypass` behavior remain intact. |
| JSON request + binary response | Backend contract to confirm | Send selected artifact identifiers; receive `application/zip` | The backend owns archive creation. The request should contain an explicit allow-listed artifact enum, not filenames or storage paths supplied by the browser. |

### Browser Download Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `Blob` + `URL.createObjectURL()` | Browser platform | Represent the returned ZIP as a downloadable URL | Native, widely supported, and already available to the Angular browser target. |
| `HTMLAnchorElement.download` | Browser platform | Trigger a user download with a safe filename | Avoids navigating the admin page to the binary response and requires no library. |
| `URL.revokeObjectURL()` | Browser platform | Release the object URL after triggering the download | Important for a long-lived admin screen because active object URLs retain their backing Blob until released. |
| `Content-Disposition` response header | HTTP/backend contract | Supply the generated ZIP filename | Prefer `attachment; filename="...zip"; filename*=UTF-8''...` from the backend. The client should parse a conservative filename fallback if the header is missing or inaccessible. |

### UI / Modal

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Existing Bootstrap CSS/classes | 5.3.8 | Layout, checkbox styling, buttons, spacing | Fits the current sectioned legacy-inspired manage screen. |
| Existing Angular `*ngIf` overlay pattern | Repository pattern | Artifact-selection modal | The repo already controls modal visibility and actions in Angular. A single new dialog does not justify adding Bootstrap’s imperative JavaScript bundle, `@ng-bootstrap/ng-bootstrap`, Angular Material, or a dialog state library. |

## Exact implementation shape recommended

Add a small domain type in or beside `api.service.ts`:

```typescript
export type EpisodeArtifact = 'episode' | 'trailer' | 'cover' | 'coverWebp' | 'transcript';

export interface EpisodeArtifactDownloadRequest {
  artifacts: EpisodeArtifact[];
}
```

The names above are a frontend recommendation only. The backend team must confirm the canonical route and field names before implementation. Do not send the episode’s stored filenames or Windows paths; the backend should resolve `episodeId` plus an allow-listed artifact selection to its own storage records.

The `ApiService` method should use the typed full response so the component can read both the Blob and the filename header:

```typescript
downloadEpisodeArtifacts(
  episodeId: number,
  request: EpisodeArtifactDownloadRequest,
): Observable<HttpResponse<Blob>> {
  return this.http.post(
    `${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/download`,
    request,
    { observe: 'response', responseType: 'blob' },
  );
}
```

If the backend chooses `GET` with query parameters instead, preserve the same `observe: 'response'`/`responseType: 'blob'` behavior and keep the route decision in `ApiService`. Prefer `POST` when the selected artifact set is represented as a request body.

The component should:

1. Open the modal from an icon-only action in the episode row, with an accessible `aria-label` and tooltip/title.
2. Initialize only artifacts that actually exist on the selected `Episode` as checked. The user request says all available options should be checked; unavailable options should be disabled and unchecked rather than submitted.
3. Require at least one selected artifact before submitting.
4. Disable close/submit controls while the request is active, show a short progress/busy message, and retain the modal on failure so the user can retry.
5. On success, create an object URL from the returned Blob, click a temporary anchor with the server-derived or safe fallback `.zip` filename, then revoke the URL asynchronously after the click.
6. Clear modal/download state after success and surface backend errors using the existing component-level error-message convention.

There is no need for client-side ZIP assembly, ZIP inspection, streaming decompression, or a save-file API for this milestone.

## Backend contract requirements before coding

The project docs do not yet list the new endpoint, so requirements should pin down these items first:

| Contract item | Required decision |
|---------------|-------------------|
| Route and method | Exact endpoint, likely scoped by `episodeId`; do not hard-code the suggested path until confirmed. |
| Request schema | Stable enum names for episode file, trailer, cover art, low-cover-art `.webp`, and transcript; reject unknown values server-side. |
| Availability semantics | Define whether missing requested files are ignored, produce a validation error, or return a partial-result report. The UI should normally prevent unavailable selections. |
| Response | `200`, `Content-Type: application/zip`, and a deterministic `Content-Disposition` filename. |
| Errors | JSON error payloads must remain distinguishable from a Blob error response; Angular may expose an error body as a Blob when `responseType: 'blob'` is set, so the UI may need to read it as text before displaying `message`. |
| CORS | Production is cross-origin (`https://api.dragaocareca.com` vs the admin origin). If the client reads `Content-Disposition`, the backend must include `Access-Control-Expose-Headers: Content-Disposition` in the CORS response. |
| Limits | Backend should enforce episode ownership/auth, allowed artifact names, archive size/time limits, and safe ZIP entry names. |
| Filename | Return a safe ASCII fallback plus `filename*` for UTF-8 episode titles; never derive a filesystem path from the browser request. |

## Alternatives considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| ZIP creation | Backend-generated ZIP | `JSZip` or equivalent in the browser | Would require fetching each artifact separately, duplicate backend storage/business rules, increase memory use for large audio, and create more auth/error cases. |
| Download helper | Native Blob URL + anchor | `file-saver` | Adds a dependency for a two-step browser primitive already supported by the project’s target browsers. Reconsider only if verified support requirements include a browser where the native path fails. |
| HTTP client | Existing Angular `HttpClient` | `fetch`, Axios, or a second API client | Bypasses the existing interceptor and `ApiService` contract boundary; would risk authBypass/production divergence. |
| Modal | Existing Angular overlay pattern with Bootstrap CSS | Bootstrap JS modal, `@ng-bootstrap/ng-bootstrap`, Angular Material, CDK Dialog | Adds lifecycle, bundle, or visual-system complexity for one dialog and does not match the current manage-screen implementation. |
| State management | Component-owned modal state | NgRx/signals store/global download manager | The flow is local to one table row and one request; global state would be disproportionate. |
| File system API | Browser download prompt | File System Access API | Requires extra permission/user-gesture considerations and is unnecessary when the requirement is simply downloading a ZIP. |

## Installation

No package installation is recommended for this milestone.

```bash
# No new runtime or dev dependency
npm install
npm run build
```

Do not upgrade Angular, TypeScript, Bootstrap, or RxJS as part of this feature. Angular 15 is out of active support, but a framework migration is unrelated scope and would introduce avoidable risk to the legacy manage screen. Keep the existing lockfile stable.

## Verification considerations

Use the requested mock Season 3 / DC 334 episode data to exercise all five availability states. The Windows source path is test fixture context only; a browser cannot read arbitrary files from that path without an explicit user file selection, and this feature should not upload those local files. Mock the API response as a Blob containing a small ZIP fixture and verify:

- the row action opens the correct episode’s modal;
- all available artifact checkboxes begin checked;
- missing artifact fields are disabled and never included in the request;
- zero selections prevent the request;
- the request contains only allow-listed artifact keys and the correct `episodeId`;
- `Authorization` still comes from the existing interceptor/auth mode;
- success triggers a `.zip` download and releases the object URL;
- backend failure leaves a readable error and re-enables retry;
- a cross-origin response exposes the filename header, with a fallback filename when it does not.

Run `npm run build` as the required project gate. Add focused `ApiService`/component tests with `HttpTestingController` or the project’s existing Jasmine setup; the current manage specs are already component-focused and should be extended rather than replaced with a new test framework.

## Sources

- [Angular HttpClient API](https://angular.dev/api/common/http/HttpClient) — `responseType: 'blob'` and `observe: 'response'` overloads. **Confidence: MEDIUM** (current official docs applied to the locked Angular 15 API shape).
- [Angular version compatibility](https://angular.dev/reference/versions) — Angular 15.1/15.2 TypeScript and RxJS constraints. **Confidence: HIGH** (official compatibility table; current page retains historical unsupported-version entries).
- [Angular making HTTP requests](https://angular.dev/guide/http/making-requests) — non-JSON response types. **Confidence: MEDIUM** (current official guide; implementation should verify Angular 15 overload syntax).
- [MDN: blob URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob) and [MDN: revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static) — object URL creation and release. **Confidence: HIGH**.
- [MDN: HTMLAnchorElement.download](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/download) — native download trigger. **Confidence: HIGH**.
- [MDN: Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) and [MDN: HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers) — attachment filenames and CORS header exposure context. **Confidence: HIGH**.
- [Bootstrap 5.3 modal documentation](https://getbootstrap.com/docs/5.3/components/modal/) — Bootstrap modal JS is optional to this repo’s custom Angular overlay approach. **Confidence: HIGH**.
- Repository evidence: `package.json`, `package-lock.json`, `src/app/core/api.service.ts`, `src/app/core/auth.interceptor.ts`, and `src/app/pages/manage/manage.component.html`. **Confidence: HIGH** for current project facts.

## Research limitations

The backend repository or API specification was not available in this workspace, so the exact route, request field names, and response filename contract remain to be confirmed during requirements definition. The research cache write also could not complete because the configured cache directory was read-only; findings are preserved here with source links and explicit confidence labels.
