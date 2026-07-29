# Project Research Summary

**Project:** Dragao Careca Admin Web
**Domain:** Angular podcast administration — selectable episode artifact downloads
**Milestone:** v1.1 Episode Artifact Downloads
**Researched:** 2026-07-28
**Confidence:** MEDIUM-HIGH

## Executive Summary

This is a narrow addition to the existing Angular 15 `/manage` operator workflow: an action on a persisted episode opens a five-artifact selection modal, and one authenticated backend request returns a ZIP. Experts build this as a thin client over a server-owned archive service. The UI derives initial availability hints from the existing episode fields, sends only stable artifact selectors, receives `HttpResponse<Blob>`, and triggers a native browser download; it does not resolve storage paths, fetch files individually, or assemble ZIPs in the browser.

The sibling API research confirms the concrete contract: `GET /v1/episodes/{episodeId}/artifacts/download?artifacts=episode,trailer,transcript,image,image-low`, with `application/zip`, deterministic `Content-Disposition`, and `X-Missing-Artifacts` for partial success. The frontend should preserve the existing `ApiService`/`AuthInterceptor` boundary and custom Angular overlay pattern. The key risks are contract drift, treating filename hints as authoritative, mishandling Blob-encoded errors or partial ZIPs, leaking object URLs, and validating only the all-files happy path. Requirements should lock the contract first, then test DC 334 plus missing-file, auth, retry, and binary-response cases.

## Key Findings

### Recommended Stack

Keep the locked stack stable: Angular 15.2.10, TypeScript 4.8.2, RxJS 7.x, Bootstrap 5.3.8, and the existing `HttpClient`/`ApiService`/`AuthInterceptor` path. No package installation or framework upgrade is justified.

**Core technologies:**

- `ApiService` + Angular `HttpClient`: encode the download endpoint and request selectors centrally; preserves bearer authentication and `authBypass` behavior.
- `HttpResponse<Blob>` with `responseType: 'blob'`: receive the backend-generated ZIP while retaining `Content-Disposition` and `X-Missing-Artifacts` headers.
- Native `Blob`, `URL.createObjectURL()`, temporary anchor, and `URL.revokeObjectURL()`: trigger one browser download without a file or ZIP library.
- Existing Bootstrap CSS and Angular-controlled overlay: match the legacy-inspired manage screen without adding Bootstrap JavaScript, Angular Material, or global state.

The canonical selectors confirmed by architecture research are `episode`, `trailer`, `transcript`, `image`, and `image-low`; UI labels map to these keys in one typed catalog. The exact API route, CSV query semantics, response headers, partial-success behavior, and errors should be treated as requirements-level contract, not re-invented during implementation.

### Expected Features

**Must have (table stakes):**

- Row-level, icon-based download action with visible tooltip/title and accessible name.
- Modal context showing the episode ID/number and title, with explicit choices for episode file, trailer, transcript, cover art, and low cover art (`.webp`).
- All five options checked by default per milestone request; unavailable/not-ready options must be visibly marked and excluded or otherwise handled according to the confirmed product rule.
- At-least-one-selection validation, Cancel/close without mutation, duplicate-submit prevention, busy/error/retry states, and keyboard-accessible dialog behavior.
- Authenticated single-request ZIP download with a safe deterministic `.zip` filename and object-URL cleanup.
- DC 334 Season 3 validation, focused HTTP/component tests, and a passing `npm run build`.

**Should have (competitive):**

- A compact selection count and “select all available/clear all” controls.
- A non-blocking warning when `X-Missing-Artifacts` reports omitted files from a still-successful ZIP.
- Retry without reopening while preserving the current selection after an error.

**Defer (v2+):**

- Progress reporting or job polling for ZIP generation; a single Blob response cannot provide reliable progress.
- Per-artifact size/timestamp metadata, archive manifests, remembered selections, batch/multi-episode downloads, and client-side ZIP inspection/generation.

### Architecture Approach

Extend `/manage` with a small presentational `EpisodeArtifactDownloadComponent`, while `ManageComponent` remains the feature orchestrator and `ApiService` remains the HTTP boundary. The modal receives a frontend-only five-item view model and emits intent; it must not inspect persistence models, call HTTP, or manipulate browser URLs. `ManageComponent` maps episode fields to availability hints, owns the selected episode and request state, invokes the service, handles headers/errors, and triggers the download. The backend remains authoritative when a filename is stale or disappears between list and submit.

**Major components:**

1. `ManageComponent` — opens the row action, maps the episode, validates selection, owns `idle/submitting/success/error` state, and handles download feedback.
2. `EpisodeArtifactDownloadComponent` — renders the accessible modal, labels, checkbox selection, disabled/busy controls, and Cancel/Download events only.
3. `ApiService` — issues the canonical authenticated GET with CSV selectors, `observe: 'response'`, and `responseType: 'blob'`.
4. Browser download helper within the feature boundary — uses the response Blob and safe filename, then revokes the object URL; no persistent URL state.
5. Backend artifact-download service — validates episode ID/selectors, resolves storage, creates the ZIP, returns partial-success metadata, and enforces auth/security/limits.

### Critical Pitfalls

1. **Availability is not the same as selection or filename presence** — use a stable descriptor catalog, keep the backend authoritative, prevent unavailable selectors from being submitted, and test stale/missing/not-ready files.
2. **Contract/key/path drift** — send only the confirmed canonical selectors and episode ID; never send filenames, Windows paths, display labels, or reconstructed storage paths.
3. **Binary and partial responses mishandled** — use `responseType: 'blob'` plus full response observation, parse Blob error bodies safely, and treat a `200` ZIP with `X-Missing-Artifacts` as a successful download with a warning.
4. **Auth and state regressions** — route through `ApiService` so the interceptor applies; keep download state separate from upload/transcription state; block double submits and handle late responses safely.
5. **Resource, filename, and accessibility failures** — sanitize `Content-Disposition`/fallback filenames, revoke every object URL, and implement the existing overlay with dialog semantics, keyboard close, focus behavior, and an accessible icon action.

## Implications for Roadmap

Based on research, the milestone should be planned as three phases (or three tightly scoped work packages if the roadmap uses fewer phases).

### Phase 1: Lock Artifact Download Contract and Service Boundary

**Rationale:** The endpoint and selector vocabulary are the hard dependency for every UI decision. Architecture research has a sibling API confirmation, while Stack/Features still flag the contract as absent from the frontend workspace; resolve that discrepancy before coding.

**Delivers:** Requirements and typed `ApiService` method for `GET /v1/episodes/{episodeId}/artifacts/download`, canonical CSV selector ordering, Blob/full-response handling, expected ZIP MIME and filename headers, `X-Missing-Artifacts`, errors, CORS exposure, and auth expectations.

**Addresses:** Authenticated API request, binary response handling, stable filename, and the backend-owned business-logic boundary.

**Avoids:** Wrong route or selector names, arbitrary path submission, direct unauthenticated navigation, JSON-vs-Blob confusion, and treating partial success as failure.

### Phase 2: Build the Episode-Row Modal and Orchestration

**Rationale:** Once the contract is fixed, the UI can be implemented as a local vertical slice without introducing dependencies or moving business rules into presentation code.

**Delivers:** Download icon in each persisted episode row; accessible Angular-controlled modal; five-option catalog mapped from `fileName`, `trailerFileName`, `transcriptFileName`, `coverFileName`, and `coverLowFileName`; requested default selection; empty-selection guard; busy/close/retry behavior; and integration from `ManageComponent` to `ApiService`.

**Uses:** Existing Angular/Bootstrap stack, custom overlay conventions, `AuthInterceptor`, and component-owned state.

**Implements:** Row action → modal → selector payload → service → Blob response flow while keeping edit/delete/pagination and existing upload/polling state independent.

**Avoids:** Modal-owned HTTP, stale selection leaking between episodes, inaccessible icon/dialog behavior, and global loading/error state collisions.

### Phase 3: Browser Download, Partial Results, and DC 334 Verification

**Rationale:** Binary behavior and backend archive contents cannot be proven by a green Angular build. This phase closes the operational loop and validates the required mock data plus failure boundaries.

**Delivers:** Safe filename selection, temporary anchor download, URL revocation, partial-artifact warning, bounded Blob error extraction, and focused unit/component tests plus browser/API validation against DC 334 Season 3 mock data.

**Addresses:** All-files and mixed-availability fixtures, one-selector download, empty selection, 400/401/404/500/network errors, retry, duplicate submission, auth/non-bypass behavior, object-URL cleanup, ZIP entry correctness, and `npm run build`.

**Avoids:** Fake downloads of error pages or empty Blobs, memory leaks, bypass-only confidence, and declaring success from the happy path alone.

### Phase Ordering Rationale

- The backend contract and canonical selector mapping precede UI work because they determine request shape, availability policy, headers, and partial-result UX.
- Service and modal orchestration stay together as one thin frontend slice: the modal emits intent, `ManageComponent` coordinates, and `ApiService` owns transport.
- Verification follows integration because ZIP integrity, CORS header visibility, auth, and browser download cleanup require the complete path.
- Progress, manifests, batch downloads, and client-side archive tooling remain out of v1.1 because they require new backend capabilities or violate the thin-client boundary.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1:** Confirm sibling API evidence against the actual backend revision, exact CORS exposure for `Content-Disposition`/`X-Missing-Artifacts`, transcript readiness semantics, maximum archive limits, and partial/missing-file policy.
- **Phase 3:** Confirm the canonical location/shape of the DC 334 Season 3 fixture and test the supported production browser’s native Blob download behavior with large audio.

Phases with standard patterns (skip research-phase):

- **Phase 2:** Existing Angular `HttpClient`, typed service, component input/output modal, Bootstrap CSS, and custom `*ngIf` overlays are established repository patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Existing Angular 15 stack and native browser primitives are directly confirmed; exact backend contract was initially unavailable in frontend research but is confirmed by sibling API evidence. |
| Features | MEDIUM-HIGH | User flow and existing episode fields are confirmed; unavailable-option/default-selection semantics and transcript readiness need one product decision. |
| Architecture | HIGH | Repository boundaries and sibling API route/response behavior are documented; browser/CORS details still need runtime verification. |
| Pitfalls | MEDIUM-HIGH | Twelve concrete failure modes are grounded in project code and HTTP/browser behavior; some browser-specific timing and backend edge cases require tests. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Default selection versus unavailable options:** The milestone says all available artifacts are selected by default, while one architecture note suggests checking all five and letting the backend report missing files. Requirements must choose the user-visible rule; recommended behavior is check available items, visibly disable/mark missing or not-ready items, and submit only valid selections.
- **Backend/frontend revision alignment:** Verify the confirmed sibling route and selectors (`episode`, `trailer`, `transcript`, `image`, `image-low`) against the deployed/local backend used for v1.1.
- **Transcript availability:** Decide whether a non-empty `transcriptFileName` is enough or whether `transcriptStatus === 'done'` is required for initial availability.
- **CORS and headers:** Confirm browser exposure of `Content-Disposition` and `X-Missing-Artifacts`; retain a safe client filename fallback if headers are inaccessible.
- **DC 334 fixture:** Identify the canonical mock location and represent the Windows source path as test/mock data, never production filesystem logic.
- **Validation ownership:** Backend tests should prove ZIP entries and partial behavior; frontend tests should prove request selectors, UI state, download trigger, error handling, and cleanup.

## Sources

### Primary (HIGH confidence)

- Project docs: `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, and `docs/TESTING.md` — app boundaries, auth modes, API conventions, and build gate.
- Repository sources: `src/app/core/api.service.ts`, `src/app/core/auth.interceptor.ts`, and `src/app/pages/manage/*` — existing service, episode fields, manage layout, and state patterns.
- Sibling API sources: `../dragaocareca-admin-api/src/routes/episodes.routes.ts`, `src/services/episode-artifact-download.service.ts`, `src/docs/openapi.ts`, and `src/scripts/verify-episode-artifact-downloads.ts` — route, selector, ZIP, partial-success, and error contract.

### Secondary (MEDIUM confidence)

- [Angular HttpClient API](https://angular.dev/api/common/http/HttpClient) and [making HTTP requests](https://angular.dev/guide/http/making-requests) — Blob/full-response handling.
- [Angular interceptors](https://angular.dev/guide/http/interceptors) — centralized auth/request middleware.
- [MDN Blob URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob), [revokeObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static), [anchor download](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a), and [Content-Disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Disposition) — browser save, cleanup, and filename behavior.
- [Bootstrap 5.3 modal documentation](https://getbootstrap.com/docs/5.3/components/modal/) — accessibility and modal interaction considerations.

---
*Research completed: 2026-07-28*
*Ready for roadmap: yes*
