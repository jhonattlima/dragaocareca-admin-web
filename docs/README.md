# Docs Index - Dragao Careca Admin Web

This file remains the compressed compatibility index that older prompts and the repo’s AGENTS instructions can read first.

Canonical docs now follow the GSD-default flat `docs/*.md` layout:

- [docs/ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/CONFIGURATION.md](CONFIGURATION.md)
- [docs/GETTING-STARTED.md](GETTING-STARTED.md)
- [docs/TESTING.md](TESTING.md)

## Project Summary

Angular 15 admin client for Dragao Careca episode/feed operations.

The frontend stays thin:

- backend remains source of truth for `pubDate`, feed generation, persistence, and auth validation
- frontend handles login, route protection, episode editing, media staging, feed preview, metrics, and health visibility

## Current Shell and Feature Map

- `src/app/core/auth.service.ts`
  - Google ID token exchange (`/v1/auth/google`)
  - token storage
  - profile fetch (`/v1/auth/me`)
  - frontend auth bypass handling

- `src/app/core/auth.interceptor.ts`
  - injects `Authorization: Bearer <token>`

- `src/app/core/auth.guard.ts`
  - protects dashboard routes

- `src/app/core/api.service.ts`
  - episode list/create/update/delete
  - episode media uploads and deletes
  - feed status and preview
  - transcription status
  - generated-summary status and text
  - Spotify and YouTube metrics
  - health status

- `src/app/pages/login/*`
  - Google sign-in UI (GIS)
  - manual token fallback

- `src/app/pages/manage/*`
  - sectioned admin layout
  - episode form + table
  - file staging cards for audio, trailer, trailer video, and covers
  - upload progress bars
  - delete controls only when a file is present or staged
  - guest search filter
  - pagination footer separated from rows-per-page control

- `src/app/pages/feed/*`
  - feed status and XML preview

- `src/app/pages/metrics/*`
  - Spotify and YouTube metrics dashboards

- `src/app/pages/health/*`
  - backend health menu with uptime, auth bypass, bot state, and launch queue signals

- `src/app/app.component.*`
  - background mosaic fetched from backend asset manifest

## Routing

- `/login` → login page
- `/` → dashboard shell
- child routes: `/manage`, `/feed`, `/metrics`, `/health`

## Environment and Auth Modes

### Development

- `production: false`
- `apiBaseUrl: http://localhost:3000/v1`
- `authBypass: true`

### Production

- `production: true`
- `apiBaseUrl: https://api.dragaocareca.com/v1`
- `authBypass: false`

### Normal mode

1. Google GIS returns an ID token.
2. The app posts the token to `POST /v1/auth/google`.
3. The backend returns a JWT.
4. The JWT is stored in `localStorage` and sent by the interceptor.

### Local bypass mode

When `authBypass=true`:

- the guard treats the user as authenticated
- the login screen redirects immediately to the dashboard
- `getProfile()` returns a local mock profile

## Backend Contract Assumptions

Expected endpoints include:

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
- `GET /v1/episodes/:episodeId/episodes-generated-summary`
- `POST /v1/episodes/drafts` — authenticated trailer-video draft reservation
- `POST /v1/episodes/:episodeId/audio`
- `POST /v1/episodes/:episodeId/trailer`
- `POST /v1/episodes/:episodeId/trailer-video` — authenticated multipart MP4 staging
- `POST /v1/episodes/:episodeId/cover`
- `POST /v1/episodes/:episodeId/cover-webp`
- `DELETE /v1/episodes/:episodeId/audio`
- `DELETE /v1/episodes/:episodeId/trailer`
- `DELETE /v1/episodes/:episodeId/cover`
- `DELETE /v1/episodes/:episodeId/cover-webp`
- `GET /health`
- `GET /v1/assets/cover-mosaic.json`
- `GET /v1/metrics/spotify`
- `GET /v1/metrics/youtube`

Media flow:

- The Angular client requests `POST /v1/episodes/drafts` with `{episodeId}` immediately before the first new-episode trailer-video upload. The API returns `{draftId, episodeId, state: "reserved", expiresAt}`; the opaque reservation is bound to the authenticated, normalized owner and expires after a bounded 24-hour window.
- The client sends the MP4 as multipart field `file` to `POST /v1/episodes/:episodeId/trailer-video` with `X-Episode-Draft-Id`. The API is authoritative for positive-ID, owner, reservation, MP4 MIME/extension, and configured size validation. A new-episode response is `{episodeId, draftId, state: "staged", trailerVideoFileName: null, message}`; persisted replacements return `state: "finalized"`.
- `POST /v1/episodes` consumes the same `draftId` and episode ID. On successful create, the API promotes staged bytes to the canonical server-owned `episodes/{episodeId}/trailer.mp4`, then returns the finalized response. Failed or canceled replacement attempts retain the last-known-good final file; expired/abandoned draft staging is cleaned up by the API.
- Angular owns file selection, byte progress, cancel/retry state, and display. The API owns validation, authentication/ownership, storage paths, staging, cleanup, promotion, rollback, and persistence. `authBypass` remains a local development login toggle; it does not move these lifecycle rules into the browser.

Phase 7 is local trailer-video upload only. YouTube transfer or processing, private/public publishing, hashtag lookup, title generation, and trailer artifact-download integration are later-phase contracts and are intentionally not exposed by this workflow.

## UI Direction

Keep the legacy-inspired sectioned layout:

- grouped sections
- form-first workflow
- operational table and status blocks

Do not regress to a minimal single-panel layout.

## Local Runbook

```bash
npm install
npm start
```

Open:

```text
http://localhost:4200/
```

Build:

```bash
npm run build
```

Known current notes:

- the build passes
- Angular reports a metrics stylesheet budget warning
- Angular reports an initial bundle budget warning

## Known Gaps

- Legacy advanced credits subflows are not fully restored.
- The root component test is stale and should be replaced.

## AI Prompt Starter

```text
Project: dragaocareca-admin-web
Path: /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web
Read docs/README.md first, then docs/ARCHITECTURE.md and docs/CONFIGURATION.md when implementing changes.
Preserve sectioned legacy-like admin layout.
Keep business logic on backend; frontend should call APIs only.
Respect auth toggle: environment.authBypass.
```
