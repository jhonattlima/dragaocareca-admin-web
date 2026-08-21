# Phase 7: Final Trailer Video Upload - Pattern Map

**Mapped:** 2026-08-03  
**Files analyzed:** 9 implementation/test surfaces  
**Analogs found:** 9 / 9; backend pre-save contract resolved through a new server-issued draft reservation.

## File Classification

| File | Role | Data Flow | Closest Analog | Match |
|---|---|---|---|---|
| src/app/core/api.service.ts | service | request-response/file-I/O | same file:240-283 | exact |
| src/app/core/api.service.spec.ts | test | request-response/file-I/O | same file:1-92 | role |
| src/app/pages/manage/manage.component.ts | component/controller | request-response/file-I/O | same file:1838-1998 | exact |
| src/app/pages/manage/manage.component.spec.ts | test | request-response/event-driven | existing deferred tests:299-320 | role |
| src/app/pages/manage/episode-form.component.html | component/template | request-response/file-I/O | upload-card loop:8-70 | exact |
| src/app/pages/manage/manage.component.html | integration template | request-response | app-episode-form usage:7-16 | exact |
| ../dragaocareca-admin-api/src/routes/episodes.routes.ts | route/controller | request-response/file-I/O | generic upload:224-314; video route:404-440 | role; gap |
| ../dragaocareca-admin-api/src/services/episode-trailer-video.service.ts | service | file-I/O/transactional replacement | replaceEpisodeTrailerVideo():20-82 | exact for persisted replacement |
| sibling API trailer-video tests (to add) | test | request-response/file-I/O | no dedicated analog | none |

## Pattern Assignments

### src/app/core/api.service.ts (service, request-response/file-I/O)

Copy the existing helper at lines 240-246: create FormData, append field file, POST to the environment API URL, and request observe events plus reportProgress true. Add uploadEpisodeTrailerVideo(episodeId, file) as a wrapper using path suffix trailer-video, with the same Observable<HttpEvent<Episode>> type. Add trailerVideoFileName and any agreed lifecycle/status fields to the Episode response type. Keep authentication in the existing interceptor; do not expose media paths.

### src/app/core/api.service.spec.ts (test, request-response/file-I/O)

Use the TestBed/HttpClientTestingModule/HttpTestingController setup at lines 1-23 and exact method/URL assertions at lines 30-40. Add tests for POST /episodes/42/trailer-video, multipart field file, and UploadProgress followed by terminal HttpResponse. Retain httpTestingController.verify() in afterEach.

### src/app/pages/manage/manage.component.ts (component/controller, request-response/file-I/O)

Extend UploadKind at line 14 with a distinct video kind, UploadState at lines 41-46 with retained File, lifecycle status, error, active subscription/generation as needed, and UploadDefinition at lines 48-55 with trailerVideoFileName. Add a definition beside audio/trailer/cover (lines 191-224) with .mp4,video/mp4; accept is a browser hint only.

Reuse drag/drop/input behavior at lines 1188-1221, including clearing input.value to permit same-file retry. Dispatch the new kind from getUploadRequest() at lines 1975-1985 to the new ApiService wrapper.

Copy progress handling from lines 1875-1930, but make the video state machine explicit: selected -> uploading -> staged/promoting -> finalized, with uploading -> canceled/failed. Keep the selected File and previous finalized name through cancel/failure; only patch the editor on the matching terminal HttpResponse, never at 100% progress. Store and unsubscribe the active subscription on cancel, reset, and ngOnDestroy. Use a generation/token guard so late response A cannot finalize replacement B. Retry reuses the retained File; a new selection starts a new generation.

Preserve positive episode-ID validation at lines 940-943 and immediate upload from the add form; do not move upload into saveEpisode() (lines 621-658).

### src/app/pages/manage/episode-form.component.html (component/template, request-response/file-I/O)

Extend the File Management definition loop at lines 8-70. Preserve the established card title, filename, description, drag/drop, hidden input, busy state, delete/replacement behavior, and progress bar. Add video-only conditional cancel/retry/status controls for selected, uploading, canceled, failed, staged/promoting, and finalized. Do not render YouTube upload, processing, publishing, hashtag, or title-generation controls.

### src/app/pages/manage/manage.component.html (integration template, request-response)

Keep the existing app-episode-form integration at lines 7-16. Both addEditorState and episodesEditorState must receive the same video definition/state behavior; no separate upload owner or modal is needed.

### ../dragaocareca-admin-api/src/routes/episodes.routes.ts (route/controller, request-response/file-I/O)

Reuse trailerVideoUploadSpec at lines 129-138: server-derived trailer.mp4 staging/final names, .mp4, MIME video/mp4/application/mp4, and configured max bytes. Preserve requireAuth, positive ID validation, single multipart field file, and server-owned paths.

The current route at lines 406-440 calls replaceEpisodeTrailerVideo() and returns 404 when no episode row exists. That violates D-01/D-02 for New Episode. Add `POST /v1/episodes/drafts` as the explicit authenticated reservation resource, returning opaque `{draftId, episodeId, state, expiresAt}`; require `X-Episode-Draft-Id` on pre-save upload and create, bind it to authenticated email and episodeId, and reject arbitrary unreserved IDs. Retain validated staging and return a typed staged response. Never write directly to final storage or delete the prior final before promotion succeeds.

The create/update promotion loop at lines 376-397 iterates uploadSpecs, excluding trailerVideo. Extend the server-owned promotion path to atomically promote staged video and persist trailerVideoFileName. Add bounded cleanup for abandoned drafts and make disconnected/canceled multipart uploads harmless.

### ../dragaocareca-admin-api/src/services/episode-trailer-video.service.ts (service, file-I/O/transactional replacement)

Reuse the rollback pattern at lines 45-81: validate expected staging path, copy existing final to a temporary previous path, copy staged bytes to a prepared path, rename prepared to final, update repository with canonical relative filename/status, restore previous final on failure, and clean temporary/staging files in finally.

Do not call this service unchanged for pre-save drafts: lines 36-39 require a persisted row and lines 74-82 delete staging, conflicting with retry. Separate retain-staged-draft from promote-finalized-replacement semantics.

### Sibling API trailer-video tests (new test surface, request-response/file-I/O)

No dedicated analog was found. Add tests for reservation issuance/expiry/owner binding, auth, invalid ID, missing file, MIME/extension/size validation, authorized draft staging, retry/cancel cleanup, select-before-Save create promotion/failure, persisted replacement rollback, final-file preservation, canonical episodes/{id}/trailer.mp4, and no YouTube call.

## Shared Patterns

### Auth and authorization

Sources: routes episodes.routes.ts:227,406 and the frontend AuthInterceptor architecture. Use the existing ApiService/interceptor in the browser; keep requireAuth server-side and add ownership/reservation checks for draft IDs. Preserve authBypass and add no provider credentials.

### Server-owned media lifecycle

Sources: episodes.routes.ts:376-397 and episode-trailer-video.service.ts:45-81. Derive paths server-side, stage first, promote after complete validation, and retain/restore the prior final during replacement. Browser progress is not final success; the terminal API response is.

### Component-local observable state

Sources: manage.component.ts:185-224,1188-1221,1838-1930. Keep state in ManageComponent, use Angular HttpClient events plus finalize, surface error.error.message with a fallback, and tear down active subscriptions. Add generation protection because generic UploadState has no race protection.

### Thin frontend boundary

Frontend handles selection, progress, retry state, and editor patching. Backend owns MIME/extension/size validation, draft ownership, staging retention, promotion, rollback, persistence, and cleanup.

## No Analog Found

| Surface | Why no close analog |
|---|---|
| Sibling API draft-aware trailer-video route/tests | Current route only supports persisted replacement; Plans add the explicit draft reservation/staged-response contract and verifier. |
| Cancellable/retryable frontend state | Existing UploadState tracks only busy/deleting/drag/progress, not File or subscription. |
| Frontend trailerVideoFileName typing | Existing Episode types expose MP3 trailer fields but not final MP4 video fields. |

## Implementation Constraints and Pattern Risks

1. The add form must obtain and retain the opaque reservation before the first trailer upload; the upload remains immediate after reservation, not deferred to Save.
2. A new draft has no persisted Episode response; staged/promoting/finalized response vocabulary prevents premature finalized UI claims.
3. Current replacement cleanup deletes staging in finally; draft staging remains retryable until create, reset, expiry, or terminal cleanup, while the browser File is retained independently.
4. Browser unsubscribe is not proof the server received no bytes; partial files must never replace final media and are swept by request cleanup/24-hour expiry.
5. Generation/token protection is required to prevent late replacement A responses overwriting B.
6. Adding trailerVideoFileName may require API schema/repository changes; do not conflate it with MP3 trailerFileName.
7. Preserve the Angular XHR-based HttpClient setup; a transport switch that loses upload progress violates TRAILER-02.

## Metadata

**Analog search scope:** src/app/core, src/app/pages/manage, phase 07 artifacts, and sibling API routes/services/README.  
**Files scanned:** 9 primary implementation/test surfaces plus project docs and phase research.  
**Pattern extraction date:** 2026-08-03
