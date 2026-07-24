---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# External Integrations

**Analysis Date:** 2026-07-24

## APIs & External Services

**Backend API:**
- Dragao Careca admin API - Primary application dependency for auth, episodes, feed, metrics, health, and media lifecycle.
  - Integration method: Angular `HttpClient` plus a direct `fetch()` in `AppComponent`.
  - Auth: Bearer JWT from `AuthService` / `AuthInterceptor`; bypass mode short-circuits auth when `environment.authBypass` is true.
  - Endpoints used:
    - `POST /v1/auth/google`
    - `GET /v1/auth/me`
    - `GET /v1/episodes`
    - `POST /v1/episodes`
    - `PUT /v1/episodes/:episodeId`
    - `DELETE /v1/episodes/:episodeId`
    - `GET /v1/episodes/references`
    - `GET /v1/feed/status`
    - `GET /v1/feed`
    - `GET /v1/feed/preview`
    - `GET /v1/episodes/:episodeId/transcription`
    - `POST /v1/episodes/:episodeId/audio`
    - `POST /v1/episodes/:episodeId/trailer`
    - `POST /v1/episodes/:episodeId/cover`
    - `POST /v1/episodes/:episodeId/cover-webp`
    - `DELETE /v1/episodes/:episodeId/audio`
    - `DELETE /v1/episodes/:episodeId/trailer`
    - `DELETE /v1/episodes/:episodeId/cover`
    - `DELETE /v1/episodes/:episodeId/cover-webp`
    - `GET /v1/metrics/spotify`
    - `GET /v1/metrics/youtube`
    - `GET /health`
    - `GET /v1/assets/cover-mosaic.json`

**Google Identity Services:**
- Google Sign-In - Used for browser-side login on `src/app/pages/login/login.component.ts`.
  - SDK/Client: `window.google.accounts.id` loaded externally.
  - Credentials: `environment.googleClientId`.
  - Auth flow: GIS ID token is exchanged for backend access token.

## Data Storage

**File Storage:**
- Backend-managed episode media and cover assets.
  - Frontend only stages and deletes media through API calls; no direct object store client exists here.

## Authentication & Identity

**Auth Provider:**
- Backend JWT auth - Frontend stores access token in `localStorage` via `AuthService`.
  - Token storage: `localStorage` key `dc_admin_access_token`.
  - Session management: `GET /v1/auth/me` fetches the active user; `logout()` only clears local client state.

**OAuth Integrations:**
- Google OAuth / GIS - Sign-in path for administrators.
  - Credentials: `googleClientId` in environment files.
  - Scope details are backend-owned; the frontend only passes the ID token through.

## Monitoring & Observability

**Logs:**
- No dedicated external logging service in the frontend.
- Runtime diagnostics are surfaced through the backend health endpoint and on-page status views.

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in this repo.
- The frontend is built with Angular CLI and expected to be deployed as a static bundle.

**CI Pipeline:**
- No CI workflow file present in the inspected tree.

## Environment Configuration

**Development:**
- `src/environments/environment.ts`
  - `apiBaseUrl: http://localhost:3000/v1`
  - `authBypass: true`
  - `googleClientId: ...`

**Production:**
- `src/environments/environment.prod.ts`
  - `apiBaseUrl: https://api.dragaocareca.com/v1`
  - `authBypass: false`
  - `googleClientId: ...`

## Webhooks & Callbacks

**Incoming:**
- None in the frontend repository.

**Outgoing:**
- None directly; all server-side webhook handling stays in the backend API.

---

*Integration audit: 2026-07-24*
*Update when adding/removing external services*
