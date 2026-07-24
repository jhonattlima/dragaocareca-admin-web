---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# Architecture

**Analysis Date:** 2026-07-24

## Pattern Overview

**Overall:** Angular admin client with a feature-page layout and a thin API orchestration layer.

**Key Characteristics:**
- Route-driven screens protected by a single auth guard.
- Business rules stay on the backend; the frontend stages edits and relays API requests.
- Large, sectioned management UI rather than a minimal single-panel CRUD form.
- Shared styling and layout primitives live in `src/styles.scss` and page-specific SCSS.

## Layers

**Shell / App Frame:**
- Purpose: Render the background mosaic, top-level router outlet, and authenticated page shell.
- Contains: `src/app/app.component.ts`, `src/app/app.component.html`, `src/app/app.component.scss`, `src/app/pages/masthead/*`.
- Depends on: `fetch()` to backend assets, Angular router, auth state.
- Used by: Every route after bootstrap.

**Routing / Auth:**
- Purpose: Gate access to the admin area and redirect to login when unauthenticated.
- Contains: `src/app/app-routing.module.ts`, `src/app/core/auth.guard.ts`, `src/app/core/auth.interceptor.ts`, `src/app/core/auth.service.ts`.
- Depends on: `environment.authBypass`, localStorage, Angular HTTP interceptors.
- Used by: All protected API calls and route transitions.

**Feature Pages:**
- Purpose: Present the admin workflows: episode management, feed inspection, metrics, login, health.
- Contains: `src/app/pages/manage/*`, `src/app/pages/feed/*`, `src/app/pages/metrics/*`, `src/app/pages/health/*`, `src/app/pages/login/*`.
- Depends on: `ApiService`, `AuthService`, browser forms and DOM APIs.
- Used by: Routed views under `/manage`, `/feed`, `/metrics`, `/health`, `/login`.

**API Orchestration:**
- Purpose: Centralize HTTP calls and response typing.
- Contains: `src/app/core/api.service.ts`.
- Depends on: Angular `HttpClient`, environment config.
- Used by: Every feature page that touches backend state.

## Data Flow

**Bootstrap and Navigation:**
1. `src/main.ts` bootstraps `AppModule`.
2. `AppComponent` fetches the cover mosaic manifest and renders the router outlet.
3. `AppRoutingModule` sends anonymous users to `/login` and guarded users to the dashboard shell.

**Auth Flow:**
1. `LoginComponent` either renders Google GIS or auto-redirects when `authBypass` is enabled.
2. `AuthService.loginWithGoogleIdToken()` posts the GIS token to `POST /v1/auth/google`.
3. The backend returns an access token, which is stored in localStorage.
4. `AuthInterceptor` adds `Authorization: Bearer ...` to subsequent API requests.
5. `DashboardComponent` loads the profile with `GET /v1/auth/me` and clears local auth on failure.

**Episode Management Flow:**
1. `ManageComponent` loads episode data from `GET /v1/episodes`.
2. The form is staged locally with edit/add modes, member chips, structured guest/music/reference entries, and upload state.
3. Save/update calls `POST /v1/episodes` or `PUT /v1/episodes/:episodeId`.
4. Upload cards call the media endpoints, then patch local form state with the returned file names/status.
5. Deletions call the matching `DELETE` media or episode endpoint and refresh the list.

**Feed / Metrics / Health Flow:**
1. `FeedComponent` loads preview XML and feed status in parallel.
2. `MetricsComponent` loads Spotify and YouTube snapshots, then derives chart/table state locally.
3. `HealthComponent` loads backend health and surface-level bot/runtime state.

**State Management:**
- Component-local state only; no NgRx/store layer.
- Data derivation is done in component code and not persisted client-side beyond auth token storage.

## Key Abstractions

**Service Boundary:**
- Purpose: Keep network code in a single place.
- Examples: `ApiService`, `AuthService`.
- Pattern: Injectable singleton services.

**Editor State:**
- Purpose: Represent the add/edit episode form as a mutable local object.
- Examples: `EpisodeEditorState`, `EpisodeFormState`, `StructuredEntry`.
- Pattern: Component-owned state with helper methods rather than a formal store.

**Feature Shell:**
- Purpose: Provide the legacy-inspired sectioned admin layout.
- Examples: `DashboardComponent`, `MastheadComponent`, `ManageComponent`.
- Pattern: Routed page plus nested shell components.

## Entry Points

**Application Bootstrap:**
- Location: `src/main.ts`
- Triggers: Browser load.
- Responsibilities: Bootstrap Angular module.

**Route Shell:**
- Location: `src/app/app-routing.module.ts`
- Triggers: Navigation.
- Responsibilities: Route selection, auth gate, child-page layout.

**API Boundary:**
- Location: `src/app/core/api.service.ts`
- Triggers: User actions, page init, polling loops.
- Responsibilities: Issue HTTP requests and encode response shapes.

## Error Handling

**Strategy:** Handle errors at the page/component boundary and surface human-readable messages in the UI.

**Patterns:**
- `subscribe({ error: ... })` in page components.
- `error?.error?.message ?? fallback` used throughout for backend failures.
- Polling loops are cleared when transcription status errors out or the editor changes.

## Cross-Cutting Concerns

**Logging:**
- No frontend logging framework.
- User-visible state is communicated directly in the UI.

**Validation:**
- Basic validation is done in component code before save/upload/delete actions.
- Backend remains the authority for real business validation.

**Authentication:**
- Auth bypass is a first-class runtime toggle.
- JWT attachment is centralized in `AuthInterceptor`.

**UI Direction:**
- Styling intentionally preserves sectioned legacy admin patterns instead of collapsing to a bare scaffold.

---

*Architecture analysis: 2026-07-24*
*Update when major patterns change*
