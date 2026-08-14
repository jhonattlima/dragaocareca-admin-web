# Architecture

**Analysis Date:** 2026-07-24

## Pattern Overview

**Overall:** Angular admin client with routed feature pages and a thin HTTP orchestration layer.

**Key Characteristics:**
- Browser-hosted UI with Angular module/bootstrap entry points.
- Route-protected admin area with a separate login screen.
- Backend-owned business rules; frontend only stages and orchestrates API calls.
- Legacy-inspired, sectioned operator layout rather than a minimal CRUD shell.

## Layers

**Shell / Layout Layer:**
- Purpose: Render the branded shell, mosaic background, and top-level router outlet.
- Contains: `src/app/app.component.ts`, `src/app/app.component.html`, `src/app/app.component.scss`, `src/app/pages/masthead/*`.
- Depends on: Browser `fetch()`, Angular router, auth state.
- Used by: Every routed view.

**Auth / Routing Layer:**
- Purpose: Gate protected screens and manage local login/session behavior.
- Contains: `src/app/app-routing.module.ts`, `src/app/core/auth.guard.ts`, `src/app/core/auth.interceptor.ts`, `src/app/core/auth.service.ts`.
- Depends on: Environment toggle `authBypass`, `localStorage`, Google GIS token exchange.
- Used by: Login flow and all API requests that require a bearer token.

**Feature Page Layer:**
- Purpose: Present the operator workflows.
- Contains: `src/app/pages/manage/*`, `src/app/pages/feed/*`, `src/app/pages/metrics/*`, `src/app/pages/health/*`, `src/app/pages/login/*`.
- Depends on: `ApiService`, `AuthService`, template-driven forms, browser DOM APIs.
- Used by: Users navigating to `/manage`, `/feed`, `/metrics`, `/health`, and `/login`.

**API Orchestration Layer:**
- Purpose: Centralize the backend contract and HTTP plumbing.
- Contains: `src/app/core/api.service.ts`.
- Depends on: Angular `HttpClient`, environment config.
- Used by: All feature pages.

## Data Flow

**Startup and Navigation:**
1. `src/main.ts` bootstraps `AppModule`.
2. `AppComponent` fetches the mosaic manifest and renders the router outlet.
3. `AppRoutingModule` sends anonymous users to `/login` and authenticated users into the admin shell.

**Auth Flow:**
1. `LoginComponent` renders Google GIS or auto-redirects when `authBypass` is enabled.
2. `AuthService.loginWithGoogleIdToken()` exchanges the GIS credential with `POST /v1/auth/google`.
3. The backend returns a JWT access token.
4. The token is stored in `localStorage` and attached by `AuthInterceptor`.
5. `DashboardComponent` loads the profile through `GET /v1/auth/me` and clears local auth on failure.

**Episode Management Flow:**
1. `ManageComponent` loads episodes from `GET /v1/episodes`.
2. Local editor state stages add/edit forms, structured people/link entries, uploads, and pagination.
3. For a new trailer video, `ManageComponent` requests an authenticated `POST /v1/episodes/drafts` reservation immediately before upload, then `ApiService` sends multipart field `file` plus `X-Episode-Draft-Id` to `POST /v1/episodes/:episodeId/trailer-video` with progress events. The reservation creates a hidden draft episode row so durable YouTube jobs can safely reference the positive episode ID.
4. The API validates the authenticated owner, reservation, MP4 MIME/extension/size, and server-derived staging path. It returns `state: "staged"` for a new episode; Angular keeps the selected `File` and prior finalized filename through cancel/failure/retry and only claims finalization after a successful Save/create response.
5. After staging completes, the API queues or reuses a private YouTube job in the upload response, so transfer does not depend on a later browser action. Angular polls the returned snapshot and uses the sanitized watch URL when available. Save/create sends the same `draftId` to `POST /v1/episodes`; the API consumes the reservation, converts the hidden draft row, and promotes staged bytes atomically to `episodes/{episodeId}/trailer.mp4`. Save then requests publication; the API waits for private readiness, updates metadata, and publishes.
6. Other media upload/delete flows call their matching episode endpoints and patch local file-name state from the response. After draft transcription reaches `done`, the manage page polls `GET /v1/episodes/:episodeId/episodes-generated-summary` and fills the summary field when generated text is available.
7. Delete episode uses `DELETE /v1/episodes/:episodeId` and refreshes the list.

### Episode form stability contract

- `ManageComponent` derives the new publication default from the latest valid `pubDate`, adds seven calendar days with `Date.setDate()`, and preserves the local time through the `datetime-local` conversion. With no valid prior episode it uses the current local date/time.
- Only the episode-audio upload invokes the API metadata contract. After a completed response, Angular requires API-confirmed `duration` in `HH:MM:SS` and a nonnegative integer `bytes`; metadata is not calculated from browser file properties. Trailer-audio continues to use its existing filename/message response path.
- The API persists and returns raw confirmed bytes. Angular formats them as decimal MB with fixed two-decimal nonnegative half-up rounding for display, while the raw integer remains in the create/update payload.
- `environment.defaultParticipants` supplies editable defaults. The component filters these names against `memberOptions`, so unknown configuration values never enter `authors` and active edits are not overwritten.
- A complete music credit has a trimmed name and at least one trimmed reference URL. The browser disables/announces Save without replacing the API’s authoritative create/update validation.
- Duration, Bytes, and Spotify ID remain native `readonly` controls and receive the shared light-gray field style; no helper copy is required.

**Operational Views:**
1. `FeedComponent` loads preview XML and feed status in parallel.
2. `MetricsComponent` loads Spotify and YouTube snapshots and derives chart state locally.
3. `HealthComponent` loads backend health and bot/runtime signals.

## Key Abstractions

**Service Boundary:**
- Purpose: Keep network calls and shared response types in one place.
- Examples: `ApiService`, `AuthService`.
- Pattern: Injectable singleton services.

**Editor State:**
- Purpose: Hold mutable add/edit state for the episode screen.
- Examples: `EpisodeEditorState`, `EpisodeFormState`, `StructuredEntry`.
- Pattern: Component-owned mutable state with helper methods.

**Feature Shell:**
- Purpose: Keep the legacy-inspired operator layout coherent.
- Examples: `DashboardComponent`, `MastheadComponent`, `ManageComponent`.
- Pattern: Routed feature page under a shared shell.

## Entry Points

**Application bootstrap:**
- Location: `src/main.ts`
- Triggers: Browser load
- Responsibilities: Bootstrap Angular module

**Route configuration:**
- Location: `src/app/app-routing.module.ts`
- Triggers: Navigation
- Responsibilities: Guarded admin routes and login path

**HTTP boundary:**
- Location: `src/app/core/api.service.ts`
- Triggers: Page load, user action, polling
- Responsibilities: Issue backend requests and encode the API contract

The transcript-to-summary flow remains backend-owned: the frontend only polls the two status endpoints and presents progress, errors, and generated text.

Trailer-video and YouTube responsibilities are split at the HTTP boundary: Angular orchestrates selection, progress, inline private-link presentation inside the trailer card, cancellation, retry, replacement-generation guards, Save-time commit requests, and state labels; the API owns validation, authenticated ownership, draft persistence, private provider upload, metadata/publication, provider-video deletion, cleanup reconciliation, canonical naming, promotion, rollback, and persistence. Provider IDs, sessions, credentials, and raw errors remain server-only.

## Error Handling

**Strategy:** Handle errors at the component boundary and surface readable messages in the UI.

**Patterns:**
- `subscribe({ error: ... })` on HTTP calls.
- Fallback message strings when backend payloads do not include useful text.
- Polling loops are torn down when the form or transcription state no longer matches the active episode.

## Cross-Cutting Concerns

**Authentication:**
- `authBypass` is a first-class environment toggle.
- JWT attachment is centralized in `AuthInterceptor`.

**Validation:**
- Basic input checks happen before network calls.
- Backend remains the authority for business validation and persistence.

**UI Direction:**
- Preserve the sectioned, operator-first layout.
- Avoid collapsing the app into a minimal placeholder UI.

---

*Architecture analysis: 2026-07-24*
