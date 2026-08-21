# Phase 8: YouTube Job Lifecycle - Research

**Researched:** 2026-08-11
**Domain:** Angular episode workflow plus durable Node/SQLite YouTube private-upload job
**Confidence:** HIGH for current repository behavior; MEDIUM for final cross-repository contract decisions

## User Constraints (from CONTEXT.md)

### Locked Decisions

### Job trigger and operator status
- **D-01:** Start the job through an explicit “Upload to YouTube” action associated with the finalized trailer in the existing episode workflow.
- **D-02:** Expose clear lifecycle states: `queued`, `uploading`, `processing`, `private-ready`, `failed`, and `canceled`.
- **D-03:** Show transfer percentage only for the upload stage. Processing must use honest indeterminate/progress messaging when YouTube does not provide a reliable percentage; never imply public publication.

### Retry and cancellation
- **D-04:** Retry is available for recoverable failures and must reuse/reconcile accepted provider work where possible instead of creating a duplicate video.
- **D-05:** Cancellation stops local polling/request work, but the UI must state that provider work already accepted may continue.
- **D-06:** If cancellation leaves a private provider video, expose a reconciliation-required state/link rather than claiming the provider operation was fully undone.

### Restart, duplicate safety, and identity
- **D-07:** Persist jobs in the API and restore their status after browser reload or API restart through authenticated polling.
- **D-08:** Enforce one active job per episode and finalized trailer source identity. Repeated starts return or reuse the existing active job, or fail with an actionable conflict; they must not create duplicate active jobs or provider videos.
- **D-09:** Bind job updates to the episode and trailer source fingerprint/version so an older job cannot update a newer local trailer.

### Failure messaging and security
- **D-10:** Present stable operator-facing categories for authentication, quota, timeout, network/provider failure, invalid trailer, and reconciliation-required states.
- **D-11:** Keep provider credentials, OAuth tokens, raw Google payloads, filesystem paths, internal stack traces, and sensitive provider identifiers out of browser-visible job DTOs and logs.
- **D-12:** Every failure state must communicate whether retry is available and, when relevant, the next retry time or reconciliation action.

### the agent's Discretion
- Exact endpoint names/DTO field names where the existing sibling API contract already provides a safe equivalent.
- Exact polling interval, worker scheduling details, persistence schema mechanics, and provider SDK implementation.
- Exact Bootstrap card layout, copy, icons, and indeterminate-processing presentation within the existing sectioned admin UI.

### Deferred Ideas (OUT OF SCOPE)
- Public publishing, editable title assembly, 100-Unicode-character validation, hashtag lookup/count, and YouTube link persistence after publishing — Phase 9.
- Full end-to-end placement of every YouTube control in the final operator workflow and compatibility release integration — Phase 10.
- Adding finalized `trailer-video` to the Episodes artifact modal and ZIP flow — Phase 11.
- Scheduled publication, playlists, thumbnails, captions, analytics, batch operations, and automatic replacement/deletion of already-public videos — future scope.

## Temporal Contract Status

### Verified current source behavior (before Phase 8)

The inspected source currently exposes authenticated/no-store start, status, and cancel routes. Start accepts an empty body; there is no current-job lookup route, no public retry route, and no `privateWatchUrl` in the browser DTO. The existing API publish route is present and is an API-owned surface. These statements describe the repository at research time, not the desired Phase 8 result. [VERIFIED: sibling `episodes.routes.ts`, `openapi.ts`, `api.service.ts`]

### Planned Phase 8 changes

Phase 8 changes start to accept and persist `{title, summary}`, adds authenticated current-job lookup and same-job retry endpoints, and allows the public DTO to expose only a validated sanitized `privateWatchUrl` when known. It retains and verifies API publish idempotency for OPS-03, while Angular publish controls remain deferred to Phase 9/10. Provider IDs, sessions, credentials, source paths, and raw errors remain private. [PLANNED: CONTEXT.md, PATTERNS.md, plans 08-00 through 08-04]

## Summary

The sibling API contains the durable building blocks for Phase 8: the current authenticated start/status/cancel routes, SQLite-backed job row, resumable private upload provider, restart-aware worker, source SHA-256 identity, compare-and-swap revisions and leases, sanitized DTO mapping, OpenAPI documentation, and an offline lifecycle verifier. The current source does not yet contain the planned metadata-bearing start, current lookup, retry route, or `privateWatchUrl` addition. [VERIFIED: /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts, src/services/youtube-trailer-job.service.ts, src/database/repositories/youtube-trailer-job.repository.ts, src/workers/youtube-trailer-job.worker.ts, src/docs/openapi.ts, src/scripts/verify-youtube-trailer-job-lifecycle.ts]

The web application is still at the Phase 7 boundary. `ApiService` has local trailer-video draft/upload methods and artifact polling, but no YouTube job DTOs or methods. `ManageComponent` has editor-local state, interval polling, generation/stale guards, and teardown patterns that can be reused, but no YouTube job state or template surface. Planning therefore needs coordinated frontend contract integration and targeted backend verification/extension, not a new provider architecture. [VERIFIED: codebase grep of `src/app/core/api.service.ts`, `src/app/pages/manage/manage.component.ts`, `src/app/pages/manage/manage.component.html`]

**Primary recommendation:** Preserve the sibling API route/DTO/state machine as the canonical backend contract, add a typed thin Angular wrapper and editor-local YouTube polling state, and implement the now-resolved Phase 8 contract: `{title, summary}` start input, current lookup, same-job retry, sanitized `privateWatchUrl`, retained API publish idempotency, and no Angular publish controls.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| YOUTUBE-01 | Start a server-owned job for the current finalized trailer using selected title and summary | Start route exists and fingerprints the canonical final MP4; the plan extends its body to accept and persist basic title/summary job input. |
| YOUTUBE-02 | Upload as non-public and return safe watch link/video identifier | Current source stores provider identity internally and exposes no watch link; planned Phase 8 exposes only sanitized `privateWatchUrl` when known and never the provider ID. |
| YOUTUBE-03 | Distinct transfer, processing, and private-ready feedback | Backend exposes `transferring`, `processing`, `ready` plus byte and processing fields; frontend must map these to the locked operator labels without implying publication. |
| YOUTUBE-04 | Retry recoverable failures without duplicates | Repository keeps the same job/session/provider ID, reconciles provider range, and boundedly requeues retryable errors; frontend needs a retry action/status interpretation. |
| YOUTUBE-05 | Honest cancellation and retained-private-video handling | `cancel_requested` → `cancelled` records `local-cancelled` or `provider-video-retained`; frontend must explain reconciliation-required work. |
| OPS-01 | API-owned authenticated credentials and sanitized payloads/logs | `requireAuth`, no-store middleware, internal-only provider contract, and DTO/OpenAPI omission tests exist; verify logs remain sanitized in implementation changes. |
| OPS-02 | Persist identity/state/progress/provider/failure data for recovery and stale protection | SQLite row stores source hash/bytes, state, session, provider ID, leases, revisions, progress, retries, errors, and cancellation timestamps; CAS guards updates. |
| OPS-03 | Idempotent/safe duplicate starts, retries, publish requests, replacements | Phase 8 retains and verifies API publish idempotency alongside active-source uniqueness, same-row retry, source obsolescence, and frontend generation guards. Angular publish controls remain deferred to Phase 9/10. |
| OPS-04 | Stable bounded OAuth/quota/provider/timeout failure states | Provider normalizes failures into configuration/authorization/retryable/unrecoverable/session-expired; route DTO exposes category only. Quota mapping and exact operator copy need verification. |

## Project Constraints (from AGENTS.md)

- Read `docs/README.md`, then `docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md`; these are the UI architecture and backend-contract source of truth. [VERIFIED: AGENTS.md]
- Keep business logic in the backend; the frontend orchestrates API calls. [VERIFIED: AGENTS.md]
- Preserve the sectioned, legacy-inspired functional layout. [VERIFIED: AGENTS.md]
- Respect the environment-driven `authBypass` toggle. [VERIFIED: AGENTS.md]
- Verify the frontend with `npm run build` before finalizing. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Start/reuse job and validate finalized source | API / Backend | Database / Storage | The API derives the canonical source and owns authorization, identity, and duplicate policy. [VERIFIED: sibling service/route] |
| Resumable upload and YouTube processing polling | API / Backend | External YouTube provider | Credentials, resumable session, chunk transfer, and provider reconciliation must never run in Angular. [VERIFIED: provider/service] |
| Durable job state, leases, retries, and restart recovery | Database / Storage | API / Backend | SQLite persists state; worker claims rows and uses revision/lease CAS. [VERIFIED: repository/sqlite/worker] |
| Authenticated status/cancel transport | API / Backend | Browser / Client | Bearer auth is attached by the interceptor; routes return sanitized snapshots. [VERIFIED: docs/ARCHITECTURE.md and routes] |
| Operator action, staged state labels, polling, and cancellation copy | Browser / Client | API / Backend | Angular owns presentation and request orchestration; API remains authoritative for state. [VERIFIED: docs and ManageComponent patterns] |

## Standard Stack

### Core

| Library/technology | Version | Purpose | Why Standard |
|--------------------|---------|---------|--------------|
| Angular | 15 (repo toolchain) | Manage workflow UI | Existing application framework and sectioned page architecture. [VERIFIED: package.json/.planning/codebase/STACK.md] |
| Angular `HttpClient` | Angular 15 | Typed authenticated start/status/cancel calls | Existing `ApiService` boundary and auth interceptor. [VERIFIED: api.service.ts/docs] |
| RxJS | package-locked repo version | HTTP observables, unsubscribe/teardown, polling orchestration | Existing component convention. [VERIFIED: package.json/manage.component.ts] |
| Node.js + TypeScript | API package-locked versions | Route/service/worker implementation | Existing sibling API runtime. [VERIFIED: sibling package.json and source] |
| SQLite | `better-sqlite3`/repository runtime as installed | Durable job state and unique indexes | Existing API persistence model. [VERIFIED: sibling sqlite.ts/repository] |

### Supporting

| Library/technology | Purpose | When to Use |
|--------------------|---------|-------------|
| Google OAuth2 client and YouTube Data API resumable upload protocol | Private provider session, range reconciliation, processing status | Backend provider adapter only; never import into frontend. [VERIFIED: youtube-trailer-upload.provider.ts] |
| Karma + Jasmine | Angular unit checks | Add focused `ApiService` and ManageComponent state/polling tests using HTTP/TestBed doubles. [VERIFIED: .planning/codebase/TESTING.md] |
| Existing lifecycle verifier with fake provider | Backend offline lifecycle regression | Extend/retain for persistence, restart, duplicate, cancellation, source replacement, sanitization, and route/OpenAPI checks. [VERIFIED: sibling verifier/package.json] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing sibling route/DTO | Invent a new frontend-specific endpoint | Rejected: duplicates the API contract and violates backend-owned business logic. [VERIFIED: project constraints] |
| Component-local polling | Global Angular store | Rejected for this phase: existing ManageComponent uses local editor state and no NgRx/store; a store would expand scope without a locked need. [VERIFIED: codebase map; recommendation] |
| Provider-side progress as upload percentage | Treat processing parts/time-left as percent | Rejected: processing progress is provider-dependent and must remain indeterminate unless both totals are valid. [VERIFIED: D-03 and DTO fields] |

No new frontend package is required by the inspected implementation. Package legitimacy audit is therefore not applicable unless planning introduces a new dependency.

## Current Source Contract and Planned Phase 8 Contract

The table below intentionally separates what is verified in the source now from what the Phase 8 plans will add.

All three routes are under `/v1/episodes/:episodeId`, protected by `requireAuth`, and set `Cache-Control: no-store` before auth handling. [VERIFIED: `episodes.routes.ts`]

| Operation | Current contract | Success/status behavior |
|-----------|------------------|-------------------------|
| Start | **Current:** `POST /v1/episodes/:episodeId/youtube-trailer-jobs` with an empty body. **Planned:** same route accepts validated `{title, summary}`, rejects source/provider/credential fields, persists metadata, and passes it to the provider. | **Current:** existing status behavior. **Planned:** `202` newly queued, `200` reused active job, `Location` status URL, `404` missing finalized trailer, `400` invalid ID/body, `401` unauthenticated. |
| Current lookup | **Current:** no route. **Planned:** authenticated `GET /v1/episodes/:episodeId/youtube-trailer-jobs/current` for reload recovery. | **Planned:** safe current-source snapshot or no-job result. |
| Retry | **Current:** no public retry route; worker retry is internal. **Planned:** authenticated `POST /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId/retry` for same-row retry. | **Planned:** preserves provider/session evidence and returns the durable snapshot. |
| Status | `GET /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId`; job ID is UUID and episode is part of lookup. | `200` sanitized snapshot; `400` invalid episode ID; `404` for invalid/unknown/mismatched job. [VERIFIED: route/OpenAPI/verifier] |
| Cancel | `POST /v1/episodes/:episodeId/youtube-trailer-jobs/:jobId/cancel`; optional body must be empty. | `202` records `cancel_requested`; poll for terminal boundary; `400/401/404` as above. [VERIFIED: route/OpenAPI/verifier] |

Current public snapshot fields omit `privateWatchUrl`; the planned Phase 8 allowlist is `jobId`, `episodeId`, `status`, nullable sanitized `privateWatchUrl` once provider video evidence exists, `progress.confirmedBytes`, `progress.totalBytes`, nullable processing parts/time-left, `cancellation.requestedAt/cancelledAt/boundary`, `error.category/occurredAt`, `retry.count/nextAttemptAt`, timestamps, and `completedAt`. Accepted title/summary remain persisted job input but are not echoed unless a separate safe field is required. [VERIFIED current omission; PLANNED Phase 8 addition]

The current backend status vocabulary is `queued`, `claimed`, `transferring`, `processing`, `ready`, `failed`, `cancel_requested`, `cancelled`, and `obsolete`. The locked UI vocabulary is `queued`, `uploading`, `processing`, `private-ready`, `failed`, and `canceled`. Plan an explicit presentation mapping (`transferring`/`claimed` → uploading, `ready` → private-ready, `cancelled` → canceled), and decide how to display transient `claimed`, `cancel_requested`, and terminal `obsolete`; do not silently change the backend enum without a compatibility reason. [VERIFIED: repository/OpenAPI plus CONTEXT D-02]

The previously identified contract tensions are resolved:

1. YOUTUBE-01 is literal: Phase 8 start accepts title and summary, stores them as job input, and uses them for the private provider upload. Phase 9 owns richer authoring/validation, not the basic payload.
2. YOUTUBE-02 is literal: once the provider video exists, the public DTO returns a validated sanitized `privateWatchUrl`; it never returns raw providerVideoId, session URI, credentials, paths, or raw payloads. Broader link persistence/publication UI remains Phase 9/10.
3. OPS-03 includes publish idempotency: retain the existing API-owned publish route and verify repeated publish requests converge. Phase 8 adds no Angular publish controls; it does not claim the API publish route is absent.

## Architecture Patterns

### System Architecture Diagram

```text
Operator clicks Upload to YouTube
        |
        v
        Angular ApiService -- authenticated POST --> API route (no-store, title/summary body)
        |                                      |
        |                              fingerprint finalized trailer
        |                                      |
        |                              SQLite create-or-reuse active row
        |                                      |
        |                              background worker + lease/CAS
        |                                      v
        |                         readiness -> private resumable session
        |                                      |
        |                         range reconcile -> chunk upload
        |                                      |
        |                         provider video accepted/private
        |                                      v
        |                            processing poll -> ready/private
        |
Angular GET status <---------------- sanitized DTO only
        |
        +--> transfer bytes / indeterminate processing / private-ready
        +--> retryable failure -> same job reconciliation/retry
        +--> cancel -> local-cancelled OR provider-video-retained/reconcile
        +--> reload/API restart -> same persisted job/status URL
```

### Persistence and identity pattern

The source identity is `(episodeId, sourceFileName, sourceSha256, sourceBytes)` captured from the canonical `episodes/{episodeId}/trailer.mp4`. A partial unique index allows one active row for that exact source; creating a job first obsoletes active jobs for older source identities. [VERIFIED: sibling service/sqlite/repository]

The row also persists resumable `sessionUri`, confirmed bytes, provider video ID/privacy/upload/processing metadata, retry count/next attempt, normalized failure fields, cancellation timestamps/boundary, worker lease/heartbeat, revision, and terminal timestamps. Provider ID/session are internal persistence, not browser DTO fields. [VERIFIED: sqlite.ts/repository/service/OpenAPI]

Worker updates require matching job, episode, source identity, revision, lease ID, and allowed status. Replacement of the local final trailer marks the old job obsolete; late worker writes then fail CAS and cannot mutate the new source. [VERIFIED: repository, `episode-trailer-video.service.ts`, lifecycle verifier]

### Restart and idempotency pattern

On worker startup, interrupted `claimed`, `transferring`, `processing`, and `cancel_requested` rows are recovered; the same persisted session is queried for its accepted byte range before any continuation. If a provider video ID exists, the worker polls that video rather than opening a second upload. A process-level active-run guard prevents overlapping worker loops. [VERIFIED: worker/service/verifier]

Retry is currently worker-driven: normalized retryable or session-expired errors receive exponential bounded `nextAttemptAt`, and the same failed row is requeued with incremented retry count. There is no separate public retry route in the inspected source; Phase 8 plans the explicit authenticated same-job retry endpoint so the UI does not create a new row or provider video. [VERIFIED current route gap; PLANNED Phase 8 addition]

### Provider and private processing pattern

The provider checks OAuth configuration/token readiness and upload scope before creating a resumable session. The session requests private privacy; chunks are uploaded server-to-provider; the provider’s range response is authoritative on recovery; processing is polled separately; readiness requires private privacy, processed upload, and succeeded processing. [VERIFIED: provider/service]

Processing fields may be null. The frontend must show “processing”/indeterminate messaging unless valid provider parts totals are available, and must never convert `ready` into “published.” [VERIFIED: DTO/D-03]

### Cancellation boundary pattern

Cancellation is a durable local request. Before provider acceptance, the worker can mark `local-cancelled`. Once a session/provider video or confirmed bytes indicate remote acceptance, cancellation records `provider-video-retained` / reconciliation-required; it does not claim YouTube deletion. Phase 8 returns status, sanitized privateWatchUrl when known, and operator guidance only. It provides no automatic deletion or public publication. [RESOLVED: D-05/D-06]

### Frontend integration pattern

Add typed wrappers in `ApiService` beside artifact methods. In `ManageComponent`, attach job state to the episode editor or an episode-keyed map, not to the local MP4 upload progress object. Start only when `trailerVideoFileName` is finalized; retain `jobId` and latest snapshot; poll the status URL at a bounded interval; stop on terminal state, reset, replacement, component destroy, or explicit cancellation. Guard every response by episode ID, job ID, and source generation/fingerprint so late responses cannot overwrite a newer trailer. This mirrors existing artifact polling and trailer-video generation guards. [VERIFIED: `manage.component.ts` and codebase architecture; recommendation]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resumable upload | Browser upload loop, direct Google API calls, or custom OAuth | Existing API provider adapter and worker | Credentials, session URIs, range semantics, retries, and provider errors are security/reliability boundaries. [VERIFIED: project constraints/provider] |
| Job deduplication | Client click debounce as the source of truth | Repository active-source unique index plus create-or-reuse | Browser debounce cannot protect reloads, concurrent tabs, API restarts, or workers. [VERIFIED: sqlite/repository] |
| Stale protection | Compare only episode ID or job ID | Source hash/bytes plus revision/lease CAS | Same episode can receive a replacement trailer while an old provider operation is still running. [VERIFIED: service/repository/verifier] |
| Provider error display | Render raw Google error/message/reason | Normalized category + retry timestamp + safe operator copy | Raw errors can expose provider details and are unstable. [VERIFIED: DTO/OpenAPI/provider] |
| Processing percentage | Infer a percentage from elapsed time or upload bytes | Indeterminate UI, optionally using valid provider parts fields | Upload completion and provider processing are separate stages. [VERIFIED: D-03/DTO] |

## Common Pitfalls

### Pitfall 1: Treating backend `ready` as public
**What goes wrong:** UI says “published” or exposes a public link when the provider video remains private. [VERIFIED: context/route/OpenAPI]
**How to avoid:** map `ready` to `private-ready`; separate publication entirely; keep link exposure decision explicit. [VERIFIED: D-02/deferred Phase 9]
**Warning signs:** “Upload complete” copy with no privacy qualifier, a public publish button, or a `youtubeUrl` update during Phase 8.

### Pitfall 2: Reopening a session after provider acceptance
**What goes wrong:** retry creates a second provider video. [VERIFIED: lifecycle verifier’s provider-video reconciliation scenario]
**How to avoid:** persist session and provider ID before/at acceptance; query range/video first; reuse the same job row. [VERIFIED: service/repository]
**Warning signs:** retry calls `beginPrivateSession` when `sessionUri` or `providerVideoId` exists.

### Pitfall 3: Letting an old worker update a replacement
**What goes wrong:** old upload progress or terminal status appears on a newer trailer. [VERIFIED: source-obsolescence verifier]
**How to avoid:** hash the canonical final source and require source identity + revision + lease in each update; clear/pause frontend polling on replacement. [VERIFIED: repository/manage patterns]

### Pitfall 4: Claiming cancellation undid provider work
**What goes wrong:** operator believes YouTube work/video was deleted when only local polling stopped. [VERIFIED: D-05/D-06 and provider contract]
**How to avoid:** display `provider-video-retained` as reconciliation-required and retain a safe status/action path. [VERIFIED: OpenAPI/service]

### Pitfall 5: Exposing sensitive fields through DTO, logs, or OpenAPI drift
**What goes wrong:** session URI, provider ID, raw reason, source hash/path, or credentials reach browser/logs. [VERIFIED: security contract and verifier assertions]
**How to avoid:** map explicitly from row to DTO; add regression assertions for omitted fields and sanitized log payloads. [VERIFIED: service/OpenAPI/verifier]

### Pitfall 6: Polling without reload/restart recovery or teardown
**What goes wrong:** reload loses the job, intervals leak, or late responses mutate a different editor. [VERIFIED: frontend codebase patterns and Phase success criteria]
**How to avoid:** persist job ID/current snapshot in API-backed episode state or reload lookup, start polling from returned status URL, guard by generation, and clear on all teardown/reset paths.

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | SQLite `youtube_trailer_jobs` stores job/source/provider/retry/cancel state; `episodes` stores canonical final trailer filename. [VERIFIED: sibling sqlite/repository] | Preserve additive schema/migration behavior; verify existing rows recover safely. This is a data compatibility task, not a browser-only edit. |
| Live service config | Backend `.env` has YouTube client ID/secret/refresh token and job enablement keys; names are present, values were not printed. [VERIFIED: environment-name probe and sibling config] | Planner must verify OAuth upload scope/channel readiness without copying secrets into logs or artifacts. |
| OS-registered state | No YouTube-specific OS registration was found in the inspected web/API sources. [VERIFIED: requested source audit; negative claim limited to inspected repos] | None identified; confirm deployment process does not add an external supervisor contract. |
| Secrets/env vars | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`, `YOUTUBE_TRAILER_JOB_ENABLED`, timeout/retry/chunk/worker settings. [VERIFIED: sibling config/.env.example] | Keep API-only; document safe defaults and bounded settings; never add frontend copies. |
| Build artifacts/installed packages | API has `dist/` build output implied by verification scripts; frontend has npm lockfile and Angular build output when built. [VERIFIED: package scripts/codebase map] | Rebuild API before lifecycle verifier and run frontend build; do not treat generated artifacts as source changes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Angular/API build and verifier | ✓ | v24.17.0 | — |
| npm | dependency scripts/build | ✓ | 12.0.1 | — |
| Frontend Angular dependencies | `npm run build`, `npm test` | Present by repository/package setup; not reinstalled in research | package-locked | Run existing install if missing in execution environment |
| Sibling API source/build | API lifecycle verification | ✓ source and scripts found | package-locked | None for backend contract verification |
| YouTube OAuth credentials | Live provider transfer | Names/config entries present; usable scope/channel not verified | — | Offline fake-provider verifier; live checkpoint required before production transfer |
| ChromeHeadless/browser | Angular Karma/manual UI validation | Not probed; prior map records browser-runner limitations | — | Type/build checks plus manual browser validation when available |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend framework | Karma 6 + Jasmine 4 through Angular CLI 15. [VERIFIED: .planning/codebase/TESTING.md/package.json] |
| Frontend config | `angular.json`, `tsconfig.spec.json`; meaningful coverage is currently sparse and root spec is stale. [VERIFIED: TESTING.md] |
| Frontend quick run | `npm test -- --watch=false` (may require browser availability; record if blocked). |
| Frontend full/build gate | `npm run build`; mandatory project gate. [VERIFIED: AGENTS.md] |
| Backend lifecycle verifier | `cd ../dragaocareca-admin-api && npm run verify:youtube-trailer-job-lifecycle` |
| Backend type/build prerequisite | `cd ../dragaocareca-admin-api && npm run build` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command/Check | File Exists? |
|--------|----------|-----------|-------------------------|-------------|
| YOUTUBE-01 | Authenticated start accepts title/summary, stores job input, uses canonical finalized source, and reuses active job | API integration/offline verifier; frontend unit | API lifecycle verifier; Angular `HttpTestingController` metadata start contract | Wave 0 RED -> Plans 01/02/03 |
| YOUTUBE-02 | Private provider session and sanitized privateWatchUrl response boundary | API fake-provider + OpenAPI assertions | lifecycle verifier; assert URL allowed and provider/session/raw fields omitted | Wave 0 RED -> Plans 01/02/03 |
| YOUTUBE-03 | Upload bytes separate from processing/private-ready UI | Angular component unit + manual UI | mocked snapshots for `transferring`, `processing`, `ready`; manual check copy/indeterminate state | ❌ Wave 0 |
| YOUTUBE-04 | Retry/range reconciliation avoids duplicate video | API fake-provider integration | lifecycle verifier interruption, persisted session, range resume, provider ID reuse | ✅ |
| YOUTUBE-05 | Cancel before/after provider acceptance is honest | API fake-provider + Angular unit/manual | lifecycle verifier cancellation scenarios; UI assertions for both boundaries | API ✅; frontend ❌ Wave 0 |
| OPS-01 | Auth required, no-store, no sensitive DTO/log fields | API route/security contract | lifecycle verifier protected route, no-store, omitted-field assertions; inspect logs | ✅ for DTO/route; logs need explicit coverage |
| OPS-02 | Persistence/restart/source identity/stale update protection | API repository/worker integration | lifecycle verifier repository, restart recovery, replacement obsolescence, CAS late-update rejection | ✅ |
| OPS-03 | Duplicate starts/retries/publish requests/replacement races safe | API concurrency/idempotency + frontend stale guard | lifecycle verifier active-source and publish idempotency; Angular generation tests | Wave 0 RED -> Plans 01/02/03/04 |
| OPS-04 | OAuth/quota/timeout/network categories are bounded and retryable as intended | API provider normalization + manual live checkpoint | fake normalized failure cases; inspect quota mapping; live OAuth only with configured test channel | Partial; quota/timeout coverage should be added |

### Sampling Rate

- Per frontend task: focused Angular spec, then `npm run build`.
- Per backend task: focused lifecycle verifier or `npm run build` plus verifier.
- Per wave merge: full backend lifecycle verifier and frontend test suite where browser is available.
- Phase gate: `npm run build`, backend lifecycle verifier, and manual authenticated UI checks for start → upload → processing → private-ready, reload, cancellation, retry, replacement, and safe errors.

### Wave 0 Gaps

- [ ] Execute 08-00-PLAN.md RED backend verifier scenarios for metadata/private URL/publish idempotency/cancellation/log safety.
- [ ] Execute 08-00-PLAN.md RED Angular wrapper and Manage lifecycle tests.
- [ ] Extend backend verifier for quota/timeout normalization and the resolved private watch-link/title/summary contract.
- [ ] Replace or isolate the stale root component spec if it blocks `npm test`; this is an existing project gap, not a Phase 8 business behavior.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | `requireAuth` on all job routes; preserve frontend interceptor and `authBypass` only for local mode. [VERIFIED: routes/docs/config] |
| V3 Session Management | yes | Bearer JWT boundary remains centralized; no provider OAuth token/session in browser DTO. [VERIFIED: auth interceptor/provider/DTO] |
| V4 Access Control | yes | Episode/job path binding, authenticated route, opaque UUID lookup, and episode/source CAS. [VERIFIED: route/repository/verifier] |
| V5 Input Validation | yes | Positive episode ID, UUID job ID, strict title/summary schema, server-derived source; never accept client path/provider/credential input. [REVISED: literal YOUTUBE-01] |
| V6 Cryptography | yes | SHA-256 source fingerprint for identity; use Google OAuth/library primitives; never hand-roll OAuth or token handling. [VERIFIED: service/provider] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized status/cancel or cross-episode job access | Elevation/Tampering | `requireAuth`, episode + job lookup, sanitized 404 behavior. [VERIFIED: route/verifier] |
| Duplicate provider video after retry/restart | Tampering/Denial | Persist session/provider ID, range reconciliation, active-source uniqueness, worker lease/CAS. [VERIFIED: repository/service/verifier] |
| Sensitive provider/session data leakage | Information disclosure | Explicit DTO allowlist, OpenAPI omission assertions, safe normalized categories, no raw provider logs. [VERIFIED: service/OpenAPI/verifier; log coverage remains to add] |
| Stale worker/browser response after trailer replacement | Tampering | SHA-256 source identity, obsolete transition, revision/lease CAS, frontend generation/job guards. [VERIFIED: service/repository/manage/verifier] |
| Unbounded provider retries or quota burn | Denial of service | Bounded exponential retry, `nextAttemptAt`, provider timeout and worker interval config; add quota-specific assertions. [VERIFIED: config/service; quota gap noted] |

## Code Examples

### Safe frontend API wrapper shape

```typescript
startYoutubeTrailerJob(episodeId: number, title: string, summary: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.post<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs`,
    { title, summary },
  );
}

getYoutubeTrailerJobStatus(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.get<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}`,
  );
}

cancelYoutubeTrailerJob(episodeId: number, jobId: string): Observable<YoutubeTrailerJobSnapshot> {
  return this.http.post<YoutubeTrailerJobSnapshot>(
    `${environment.apiBaseUrl}/episodes/${episodeId}/youtube-trailer-jobs/${jobId}/cancel`,
    {},
  );
}
```

This mirrors the existing artifact wrapper style and the route’s strict metadata schema. Retry/cancel retain empty control bodies where their route contracts require them. [REVISED: sibling route/OpenAPI; example is planning guidance]

### Safe backend DTO boundary

```typescript
export const toYoutubeTrailerJobStatusDto = (job: YoutubeTrailerJobRow) => ({
  jobId: job.jobId,
  episodeId: job.episodeId,
  status: job.status,
  privateWatchUrl: job.providerVideoId ? `https://www.youtube.com/watch?v=${job.providerVideoId}` : null,
  progress: {
    confirmedBytes: job.confirmedBytes,
    totalBytes: job.sourceBytes,
    processingPartsProcessed: job.providerProcessingPartsProcessed,
    processingPartsTotal: job.providerProcessingPartsTotal,
    processingTimeLeftMs: job.providerProcessingTimeLeftMs,
  },
  cancellation: { requestedAt: job.cancelRequestedAt, cancelledAt: job.cancelledAt, boundary: job.cancellationBoundary },
  error: { category: job.errorCategory, occurredAt: job.errorAt },
  retry: { count: job.retryCount, nextAttemptAt: job.nextAttemptAt },
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
  completedAt: job.completedAt,
});
```

The existing service uses this allowlist pattern; retain it if changing fields. [VERIFIED: sibling service]

## State of the Art

| Old/unsafe approach | Current approach | Impact |
|---------------------|------------------|--------|
| Browser-to-YouTube OAuth/upload | API-owned OAuth and resumable provider adapter | Credentials and provider policy stay server-side. [VERIFIED: project context/provider] |
| Volatile in-memory progress | SQLite job + worker recovery | Reload/API restart does not lose lifecycle state. [VERIFIED: repository/worker] |
| Episode ID as identity | Episode + canonical filename + SHA-256 + byte length | Replacement trailers cannot receive old job updates. [VERIFIED: service/repository] |
| Generic progress bar | Upload byte progress plus separate processing/private-ready states | Avoids falsely implying publication. [VERIFIED: D-03/DTO] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 8 accepts basic title/summary start input and returns sanitized privateWatchUrl; richer authoring/link/publication UI remains later. | Exact contract | Provider metadata or URL leakage if allowlists/validation regress. |
| A2 | `ready` is the intended backend equivalent of UI `private-ready`, and `cancelled` of `canceled`. | Architecture patterns | UI may need a revised backend enum or additional state. |
| A3 | An explicit same-job retry endpoint is used for exhausted recoverable failures; it preserves provider/session evidence. | Idempotency | A retry path could create duplicate provider videos if it creates a new row. |
| A4 | No external supervisor/OS registration needs a YouTube-specific migration. | Runtime inventory | Deployment could require service restart/config rollout not visible in these repos. |
| A5 | Offline fake-provider verification is sufficient for automated CI; live OAuth/channel/quota checks remain manual. | Validation | Provider configuration defects could escape until a live checkpoint. |

## Open Questions (RESOLVED)

1. **Do YOUTUBE-01 and YOUTUBE-02 require title/summary and private watch-link data in Phase 8?** Resolved: yes. Start accepts basic title/summary, persists/uses them as job input, and returns sanitized privateWatchUrl once known. Richer authoring/validation and publication UI remain later.
2. **How can an operator manually retry an exhausted failed job?** Resolved: use an explicit authenticated same-job retry route; it preserves the row/session/provider evidence and is idempotent.
3. **What exactly is the reconciliation outcome after provider-video-retained cancellation?** Resolved: Phase 8 provides durable status, sanitized privateWatchUrl when known, and reconciliation guidance only. It does not automatically delete or publish.
4. **Are quota and timeout mappings stable enough for D-10/D-12?** Resolved: normalize quota, timeout, network/provider, authentication, invalid-trailer, session-expired, and reconciliation categories and verify bounded retry/nextAttemptAt with fake-provider fixtures; live OAuth remains a manual environment check.
5. **Does current finalized trailer need a version number beyond hash/bytes?** Resolved: retain filename/hash/bytes plus revision/lease CAS; no extra media revision is added because source replacement and late-write tests already use this identity.
6. **Does OPS-03 require publish idempotency in Phase 8?** Resolved: yes. The existing API publish route is verified/retained and repeated requests must converge in Phase 8; Angular publish controls remain deferred to Phase 9/10.

## Sources

### Primary (HIGH confidence)

- [VERIFIED: `.planning/phases/08-youtube-job-lifecycle/08-CONTEXT.md`] — locked scope, states, cancellation, identity, security, deferred work.
- [VERIFIED: `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`] — requirement mapping, success criteria, prior decisions and concerns.
- [VERIFIED: `AGENTS.md`, `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`] — project constraints and frontend/backend boundary.
- [VERIFIED: `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts`] — exact route methods, validation, status codes, auth, no-store behavior.
- [VERIFIED: sibling `youtube-trailer-job.service.ts`, `youtube-trailer-upload.provider.ts`, `youtube-trailer-job.worker.ts`, repository, `sqlite.ts`] — state machine, provider boundary, persistence, restart, leases, retries, source identity.
- [VERIFIED: sibling `src/docs/openapi.ts`] — public DTO schema and omitted sensitive fields.
- [VERIFIED: sibling `src/scripts/verify-youtube-trailer-job-lifecycle.ts`] — offline lifecycle, duplicate, restart, cancellation, stale source, protected-route, and OpenAPI checks.
- [VERIFIED: frontend `src/app/core/api.service.ts`, `src/app/pages/manage/manage.component.ts/.html`, and `.planning/codebase/*`] — current client gaps and reusable polling/stale-state patterns.

### Secondary (MEDIUM confidence)

- [VERIFIED: sibling `README.md`, `.env.example`, `package.json`] — API setup, environment names, and verification commands.

### Tertiary (LOW confidence)

- None used for implementation claims; no external web research was necessary because the requested current source repositories and canonical project documents were available.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing package/config/source inspection.
- Architecture: HIGH — sibling implementation and frontend maps agree; exact final product contract has open tensions.
- Pitfalls: HIGH — lifecycle verifier directly exercises most failure and race cases; quota/log/manual UI coverage remains incomplete.

**Research date:** 2026-08-11
**Valid until:** 2026-08-18 for provider/config details; 30 days for stable internal architecture.
