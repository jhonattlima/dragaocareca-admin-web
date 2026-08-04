# Domain Pitfalls

**Domain:** Trailer MP4 upload and YouTube publishing for the Dragao Careca Admin Web/API
**Researched:** 2026-08-03
**Scope:** v1.2 additions only: final MP4 upload/replacement, non-public YouTube upload, explicit public publish, hashtag search estimate, editable title, and artifact-download inclusion.
**Overall confidence:** MEDIUM-HIGH for Google/YouTube API behavior; MEDIUM for application-specific recovery design.

## System Context

The existing Angular 15 client is intentionally thin. The sibling API already owns the canonical final file (`episodes/{episodeId}/trailer.mp4`), uses authenticated asynchronous artifact jobs, persists job state in SQLite, and has a `trailerVideoSyncStatus` field. New YouTube credentials, remote upload state, retries, and publish transitions should remain API-owned. The browser should submit/stage the file, render API state, and never receive a YouTube refresh token or a filesystem path.

## Critical Pitfalls

### 1. Treating browser cancellation as proof that the server received nothing

**What goes wrong:** An operator clicks Cancel, the browser aborts the XHR, and the UI assumes the upload did not arrive. The server may already have received the complete multipart body or may finish processing after the client disconnects. A subsequent Retry or Replace can then race with the first request and overwrite state unpredictably.

**Why it happens:** Browser upload progress/abort is a transport signal, not a distributed transaction. XHR exposes progress and abort events, but `loadend` does not itself establish success or failure; cross-origin upload listeners also require correct CORS/preflight handling. [MDN XHR upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload)

**Consequences:** Orphaned staging files, false failure messages, duplicate uploads, replacement of the wrong version, and an API record pointing at a file that the operator did not intend to promote.

**Prevention:**

- Give every browser upload an opaque upload ID and server-side state (`receiving`, `staged`, `canceled`, `failed`, `promoted`), with the episode ID bound server-side.
- Make cancellation an explicit authenticated API operation that marks the upload canceled and deletes/retains temporary bytes according to a defined cleanup policy; aborting the browser request is only a best-effort early stop.
- Promote only after a complete MP4 passes size/type validation and an atomic replacement step. Keep the existing final file until the new file is fully validated and promoted.
- On reconnect/reopen, query the API rather than infer state from the last local progress event.

**Detection:** A canceled request later appears as completed; more than one active upload exists for an episode; temporary files outnumber terminal upload records; the UI progress resets while the API reports a newer upload ID.

**Phase ownership:** API upload lifecycle and cleanup: **v1.2 API**. XHR progress/abort UX and reconciliation on reload: **v1.2 Web**. Operational orphan cleanup metrics: **v1.2 API**.

### 2. Replacing the final trailer while YouTube still references the old bytes

**What goes wrong:** A local replacement changes `trailer.mp4` but leaves the old YouTube video ID/link and reports it as synced. The operator later publishes a YouTube asset that no longer corresponds to the final local trailer.

**Why it happens:** File replacement and remote publication are separate side effects. The existing API already distinguishes `unpublished`, `manual-sync-required`, and `synced`; bypassing that state loses the intended safety boundary.

**Consequences:** Publicly wrong trailer, stale artifact/download assumptions, and no reliable way to tell whether a YouTube link belongs to the current final file.

**Prevention:**

- On every successful replacement, atomically store a new local media fingerprint/version and transition YouTube state to `manual-sync-required` unless a new upload job is explicitly started.
- Bind a YouTube upload job to episode ID plus the local trailer version/hash. A job must refuse to publish if the bound local version is no longer current.
- Keep the old YouTube video private/unlisted or otherwise unchanged unless a deliberate cleanup policy exists; do not silently delete a public asset.
- Make “Replace” visibly warn that the current YouTube link may become stale and require a fresh private upload before Publish.

**Phase ownership:** Version binding, state machine, and stale-job rejection: **v1.2 API**. Replacement warning and disabled/stale Publish control: **v1.2 Web**.

### 3. Assuming upload completion means YouTube processing completion

**What goes wrong:** `videos.insert` returns a video ID, the API stores the watch URL, and the UI immediately enables public publishing. YouTube may still be processing, or may later report `failed`/`rejected`.

**Why it happens:** YouTube separates upload status from processing status. Its `processingDetails.processingProgress` is owner-only, estimated, and can periodically decrease as YouTube revises `partsTotal`. [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos)

**Consequences:** Publish requests fail or expose a not-yet-playable video; a progress bar reaches 100% while the artifact is not ready; retrying creates duplicate videos.

**Prevention:**

- Model at least `uploading`, `uploaded-processing`, `ready-private`, `publish-requested`, `public`, `failed`, `canceled`, and `stale` separately from the local file state.
- Poll `videos.list(part=status,processingDetails,...)` server-side for the owned video ID. Treat YouTube progress as an estimate and never require monotonic percentage; cap or label it as “processing estimate.”
- Enable Publish only after the API verifies the video is private and processing succeeded (or explicitly document the chosen readiness threshold).
- Persist the returned video ID before polling; use it as the idempotency anchor for retries.

**Phase ownership:** YouTube polling and state transitions: **v1.2 API**. Progress copy and Publish enablement: **v1.2 Web**.

### 4. Designing retries as “insert again”

**What goes wrong:** A timeout occurs after YouTube accepted the upload. Retry calls `videos.insert` again and creates a second private video, possibly followed by publishing the wrong one.

**Why it happens:** A network response can be lost after the remote side commits. YouTube resumable uploads explicitly require status reconciliation; clients must not assume all or none of a failed request’s bytes arrived. [Resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)

**Consequences:** Duplicate private videos, quota waste, operator confusion, and a link field that changes between attempts.

**Prevention:**

- Persist the resumable session `Location`, local trailer version/hash, YouTube video ID when known, attempt count, last confirmed byte range, and terminal error.
- After connection loss or 500/502/503/504, query the session with `Content-Range: bytes */TOTAL`, read `Range`, honor `Retry-After`, and resume from the next byte. Do not resend an overlapping or skipped range.
- If the session has expired, mark the attempt recoverable and start a fresh attempt only after checking whether a video ID was already created; never blindly insert again.
- Use bounded exponential backoff with jitter and a clear manual Retry state. Make the active-job uniqueness key episode + trailer version + operation type.

**Phase ownership:** Resumable protocol, idempotency, backoff, and duplicate detection: **v1.2 API**. Retry button and explanatory error states: **v1.2 Web**.

### 5. Treating the resumable session as indefinitely resumable or cancelable

**What goes wrong:** A stored upload URI is reused days later, or Cancel is presented as if it guarantees remote deletion. Google documents finite session lifetime and resume behavior, but not a universal “cancel remote upload and undo any created video” operation. Chunked transfers also require 256 KB multiples except the final chunk and add request overhead. [Resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)

**Prevention:**

- Store session age/expiry assumptions and treat an expired/invalid session as a new attempt requiring reconciliation.
- Define Cancel at the application boundary: stop local work, mark the job canceled, clean temporary data, and if YouTube already created a private video, retain its ID for safe retry/reconciliation or explicitly delete it only under a deliberate, authenticated cleanup policy.
- Use a server-side worker for YouTube transfer so a tab close does not terminate the job. Browser progress should poll the API job, not proxy a long-lived Google request.
- Choose a conservative chunk size, enforce the 256 KB rule, and test large files through the actual reverse proxy/timeouts.

**Phase ownership:** **v1.2 API**; Web owns only the user-visible meaning of Cancel and stale/reconnect rendering.

### 6. Publishing public by default or conflating private with unlisted

**What goes wrong:** An insert request defaults to public, or the API stores a link and the site treats it as publicly discoverable before operator approval. Conversely, “not public” is implemented as unlisted without the intended access boundary.

**Why it happens:** YouTube supports `private`, `public`, and `unlisted`; `videos.update` controls `status.privacyStatus`. Google’s current documentation also states that uploads from unverified API projects created after 28 July 2020 are restricted to private until the project passes audit. [Video resource](https://developers.google.com/youtube/v3/docs/videos) and [videos.update](https://developers.google.com/youtube/v3/docs/videos/update)

**Consequences:** Accidental publication, misleading link behavior, audit surprises, or a Publish button that cannot succeed in production.

**Prevention:**

- Set `status.privacyStatus=private` explicitly on insert; do not rely on defaults or API-project verification status.
- Treat the returned watch URL as an operator-only reference until the API confirms the stored remote privacy state.
- Implement Publish as a separate authenticated, idempotent `videos.update` operation that changes only the intended status fields and verifies the result.
- Make public transition one-way in the normal workflow, with an explicit “already public”/“publish in progress” state; do not accidentally overwrite other metadata when updating `status`.
- Document the API project audit requirement as a release/deployment gate.

**Phase ownership:** OAuth/project readiness and privacy state machine: **v1.2 API/ops**. Explicit confirmation and disabled-state copy: **v1.2 Web**.

### 7. Exhausting quota through polling and hashtag lookup

**What goes wrong:** The API polls YouTube too frequently, performs repeated hashtag searches on every keystroke, or retries `videos.insert` after uncertain outcomes. The current reference lists `videos.insert` at 100 quota units and `search.list` at 100 calls per day / one quota unit per call; the overview documents default daily allocations and notes quota costs can change. [videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert), [search.list](https://developers.google.com/youtube/v3/docs/search/list), [YouTube API overview](https://developers.google.com/youtube/v3/getting-started)

**Consequences:** Quota exhaustion blocks publication for the day, causes confusing 403 failures, and makes a single operator action affect unrelated metrics/API work.

**Prevention:**

- Centralize quota-aware YouTube calls in the API; never call Google directly from the browser.
- Poll processing with backoff and a maximum duration; stop after terminal status and persist the last known state. Do not poll every UI render or every second indefinitely.
- Debounce hashtag searches, normalize/cache the exact query plus region/type, and require an explicit Search action if necessary. Cache approximate results with a timestamp and label them accordingly.
- Do not spend quota on a blind retry: reconcile resumable session/video ID first. Add per-operation rate limits and structured quota error handling.
- Treat quotas as configuration/operations data rather than hard-coded UI assumptions.

**Phase ownership:** **v1.2 API** for scheduling, caching, quotas, and metrics; **v1.2 Web** for debounce, Search action, and stale-result labels.

### 8. Presenting `totalResults` as an exact public hashtag count

**What goes wrong:** The UI says “exactly N public videos” or uses the value to promise a stable count. `search.list` explicitly says `pageInfo.totalResults` is an approximation, may not represent an exact value, and is capped at 1,000,000. YouTube Help describes hashtag results as videos whose title or description includes the hashtag; this is not a count of all uploads or a stable analytics metric. [search.list](https://developers.google.com/youtube/v3/docs/search/list), [YouTube hashtag help](https://support.google.com/youtube/answer/6390658)

**Prevention:**

- Query `type=video`, pass a normalized hashtag term, and store region/language/query timestamp so the result is reproducible enough to explain.
- Label the field “estimated public results” (or equivalent) and show “unavailable” on quota/API errors; never silently display zero.
- Do not derive a title by assuming the count is exact or current. Do not use it for pagination or durable business logic.
- Sanitize input to one valid hashtag according to the product’s rules; avoid accepting arbitrary URL/query fragments from the browser.

**Phase ownership:** Query contract and validation: **v1.2 API**. Honest label/editable presentation: **v1.2 Web**.

### 9. Truncating the title incorrectly at 100 characters

**What goes wrong:** The browser counts UTF-16 code units, bytes, or visible graphemes differently from the server, truncates a multibyte title incorrectly, or lets `<`/`>` through. YouTube documents a maximum of 100 characters and disallows `<` and `>` in `snippet.title`; `videos.update` requires the complete `snippet` fields relevant to the update and can overwrite mutable metadata included in the part. [Video resource](https://developers.google.com/youtube/v3/docs/videos), [videos.update](https://developers.google.com/youtube/v3/docs/videos/update)

**Prevention:**

- Enforce the limit in both Web and API, but make the API authoritative. Use the same Unicode-aware policy in both places, preserve whole user-perceived characters where possible, and reject/escape forbidden characters rather than silently changing meaning.
- Display remaining capacity and validate the final title immediately before enqueue and before `videos.update`.
- Store the exact title sent to YouTube in the job/audit record. Include the hashtag only if it fits; do not auto-append it after validation.
- For metadata updates, send the complete intended `snippet` fields required by the endpoint and preserve existing description/category/tags as appropriate; avoid a partial update that erases fields.

**Phase ownership:** Canonical validation and YouTube payload: **v1.2 API**. Live counter, editable field, and accessible validation: **v1.2 Web**.

### 10. Leaking OAuth credentials or over-scoping the Google integration

**What goes wrong:** The browser receives a refresh token, the API logs access tokens/session URLs, or credentials are stored unencrypted. Google’s OAuth guidance says server applications handle authorization-code exchange and that refresh tokens may be revoked/expire; its best-practice guidance recommends encrypting refresh tokens at rest and keeping the datastore inaccessible to the public. [Web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)

**Consequences:** Channel takeover, publish capability exposed to any admin/browser compromise, unrecoverable jobs after token revocation, and credential leakage through logs.

**Prevention:**

- Keep client secret, refresh token, access token, and resumable session URI API-side only; redact them from logs, error payloads, database exports, and browser responses.
- Request the minimum scopes needed (`youtube.upload` for insert and the appropriate authenticated YouTube scope for metadata/privacy operations), and ensure channel ownership/authorization is checked.
- Encrypt refresh credentials at rest, rotate/revoke them operationally, and handle `invalid_grant`/revocation as a clear “reauthorization required” terminal job state.
- Ensure artifact downloads remain authenticated and server-selected; a YouTube watch URL is not an authorization to download the local MP4.

**Phase ownership:** **v1.2 API/ops**, with security review before production credentials are enabled. Web only renders redacted error/status data.

### 11. Allowing stale jobs to mutate current episode state

**What goes wrong:** A worker from an earlier trailer version completes after a replacement and writes its YouTube link, sync status, title, or public state onto the new episode version.

**Why it happens:** SQLite job persistence survives restarts, while the episode row is mutable. Job ID alone is not enough to establish that the result still applies.

**Prevention:**

- Include episode ID, local trailer version/hash, requested title, and operation type in every job. Apply completion with a compare-and-swap condition against the current version.
- On startup, recover only jobs with an explicit resumable state; mark interrupted Google sessions for reconciliation rather than automatically replaying inserts.
- Have a stale-job sweeper with bounded retention and cleanup of temporary/session metadata. Keep terminal records long enough for support/audit, but not sensitive tokens.
- On every poll response, the Web must ignore an old job if the API says it is no longer current and refresh episode state.

**Phase ownership:** Persistence/recovery/sweeper/CAS: **v1.2 API**. Reopen/navigation reconciliation: **v1.2 Web**.

### 12. Assuming artifact inclusion is only a selector/UI change

**What goes wrong:** The artifact modal offers “Trailer video,” but the ZIP worker resolves a client-supplied filename, reads the staging file, or snapshots the source before replacement is finalized. Alternatively, the download job includes an old video after a replacement.

**Prevention:**

- Keep `trailer-video` as a canonical selector that resolves only to the server-derived final `episodes/{episodeId}/trailer.mp4`; never accept a path or filename from the client.
- Snapshot source evidence/hash at job preparation, as the existing artifact model does, and expose missing/partial results honestly.
- Require final upload promotion to complete before the selector reports the video available. A failed/canceled upload must never become a downloadable artifact.
- Revalidate authenticated episode ownership, selector validity, file containment, and source hash at preparation/download boundaries.

**Phase ownership:** Selector/resolution/snapshot/security: **v1.2 API**. Checkbox/modal status and partial-result copy: **v1.2 Web**.

## Moderate Pitfalls

### Reverse-proxy and request-size limits

Large MP4 uploads can be rejected or timed out by Nginx/Ingress, Express/multipart configuration, or platform limits before application code sees them. Align API max bytes, proxy body limits, request timeout, disk quota, and client error mapping. Test a file near the configured limit and a mid-transfer disconnect. **Owner: v1.2 API/ops.**

### MIME/type validation based only on the filename

`accept="video/mp4"` is a picker hint, not security validation. Validate authenticated episode ownership, declared MIME, byte size, extension policy, and—where practical—container/codec using server-side inspection before promotion. Store with a server-derived name. **Owner: v1.2 API.**

### Progress that falsely reaches 100%

Browser upload progress measures bytes sent to the API; API job progress measures server work; YouTube processing progress is a separate estimate. Use labeled stages and never map one percentage onto all three. **Owner: Web labels, API state contract.**

### CORS and authenticated polling failures

Upload progress listeners can trigger preflight, and authenticated artifact downloads require exposed headers such as `Content-Disposition`/missing-artifact metadata. Verify production origins, `Authorization`, OPTIONS, exposed headers, and no-store behavior together. **Owner: v1.2 API/ops.**

### Unbounded local-file retention

Retries and replacements can leave old final files, staged files, prepared copies, or failed job artifacts consuming disk. Define retention and cleanup only after terminal state and preserve the active final file until replacement is committed. **Owner: v1.2 API.**

### Publish authorization is broader than episode editing

Any authenticated admin who can edit an episode may not necessarily be intended to publish publicly. Decide whether existing auth is sufficient; if not, add a server-side capability check. Never rely on hiding the Publish button. **Owner: v1.2 API/ops.**

## Phase-Specific Warnings

| Phase topic | Likely pitfall | Mitigation | Owner |
|---|---|---|---|
| Final MP4 upload | Browser cancel mistaken for server cancel; replacement races | Opaque upload IDs, explicit API cancel, atomic promotion, reconciliation polling | API + Web |
| Upload retry | Duplicate YouTube video after lost response | Persist session/video ID, query status, resume by `Range`, bounded backoff | API |
| YouTube processing | 100% upload mistaken for playable video | Poll owner-only processing status; separate processing and ready states | API |
| Private staging | Accidental public or unlisted upload | Explicit `private` insert and verified privacy before showing Publish | API + Web |
| Explicit publish | Metadata overwritten or publish race | Separate idempotent update, complete intended payload, CAS on trailer version | API |
| Hashtag search | Exact count claim or mixed resource types | `type=video`, approximate label, debounce/cache, timestamp/region | API + Web |
| Title editor | Unicode/forbidden-character rejection at publish time | Shared validation, visible counter, API final validation, preserve full metadata | API + Web |
| Artifact download | Client path traversal or stale/staging source | Canonical selector, server resolution, source hash/snapshot, authenticated stream | API |
| Credentials | Refresh token/session URI exposure | API-only encrypted storage, redacted logs, reauth state | API + Ops |
| Restart/reopen | Stale jobs mutate current episode | Trailer version/hash binding, CAS, startup recovery and sweeper | API |

## Recommended Recovery State Model

Keep local file and remote publication state separate. A minimal safe model is:

```text
local:     absent -> receiving -> staged -> promoting -> final -> failed/canceled
youtube:   none -> queued -> uploading -> uploaded-processing -> ready-private
           -> publish-requested -> public
           -> failed/canceled/stale/reauthorization-required
```

Every YouTube transition should carry `episodeId`, `trailerVersion` (or content hash), `jobId`, and—after insert—the remote `videoId`. Public publication is valid only when the bound local version is still final and YouTube reports the expected private video. Artifact selection resolves the current final local version, not a YouTube state.

## Sources

- [YouTube Data API: Resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) — session URI, `308`/`Range`, retries, finite sessions, chunk rules. **MEDIUM-HIGH** (official, current page).
- [YouTube Data API: videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) — upload method and quota impact. **MEDIUM-HIGH** (official, current page).
- [YouTube Data API: video resource](https://developers.google.com/youtube/v3/docs/videos) — title limit, privacy values, private/audit behavior, processing status. **MEDIUM-HIGH** (official, current page).
- [YouTube Data API: videos.update](https://developers.google.com/youtube/v3/docs/videos/update) — privacy/metadata update semantics and required parts. **MEDIUM-HIGH** (official, current page).
- [YouTube Data API: search.list](https://developers.google.com/youtube/v3/docs/search/list) — query/type, quota, approximate `totalResults`. **MEDIUM-HIGH** (official, current page).
- [YouTube Help: Find videos using hashtags](https://support.google.com/youtube/answer/6390658) — hashtag result semantics and over-tagging warning. **MEDIUM** (official help page).
- [YouTube Data API overview](https://developers.google.com/youtube/v3/getting-started) — quota model/default allocation context. **MEDIUM-HIGH** (official, current page).
- [Google OAuth web-server applications](https://developers.google.com/identity/protocols/oauth2/web-server) and [OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices) — server-side tokens, revocation, encrypted refresh-token storage. **MEDIUM-HIGH** (official, current pages).
- [MDN XMLHttpRequest upload](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/upload) — browser progress/abort behavior and CORS preflight implication. **MEDIUM** (browser reference, cross-check for client limitation).
- Local project context: [`PROJECT.md`](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web/.planning/PROJECT.md), [`docs/ARCHITECTURE.md`](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web/docs/ARCHITECTURE.md), [`docs/CONFIGURATION.md`](/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web/docs/CONFIGURATION.md), and sibling API `src/services/episode-trailer-video.service.ts`, `src/database/repositories/artifact-job.repository.ts`, `src/routes/episodes.routes.ts`. **MEDIUM-HIGH** for current repository contracts.

## Gaps to Validate During Planning/Implementation

- Confirm the exact Google OAuth scopes and channel authorization model for this deployment; the official docs establish the server-side pattern, but the project’s existing refresh-token provisioning is not present in the inspected API files.
- Confirm whether the deployed Google API project has completed the YouTube audit needed to lift private-upload restrictions.
- Choose and document the actual API upload transport/limits (single multipart request versus chunked application upload) and reverse-proxy timeout/size settings.
- Decide whether a failed private YouTube upload is automatically deleted, retained for reconciliation, or surfaced for manual cleanup; this is a product/operations decision, not something the resumable protocol guarantees.
- Define the exact Unicode counting policy for the 100-character title contract and test it with emoji, combining marks, and Portuguese diacritics.
