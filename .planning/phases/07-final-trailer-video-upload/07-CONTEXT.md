# Phase 7: Final Trailer Video Upload - Context

**Gathered:** 2026-08-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Add final MP4 trailer-video upload to the New Episode File Management workflow using the existing authenticated API contract and media lifecycle. The phase covers selection, upload progress, cancellation, retry, replacement, and safe finalized-media state. YouTube upload, processing, hashtag lookup, title generation, and public publishing belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Upload timing and media lifecycle
- **D-01:** Trailer video upload happens alongside the other media uploads after the episode record exists and has an episode ID.
- **D-02:** Use the existing `POST /v1/episodes/:episodeId/trailer-video` contract and treat the video like the other media files: upload to the staging folder first, then promote atomically to the finalized media location.
- **D-03:** Preserve the previous finalized trailer until the replacement upload completes successfully; a failed or canceled replacement must not remove the last-known-good video.

### Cancellation, retry, and replacement
- **D-04:** Canceling an in-progress local upload stops the browser request and leaves the selected file available for retry.
- **D-05:** Retry may reuse the selected file without requiring the operator to choose it again; the operator may also choose a different replacement video.
- **D-06:** The UI must distinguish selected, uploading, canceled, failed, staged/promoting, and finalized states and must not expose YouTube actions in this phase.

### File Management presentation
- **D-07:** Add a dedicated Trailer video card alongside the existing Episode audio, Trailer audio, and cover upload cards.
- **D-08:** Match the established upload-card treatment for drag/drop, file selection, progress, busy state, success, error, and replacement behavior.

### the agent's Discretion
- Exact copy, iconography, spacing, and helper text within the established sectioned File Management card pattern.
- Whether the upload helper is generalized or a new video-specific definition is added, provided behavior remains consistent and testable.
- Exact client-side MP4 hinting, while the API remains authoritative for MIME, extension, and size validation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and milestone scope
- `.planning/PROJECT.md` — frontend/backend boundary, v1.2 goals, auth and layout constraints.
- `.planning/REQUIREMENTS.md` — `TRAILER-01` through `TRAILER-05` requirements.
- `.planning/ROADMAP.md` — Phase 7 goal, dependencies, and success criteria.
- `.planning/research/SUMMARY.md` — v1.2 research synthesis, upload/replacement safety, and phase boundaries.

### Frontend architecture
- `docs/README.md` — documented product/UI assumptions.
- `docs/ARCHITECTURE.md` — Angular page and API orchestration architecture.
- `docs/CONFIGURATION.md` — environment and auth assumptions.
- `.planning/codebase/STACK.md` — Angular, HttpClient, RxJS, Bootstrap, and test stack.
- `.planning/codebase/ARCHITECTURE.md` — ManageComponent and ApiService integration patterns.
- `.planning/codebase/INTEGRATIONS.md` — authenticated backend boundary and existing media endpoints.

### Existing implementation references
- `src/app/pages/manage/manage.component.ts` — existing upload definitions, upload state, drag/drop, progress, and media lifecycle orchestration.
- `src/app/pages/manage/manage.component.html` — existing File Management/upload-card template integration through the episode form.
- `src/app/core/api.service.ts` — existing multipart upload methods and `HttpEventType.UploadProgress` contract.
- `../dragaocareca-admin-api/README.md` — existing final trailer-video upload contract and canonical storage semantics.
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — server-side media upload, staging, promotion, and validation boundary.
- `../dragaocareca-admin-api/src/services/episode-trailer-video.service.ts` — final trailer-video replacement and last-known-good behavior.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ApiService.uploadEpisodeFile()` and existing media upload wrappers — already issue authenticated multipart requests with progress events.
- `ManageComponent.uploadDefinitions`, `uploadStates`, `uploadMedia()`, drag/drop handlers, and `getUpload*()` helpers — established state and interaction patterns to extend with a video kind.
- `app-episode-form` File Management rendering — existing episode form owns the upload-card presentation used by Add episode.

### Established Patterns
- Component-local editor/upload state with no global store.
- Angular `HttpClient` observables and `HttpEventType.UploadProgress` for progress reporting.
- Backend-authoritative validation; client-side accept attributes are hints only.
- Auth is supplied by the shared interceptor; the frontend does not access media paths directly.
- Existing uploads use staging/promotion and update the editor from the returned episode response.

### Integration Points
- Add the new upload kind and API method in `src/app/core/api.service.ts` and `ManageComponent`.
- Extend the episode form’s File Management upload-card definitions/template to render the final trailer video card.
- Preserve existing audio, trailer-audio, cover, cover-webp, transcript, summary, and save flows.
- Coordinate any API contract corrections in the sibling API before depending on them in the UI.

</code_context>

<specifics>
## Specific Ideas

- The user explicitly wants the trailer video treated like the other files: upload to staging, then promote after successful upload.
- The user explicitly wants cancellation and retry while preserving the selected file, with the ability to select a replacement.
- YouTube controls should appear only in later phases after local trailer upload is finalized.

</specifics>

<deferred>
## Deferred Ideas

- YouTube upload/processing progress, private link return, hashtag search count, title generation, and explicit public publishing — Phase 8/9.
- Adding `trailer-video` to the Episodes artifact modal and ZIP validation — Phase 11.

</deferred>

---

*Phase: 07-final-trailer-video-upload*
*Context gathered: 2026-08-03*
