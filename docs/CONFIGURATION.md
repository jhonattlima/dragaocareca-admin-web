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
- `POST /v1/episodes/:episodeId/audio`
- `POST /v1/episodes/:episodeId/trailer`
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
