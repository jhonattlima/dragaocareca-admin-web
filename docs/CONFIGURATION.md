# Configuration

**Analysis Date:** 2026-07-24

## Environment Files

The frontend reads runtime configuration from:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Shared keys:

- `apiBaseUrl`
- `googleClientId`
- `authBypass`

## Local Development

Current development settings in `src/environments/environment.ts`:

- `production: false`
- `apiBaseUrl: http://localhost:3000/v1`
- `googleClientId: 598182825783-bfujs22hdvor0v807d7tkfb2v6d1qga8.apps.googleusercontent.com`
- `authBypass: true`

`authBypass` changes both the auth guard and login behavior:

- `AuthService.isAuthenticated()` returns true.
- `LoginComponent` auto-redirects to `/`.
- `getProfile()` returns a local mock profile.

For the full local bypass path, the backend should also be running with its own auth bypass enabled.

## Production

Current production settings in `src/environments/environment.prod.ts`:

- `production: true`
- `apiBaseUrl: https://api.dragaocareca.com/v1`
- `googleClientId: 598182825783-bfujs22hdvor0v807d7tkfb2v6d1qga8.apps.googleusercontent.com`
- `authBypass: false`

## Backend Contract

The frontend expects the backend to expose:

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
- `POST /v1/episodes/drafts` — authenticated `{episodeId}` reservation returning `{draftId, episodeId, state, expiresAt}`
- `POST /v1/episodes/:episodeId/audio`
- `POST /v1/episodes/:episodeId/trailer`
- `POST /v1/episodes/:episodeId/trailer-video` — authenticated multipart `file` with `X-Episode-Draft-Id`
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

### Trailer-video contract

The local MP4 lifecycle is API-owned. Before a new-episode upload, the frontend reserves a positive episode ID with `POST /v1/episodes/drafts`; the server binds the opaque UUID `draftId` to the normalized authenticated email and applies a bounded 24-hour expiry. The upload uses multipart field `file` and `X-Episode-Draft-Id`; the API, not the browser `accept` hint, enforces MP4 extension/MIME and `EPISODE_TRAILER_VIDEO_MAX_BYTES`.

The new-episode upload returns `state: "staged"` with no finalized filename. `POST /v1/episodes` must carry the same `episodeId` and `draftId`; successful creation consumes the reservation and promotes the staged bytes to `episodes/{episodeId}/trailer.mp4`. Persisted replacement and create failure paths preserve or restore the last-known-good final file, and expired/abandoned staging is cleaned up server-side. Angular only owns selection, byte progress, cancel/retry/replacement display, and save orchestration.

`authBypass=true` remains a local frontend/backend development mode and does not change the contract or remove server-side validation. Phase 7 intentionally has no YouTube transfer, processing, private/public publishing, hashtag lookup, title generation, or trailer artifact-download controls; those belong to later phases.

## Login and Session

Normal mode:

1. Google GIS returns an ID token.
2. The app sends the token to `POST /v1/auth/google`.
3. The backend returns a JWT access token.
4. The token is stored in `localStorage` under `dc_admin_access_token`.
5. `AuthInterceptor` injects `Authorization: Bearer <token>` on subsequent calls.

Bypass mode:

1. `authBypass` is enabled in the environment file.
2. The login page redirects immediately to `/`.
3. Protected pages accept the user without a token.

## Build and Tooling Config

- `angular.json` - build, serve, and test targets.
- `tsconfig.json` - strict TypeScript and Angular compiler settings.
- `tsconfig.app.json` - app compilation settings.
- `tsconfig.spec.json` - unit-test compilation settings.
- `.editorconfig` - formatting defaults.

## Runbook

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

Current known build notes:

- The build passes.
- Angular reports a component style budget warning for `src/app/pages/metrics/metrics.component.scss`.
- Angular also reports an initial bundle budget warning.

---

*Configuration analysis: 2026-07-24*
