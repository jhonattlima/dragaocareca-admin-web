# Feature Landscape

**Domain:** Episode artifact selection and backend-generated ZIP downloads in an Angular podcast admin client
**Project:** Dragao Careca Admin Web
**Milestone:** v1.1 episode artifact downloads
**Researched:** 2026-07-28
**Overall confidence:** MEDIUM (project integration facts are HIGH; the new backend contract is not present in this repository)

## Scope and Confirmed Project Baseline

This milestone is an extension of the existing `/manage` Episodes tab. The current table has Edit/Delete actions, pagination, title/guest filtering, and an `Episode` model that already carries these artifact references:

| User-facing artifact | Existing `Episode` field | Availability rule for v1.1 |
|---|---|---|
| Episode file | `fileName` | Available when the field is non-empty |
| Trailer | `trailerFileName` | Available when the field is non-empty |
| Cover art | `coverFileName` | Available when the field is non-empty |
| Low cover art (`.webp`) | `coverLowFileName` | Available when the field is non-empty |
| Transcript | `transcriptFileName` | Available when the field is non-empty |

Confirmed from the repository: the frontend is thin and API-driven; `ApiService` is the shared HTTP boundary; `AuthInterceptor` supplies bearer auth; local development uses `authBypass`; and Bootstrap 5.3.8 is already installed. There is currently no artifact-download method, selection state, endpoint, or ZIP library in the frontend.

The following is a recommendation until the backend API documentation is available: the backend should accept an episode ID plus a typed list of artifact keys, generate the archive server-side, and return `application/zip` as a binary response. The frontend should not fetch individual files or create the ZIP.

## Typical User Flow

1. Operator sees a download-artifacts icon/button in each episode row.
2. Activating it opens a labeled modal for that episode, showing all five artifact types.
3. Available artifacts are checked by default, matching the requested “all available options checked” behavior. Missing artifacts are visibly unavailable and cannot be submitted.
4. Operator may uncheck any available item, then chooses Download ZIP.
5. The UI disables the submit action while the request is active and communicates that the backend is preparing the archive.
6. The backend response is received as a Blob. The browser downloads one ZIP with a deterministic episode-oriented filename.
7. The modal closes only after a successful download trigger, or remains open with a readable error if generation/download fails.

## Table Stakes

Features users expect. Missing = the product feels incomplete or unsafe for an operator workflow.

| Feature | Why Expected | Complexity | Notes |
|---|---|---:|---|
| Row-level download action | Operators need to identify the episode before selecting files | Low | Add an icon with a text/ARIA label such as “Download artifacts for episode 334”; do not rely on the icon alone. |
| Episode context in modal | Prevents downloading the wrong episode | Low | Show episode number/ID and title in the modal heading. |
| Five explicit artifact choices | The feature’s value is controlled retrieval of episode file, trailer, cover, low-cover `.webp`, and transcript | Low | Use stable backend keys, not display labels, in the request. |
| Default-select all available artifacts | Matches the requested operator behavior and minimizes clicks | Low | Missing files must not be silently represented as selected. Recommended: checked + disabled, or omitted with “Unavailable”; choose one contract and test it. |
| Select at least one validation | An empty archive request is confusing and may produce a backend error | Low | Disable Download ZIP when zero available items are selected and explain why. |
| Clear available/unavailable state | Operators need to know whether a missing file is a data problem or a failed download | Low | Display filename when present; display “Not available” when absent. |
| Cancel/close without mutation | Selection is transient and must not alter episode metadata | Low | Cancel resets only modal selection state. It must not call save/update or media delete endpoints. |
| Authenticated API request | Downloads are part of the protected admin workflow | Medium | Route through `ApiService` so the existing interceptor adds the bearer token and `authBypass` remains respected. |
| Binary response handling | ZIP bytes must not be parsed as JSON/text | Medium | Angular `HttpClient` supports `responseType: 'blob'`, returning `Observable<Blob>`; use this in the service. [Angular HTTP request docs](https://angular.dev/guide/http/making-requests), [HttpClient API](https://angular.dev/api/common/http/HttpClient) |
| Browser download trigger and cleanup | The operator expects a saved file, not a Blob object in the UI | Medium | Create a temporary object URL, trigger an anchor with a `.zip` filename, then revoke the URL. MDN documents `download`, `createObjectURL`, and `revokeObjectURL`. [Anchor download](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a), [revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL) |
| Loading, success, and failure states | ZIP generation may take longer than a normal JSON request | Medium | Prevent duplicate submissions; surface backend error messages where safe; restore controls after completion. |
| Stable filename and ZIP MIME type | Makes the output usable in Windows Explorer and predictable for operators | Low | Prefer backend `Content-Disposition` when exposed; otherwise fallback to a sanitized name such as `episode-334-artifacts.zip`. Backend should return `Content-Type: application/zip`. [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) |
| Keyboard and accessible modal behavior | This is an operator dialog, not a visual-only overlay | Medium | Labeled heading, `aria-labelledby`, visible focus, Escape/Cancel behavior, and keyboard-operable checkboxes/buttons. Bootstrap documents these modal/accessibility expectations. [Bootstrap modal](https://getbootstrap.com/docs/5.3/components/modal/), [Bootstrap accessibility](https://getbootstrap.com/docs/5.3/getting-started/accessibility/) |

## Differentiators

Useful improvements that fit the project, but are not required to prove the v1.1 flow.

| Feature | Value Proposition | Complexity | Recommendation |
|---|---|---:|---|
| File metadata in the modal | Size, filename, and “last updated” help operators verify they selected the intended asset | Medium | Add only if the episodes API already exposes trustworthy size/timestamps; do not make extra per-file requests in v1.1. |
| Select all / clear all controls | Faster for repeated partial-download workflows | Low | Good small enhancement after the basic five-checkbox flow is verified. “Select all” should mean all available, never unavailable items. |
| Download summary before submit | Shows “3 of 5 files selected” and avoids accidental partial archives | Low | Recommended for a compact footer status. |
| Download progress | Helps with large episode audio files and slow ZIP generation | High | Defer unless the backend streams progress or supports a job/status API. A single Blob response cannot provide reliable generation progress without additional backend support. |
| Backend-provided archive manifest | Makes the ZIP auditable and clarifies skipped/missing files | Medium | Useful if the backend can include a manifest or return selected/skipped metadata; not necessary for the first UI slice. |
| Retry without reopening | Reduces friction after a transient failure | Low | Preserve the selection on error and change the primary action to Retry. |
| Remember last selection | Helps operators who repeatedly download the same subset | Low | Defer: it risks stale assumptions when an artifact becomes unavailable and is not needed for a five-item list. |

## Anti-Features

Features or approaches to explicitly avoid.

| Anti-Feature | Why Avoid | What to Do Instead |
|---|---|---|
| Client-side ZIP generation | Duplicates backend business/storage logic, increases browser memory use for episode audio, and adds an unnecessary dependency | Submit artifact keys to the backend and download its ZIP Blob. |
| Downloading five files independently | Creates multiple failure points, prompts, and partial-completion ambiguity | Make one backend request and one ZIP download. |
| Treating filename strings as trusted paths | File names are backend data and may contain unsafe/path-like text | Render names as text only; let the backend resolve artifact paths by an allowlisted artifact enum. |
| Sending arbitrary file paths from the browser | Expands the API into a path traversal/storage exposure risk | Send only `episodeId` plus fixed keys such as `audio`, `trailer`, `cover`, `coverLow`, and `transcript`. |
| Closing the modal immediately on submit | Hides whether the request is still running and makes duplicate clicks likely | Keep it open and busy until the Blob response or error arrives. |
| Showing unavailable options as normal checked boxes | Implies an artifact will be included when it cannot be | Disable/mark unavailable and exclude it from the payload. |
| Adding a ZIP or file-download library | No browser-side archive creation is required; adds bundle and Angular 15/TypeScript 4.8 compatibility surface | Use Angular `HttpClient`, `Blob`, object URLs, and a temporary anchor. |
| Reusing edit/save state for downloads | Download selection is an ephemeral action and must not dirty or submit the episode form | Keep a dedicated `artifactDownloadState` and selected-episode reference. |
| Hardcoding the Windows mock path in production code | Couples the UI to a developer workstation and leaks environment-specific assumptions | Keep the Season 3 DC 334 fixture in test/mock data or a test harness; use only episode ID and mocked artifact fields. |

## UX Behavior and State Model

Recommended component state:

```text
closed
  → open (selected episode + derived availability + all available checked)
  → submitting (selection frozen, cancel/close policy explicit)
  → success (download triggered, close/reset)
  → error (message shown, selection preserved, retry available)
```

The modal should be controlled by Angular state, consistent with the existing custom delete/duplicate/reset overlays. Bootstrap’s CSS can supply the visual style; a Bootstrap JavaScript modal plugin is not required if the Angular template manages visibility, focus, Escape, backdrop, and cleanup correctly. If the Bootstrap plugin is used instead, keep one modal instance and avoid nested modals; Bootstrap documents one-modal-at-a-time behavior and recommends top-level placement.

Recommended labels:

- Episode file — show the existing `fileName`.
- Trailer — show `trailerFileName`.
- Cover art — show `coverFileName`.
- Low cover art (`.webp`) — show `coverLowFileName`.
- Transcript — show `transcriptFileName`.

Do not infer availability from episode status alone: use the actual non-empty artifact fields returned by `GET /v1/episodes`. A transcript may be present while its status is stale, so the backend remains authoritative for whether the requested artifact can be packaged.

## Feature Dependencies and Integration Points

```text
Episode list artifact fields
  → availability mapping and default selection
  → modal checkbox state
  → validated artifact-key payload
  → backend ZIP endpoint
  → HttpClient Blob response
  → object URL + browser download
```

| Dependency | Confirmed or open | Requirement implication |
|---|---|---|
| Episode list exposes five filename fields | Confirmed | No extra availability request is needed for the initial modal. |
| New backend endpoint and HTTP method | Open | Pin down exact route, e.g. `POST /episodes/:episodeId/artifacts/download`; do not invent it in implementation planning. |
| Request body shape | Open | Prefer `{ artifactTypes: string[] }` (or the backend’s established name) with an allowlisted enum; document it in `ApiService`. |
| Response type | Recommendation | `200`, `Content-Type: application/zip`, `Content-Disposition: attachment; filename=...`, body as ZIP bytes. |
| Cross-origin header exposure | Open | If the frontend must read the server filename from `Content-Disposition`, the API must expose that response header through CORS; otherwise use a safe client fallback filename. |
| Auth/interceptor behavior | Confirmed | The call must use Angular `HttpClient` via `ApiService`; do not use unauthenticated direct `fetch()`. |
| Modal styling/layout | Confirmed | Bootstrap 5.3.8 and existing sectioned/legacy-inspired styles are available. |
| Mock validation fixture | User-required, exact path open | Validate with mock Season 3 DC 334 data from the user’s Windows path, but keep the path outside production code and clarify the fixture location before test implementation. |

## MVP Recommendation

Prioritize:

1. Add a labeled download icon/button to each episode row.
2. Add an Angular-controlled modal showing all five artifact options, with every available option checked by default and unavailable options clearly disabled/marked.
3. Add a typed `ApiService` method for the agreed backend endpoint and artifact-key payload.
4. Request the response as `Blob`, trigger a single sanitized `.zip` download, and revoke the object URL.
5. Cover empty selection, duplicate-submit prevention, HTTP failure, malformed/empty Blob, and successful download with tests.
6. Validate the full flow using the Season 3 DC 334 mock episode, including a fixture where all five artifacts exist and a fixture with missing artifacts.

Defer: progress reporting, archive manifest, per-artifact metadata, remembered selections, and batch/multi-episode downloads. These require either more backend contract or add complexity without improving the requested single-episode flow.

## Verification Considerations

The requirements and roadmap should include these checks:

- The DC 334 row renders the download action without changing existing edit/delete behavior or pagination.
- Opening the modal derives the correct five availability states from mock fields and checks exactly the available options.
- Unchecking items changes the request payload; clicking Download with no items does not call the API.
- The API call includes the episode ID and only allowed artifact keys, and the auth interceptor remains in the request path.
- A mocked ZIP Blob creates one download with a `.zip` name and releases its object URL.
- A backend error leaves the modal open, preserves selection, shows a useful message, and allows retry.
- Unavailable files cannot accidentally enter the payload.
- Keyboard focus/close semantics and labels are usable in the modal.
- `npm run build` remains green; existing budget warnings are documented rather than treated as this feature’s failure.

## Sources and Confidence

- **HIGH:** Project-local `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `src/app/core/api.service.ts`, and `src/app/pages/manage/*` establish the existing fields, service boundary, auth, and layout constraints.
- **HIGH:** [Angular HTTP request documentation](https://angular.dev/guide/http/making-requests) and [HttpClient API](https://angular.dev/api/common/http/HttpClient) establish Blob response handling.
- **HIGH:** [MDN anchor download documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a), [MDN revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static), and [MDN Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) establish browser download and filename behavior.
- **HIGH:** [Bootstrap 5.3 modal documentation](https://getbootstrap.com/docs/5.3/components/modal/) and [Bootstrap accessibility guidance](https://getbootstrap.com/docs/5.3/getting-started/accessibility/) establish modal interaction/accessibility considerations.
- **MEDIUM:** The recommendation to avoid a ZIP library is an inference from the confirmed backend-generated-ZIP scope and the project’s current dependencies; it should be revisited only if the backend contract changes.

## Open Questions for Requirements

- What exact HTTP method, route, request body key, and artifact enum names does the new backend expose?
- Does the endpoint return the ZIP directly, or return a job ID requiring polling?
- Does the API return `Content-Disposition`, and is that header exposed by CORS?
- When a requested artifact disappears between list load and submit, should the backend fail the whole archive or skip it and report the omission?
- What is the intended archive filename convention and maximum archive size?
- Where is the canonical Season 3 DC 334 mock fixture, and what is its exact Windows path?
