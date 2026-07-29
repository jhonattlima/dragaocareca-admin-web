# Architecture Patterns

**Domain:** Angular admin episode artifact downloads
**Project:** dragaocareca-admin-web
**Researched:** 2026-07-28
**Confidence:** HIGH for repository and sibling API integration facts; MEDIUM for browser download mechanics

## Confirmed Existing Boundaries

This is an extension of the routed `/manage` feature, not a new application flow. The current Angular 15 app uses a sectioned, legacy-inspired manage screen; `ManageComponent` owns episode list/editor state and calls the singleton `ApiService`; `EpisodeFormComponent` is a presentational template wrapper that receives the parent controller and editor state. `AuthInterceptor` attaches the bearer token to `HttpClient` requests, while `environment.authBypass` controls local auth behavior. The feature should preserve all of those boundaries.

The current episodes table has an Actions column with Edit and Delete buttons. Add a compact download icon/button there. Keep the download action available from the persisted episode row, not from the add-episode editor: the artifact endpoint operates on a positive, existing episode ID and final media files.

The existing `Episode` model already exposes the relevant availability hints (`fileName`, `trailerFileName`, `coverFileName`, `coverLowFileName`, and `transcriptFileName`). These are useful for the modal's initial checked/available state, but the backend must remain authoritative because a filename can be stale or a file can be absent on disk.

## Recommended Architecture

```text
episodes table row
  -> ManageComponent.openArtifactDownload(episode)
  -> artifact-download modal (selection state only)
  -> ManageComponent.downloadEpisodeArtifacts(episodeId, selectors)
  -> ApiService.downloadEpisodeArtifacts(id, CSV)
  -> GET /v1/episodes/:id/artifacts/download?artifacts=...
  -> HttpResponse<Blob> (ZIP + headers)
  -> browser URL.createObjectURL(blob) -> temporary <a download> -> revoke URL
```

Use a small new `EpisodeArtifactDownloadComponent` under `src/app/pages/manage/` for the modal. It should render labels, checkboxes, disabled/unavailable indicators, Cancel, and Download. It should not call HTTP, inspect `Episode`, or manipulate browser URLs. Its inputs should be the selected episode display data and a five-item artifact view model; its output should emit the selected selector array and close/cancel events.

`ManageComponent` should remain the feature orchestrator for the first implementation. Add modal-open state, the pending episode, selected selectors, download-busy state, and a download error/status message there. This is consistent with the existing delete/reset modal pattern and avoids introducing a global modal service. If the manage component becomes harder to test, the next safe extraction is a pure artifact-selection helper or a dedicated download facade service; do not move episode business rules into the modal.

### Component boundaries

| Component/service | Responsibility | Communicates with |
|---|---|---|
| `ManageComponent` (modified) | Opens modal from a row, maps the episode's known file fields to display availability, validates at least one selection, invokes API, handles Blob/header/error state, triggers browser download, closes/resets modal | `EpisodeArtifactDownloadComponent`, `ApiService`, existing episode list/template |
| `EpisodeArtifactDownloadComponent` (new) | Accessible modal presentation and checkbox selection; emits user intent | `ManageComponent` via inputs/outputs |
| `ApiService` (modified) | Encodes endpoint path, `HttpParams`, Blob response type, and full response observation | `HttpClient` and `AuthInterceptor` |
| `Episode` interface (modified only if needed) | Keeps existing file-name availability fields; no new download URL or storage logic | `ManageComponent` |

Do not add a third-party ZIP library. The server already creates the ZIP, and the browser only needs to save the returned Blob. Do not use a direct `window.open()` URL: that bypasses the Angular request path and can omit the bearer token.

## Confirmed Backend Contract

The sibling `dragaocareca-admin-api` OpenAPI definition and route verifier confirm:

```text
GET /v1/episodes/{episodeId}/artifacts/download
    ?artifacts=episode,trailer,transcript,image,image-low
```

The `artifacts` query parameter is one CSV value. Valid selectors and their archive meanings are:

| Selector | UI label | Backend media kind | ZIP entry name |
|---|---|---|---|
| `episode` | Episode file | audio | `episode-{id}/audio.mp3` |
| `trailer` | Trailer | trailer | `episode-{id}/trailer.mp3` |
| `transcript` | Transcript | transcript | `episode-{id}/transcript.txt` |
| `image` | Cover art | cover | `episode-{id}/cover.jpeg` |
| `image-low` | Low cover art (.webp) | coverLow | `episode-{id}/cover.webp` |

The endpoint is bearer-protected. `episodeId` must be a positive integer. The server deduplicates selectors and preserves its catalog order. A request with no `artifacts` query means all five selectors, but the UI should send the user's explicit checked selection so the request reflects the modal and does not silently include a file the operator unchecked.

Successful responses are `200 application/zip` with deterministic `Content-Disposition`: `attachment; filename="episode-{id}-artifacts.zip"`. If some requested files are absent, the server still returns a ZIP containing available requested artifacts and sets `X-Missing-Artifacts` to a comma-separated selector list. If none are available, it returns `404 { message: "No requested artifacts found" }`; a missing episode is `404 { message: "Episode not found" }`; invalid selectors or IDs are `400`; auth failures are `401`.

The API source verifies this contract with partial fixtures and OpenAPI assertions. The frontend should treat the `Episode` filename fields as display hints only and handle the partial ZIP/header case as a warning, not as a failed download. A response containing a ZIP and missing-artifact header is still a successful download.

## ApiService Integration

Add a typed selector and download response contract in `src/app/core/api.service.ts`:

```typescript
export type EpisodeArtifactSelector =
  | 'episode' | 'trailer' | 'transcript' | 'image' | 'image-low';

downloadEpisodeArtifacts(
  episodeId: number,
  selectors: readonly EpisodeArtifactSelector[],
): Observable<HttpResponse<Blob>> {
  const params = new HttpParams().set('artifacts', selectors.join(','));
  return this.http.get(`${environment.apiBaseUrl}/episodes/${episodeId}/artifacts/download`, {
    params,
    observe: 'response',
    responseType: 'blob',
  });
}
```

Import `HttpResponse` alongside the existing `HttpClient`, `HttpEvent`, and `HttpParams` imports. Keeping this method in `ApiService` ensures the existing interceptor adds `Authorization`; it also gives unit tests a single seam for request URL, query order, Blob response handling, and headers. Angular's documented `observe: 'response'` plus `responseType: 'blob'` overload returns `HttpResponse<Blob>` and exposes response headers.

The API method should reject empty selector arrays in the component before calling the service. It should not silently omit the query parameter unless product explicitly chooses the backend's “all” default. Use the server's canonical selector order when building the checkbox model so ZIP contents and missing-header order are predictable.

## Modal State and Data Flow

Define a frontend-only catalog, separate from `Episode` persistence data:

```typescript
interface ArtifactOption {
  selector: EpisodeArtifactSelector;
  label: string;
  fileName: string | null;
  availableHint: boolean;
  checked: boolean;
}
```

When opening, map `episode.fileName`, `trailerFileName`, `transcriptFileName`, `coverFileName`, and `coverLowFileName` to the five options. Initialize `checked` to true for all options, as requested, including options whose availability hint is false. The modal should visibly mark a hinted-missing option and allow the operator to uncheck it; do not preclude selecting it because the backend may have a file even when list metadata is stale. If product instead requires only available options to be checked, make that a requirements decision; it is not implied by the current API.

On submit:

1. Modal emits selected selectors in canonical order.
2. `ManageComponent` closes or locks the modal while `downloadBusy` is true and clears stale error/success text.
3. `ApiService` issues the authenticated GET with CSV query parameters.
4. On `HttpResponse<Blob>`, validate that a body exists, read `Content-Disposition` only as optional metadata, and use the deterministic `episode-{id}-artifacts.zip` fallback.
5. Create an object URL, click a temporary anchor with `download`, then revoke the URL in a `finally`/completion path. Do not retain Blob URLs in component state.
6. Read `X-Missing-Artifacts`; show a non-blocking warning naming the omitted files after the ZIP starts downloading.
7. On error, parse the normal JSON error body from the failed `HttpErrorResponse` Blob when possible and display a readable message; keep the modal/episode list usable.

Because the API is cross-origin in local development (`localhost:4200` to `localhost:3000`), verify that the backend CORS response exposes `Content-Disposition` and `X-Missing-Artifacts` if the browser must read them. `app.ts` currently uses `cors()` but the artifact route's custom-header visibility should be confirmed in browser DevTools. The download itself does not depend on reading those headers.

## Build Order

1. **Lock the API contract.** Confirm the frontend is targeting `/episodes/:episodeId/artifacts/download`, selector spellings, CSV semantics, ZIP content type, deterministic filename, partial-success header, and error JSON. Add/confirm CORS exposure for custom headers if needed.
2. **Add `ApiService` types and method.** Unit-test URL construction, selector ordering, `observe: 'response'`, `responseType: 'blob'`, and bearer-interceptor compatibility.
3. **Add the modal component.** Build the five-option accessible modal with all options checked by default, selection changes, Cancel, submit-disabled-on-empty, busy locking, and no HTTP logic. Declare it in `AppModule`; no Bootstrap JS dependency is required because the app already uses custom `*ngIf` modal backdrops.
4. **Integrate the table and manage orchestration.** Add the icon action, modal state, episode-to-option mapping, submit handler, error state, and cleanup. Keep edit/delete behavior unchanged and ensure pagination/filtering still renders the action for every row.
5. **Implement Blob save behavior.** Use the API response body and safe fallback filename; surface partial ZIP warnings from `X-Missing-Artifacts`; release object URLs.
6. **Verify with mock data.** Use the Season 3 DC 334 episode fixture from the user's Windows path to populate an episode row and test all-five selected, one selected, partial availability, none available, invalid selection, and API failure. The Angular browser cannot read a Windows path directly; the fixture must be copied/imported into the mock backend/media fixture or represented in mocked `Episode` data while the browser uses the API's returned Blob.
7. **Run regression checks.** Execute focused component/API tests and `npm run build`. Perform local `authBypass=true` browser verification, then one normal-auth or interceptor test to ensure the new request carries the bearer token.

## Anti-Patterns to Avoid

### Direct URL navigation for the ZIP

`window.location` or `window.open` would make auth behavior inconsistent and prevents reliable access to the partial-success header. Route the request through `ApiService` and save the returned Blob.

### Modal-owned HTTP and episode business logic

Putting `ApiService` calls in the modal would deepen the current manage-screen coupling and make the modal dependent on persistence models. Keep the modal reusable and intent-focused.

### Client-side artifact availability as authority

A filename field is not proof that a final file exists. Let the server decide which requested artifacts enter the ZIP; use the header to explain omissions.

### Treating a partial ZIP as an error

The backend deliberately returns `200` when at least one requested artifact exists. Download it, then warn about `X-Missing-Artifacts`.

### Adding ZIP or Bootstrap modal dependencies

ZIP creation belongs to the backend and modal rendering already has an established custom pattern. New dependencies increase bundle and integration surface without solving this milestone.

## Verification Matrix

| Scenario | Expected frontend behavior |
|---|---|
| DC 334, all five checked, all files available | One authenticated GET with all five selectors; browser saves `episode-334-artifacts.zip`; no warning |
| DC 334, all checked, only some final files available | ZIP still saves; warning lists selectors from `X-Missing-Artifacts`; available files remain usable |
| One selector checked | CSV contains exactly that selector; ZIP contains only that artifact |
| All unchecked | No request; inline modal validation keeps the modal open |
| Backend returns 404 no requested artifacts | No fake download; readable error; modal can be retried/cancelled |
| Backend returns 400/401 | No fake download; display API error; auth behavior follows existing interceptor/guard |
| Cancel or switch episode while idle | Modal closes and selection state resets; no stale episode ID remains |
| Component destroyed during request | Busy state and object URL cleanup do not leak; no late UI mutation |

## Sources

- Confirmed project docs: `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, and `.planning/PROJECT.md`.
- Confirmed sibling API implementation: `../dragaocareca-admin-api/src/routes/episodes.routes.ts`, `src/services/episode-artifact-download.service.ts`, `src/docs/openapi.ts`, and `src/scripts/verify-episode-artifact-downloads.ts`.
- Angular `HttpClient` API documentation for Blob/full-response overloads: [Angular HttpClient API](https://v17.angular.io/api/common/http/HttpClient) (MEDIUM confidence; version page is v17, but the `HttpClient` response contract is applicable to the project's Angular 15 API surface).

<!-- gsd:architecture-research-end -->
