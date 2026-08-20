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
- `defaultParticipants`

## Local Development

Current development settings in `src/environments/environment.ts`:

- `production: false`
- `apiBaseUrl: http://localhost:3000/v1`
- `googleClientId: 598182825783-bfujs22hdvor0v807d7tkfb2v6d1qga8.apps.googleusercontent.com`
- `authBypass: true`
- `defaultParticipants: ['Jhonatt Lima']`

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
- `defaultParticipants: ['Jhonatt Lima']`

`defaultParticipants` is a frontend-only ordered list of participant names used when opening a new episode. The Manage page intersects it with the current member catalog and ignores names that are not available; changing it does not bypass API validation or alter existing episode edits.

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
- `POST /v1/episodes/:episodeId/transcription/whisper` — queues faster-whisper transcription for existing staged/final audio
- `GET /v1/episodes/:episodeId/episodes-generated-summary`
- `POST /v1/episodes/drafts` — authenticated `{episodeId}` reservation returning `{draftId, episodeId, state, expiresAt}`
- `POST /v1/episodes/:episodeId/audio`
- `POST /v1/episodes/:episodeId/trailer`
- `POST /v1/episodes/:episodeId/trailer-video` — authenticated multipart `file` with `X-Episode-Draft-Id`
- `DELETE /v1/episodes/:episodeId/trailer-video` — removes the trailer and associated YouTube cleanup targets
- `POST /v1/episodes/:episodeId/youtube-trailer-jobs` — starts private transfer from finalized or staged draft media
- `POST /v1/episodes/:episodeId/youtube-trailer-jobs/commit` — records Save-time publication intent
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

Transcription providers are selected by the API through `EPISODE_TRANSCRIPTION_PROVIDER`. Supported values are `gemini`, `groq`, `faster-whisper`, and `internal`. The Groq provider uses `whisper-large-v3-turbo` by default, splits long audio into five-minute chunks to stay below Groq's upload limit, and joins the resulting Portuguese transcript before summary generation. Configure `GROQ_API_KEY` and `EPISODE_TRANSCRIPTION_GROQ_MODEL`; the browser contract is unchanged.

### AI authoring provider

The frontend only polls the summary and hashtag-authoring state; provider selection and credentials remain backend-owned. The API attempts Gemini first for summary and automatic hashtag candidates, then falls back to Groq. The UI displays the actual provider in the existing status messages. Summary prompt version 6 follows the published feed style: concise 550–1500 character descriptions, “o grupo/os aventureiros/a guilda” voice, two focused paragraphs, and 3–5 highlights:

```text
EPISODE_SUMMARY_PROVIDER=groq
GROQ_API_KEY=<server-only key>
EPISODE_SUMMARY_GROQ_MODEL=openai/gpt-oss-120b
GROQ_API_BASE_URL=https://api.groq.com/openai/v1
GROQ_MIN_INTERVAL_MS=60000
GROQ_TOKENS_PER_MINUTE=8000
GROQ_DAILY_TOKEN_LIMIT=200000
GROQ_RATE_LIMIT_RETRIES=1
```

Gemini/Groq selection is configured only in the API with `EPISODE_SUMMARY_PRIMARY_PROVIDER`, `EPISODE_SUMMARY_PROVIDER`, `YOUTUBE_HASHTAG_PRIMARY_PROVIDER`, and `YOUTUBE_HASHTAG_PROVIDER`. This affects summary and automatic hashtag candidate generation; episode transcription keeps its own `EPISODE_TRANSCRIPTION_PROVIDER` configuration. Never place the Groq or Gemini API key in Angular environment files.

Groq requests share one backend queue. The default configuration allows an estimated 8,000 tokens per minute, spaces calls by at least 60 seconds, enforces a 200,000-token daily budget, and retries one time using the provider's `Retry-After` or token-reset header after a `429`. The summary and hashtag jobs therefore run sequentially; a completed summary is persisted and is not regenerated when only hashtag authoring needs a retry.

### Trailer-video contract

The local MP4 lifecycle is API-owned. Before a new-episode upload, the frontend reserves a positive episode ID with `POST /v1/episodes/drafts`; the server binds the opaque UUID `draftId` to the normalized authenticated email and applies a bounded 24-hour expiry. The upload uses multipart field `file` and `X-Episode-Draft-Id`; the API, not the browser `accept` hint, enforces MP4 extension/MIME and `EPISODE_TRAILER_VIDEO_MAX_BYTES`.

The new-episode upload returns `state: "staged"` with no finalized filename and queues/reuses the private YouTube job in that same request. The reservation also creates a hidden draft episode row, allowing transfer before Save without waiting for title, transcript, or summary completion. The response may include a sanitized job snapshot; when YouTube accepts the video, the public DTO exposes only a sanitized private watch URL. Canceling an active transfer exposes an explicit Upload to YouTube restart action after cancellation settles. `POST /v1/episodes` carries the same `episodeId` and `draftId`; successful creation consumes the reservation, converts the draft row, and promotes staged bytes to `episodes/{episodeId}/trailer.mp4`. Save-time commit applies `Trailer - <episode title>` as the YouTube title, the episode summary as description, then publishes after private readiness. Replacement/deletion invokes idempotent provider-video deletion and records retryable cleanup reconciliation when necessary.

If the browser retries reservation after an interrupted upload, an active reservation owned by the same authenticated user is reused. Stale expired/consumed reservation rows are replaced; an existing saved episode cannot be reserved as a new draft.

`authBypass=true` remains a local frontend/backend development mode and does not change the contract or remove server-side validation. YouTube OAuth, provider deletion, publication, and cleanup remain backend-owned; the browser never receives provider IDs, sessions, credentials, paths, or raw provider errors.

### Episode-audio contract

`POST /v1/episodes/:episodeId/audio` returns backend-confirmed `duration` and `bytes` after the staged file has been validated. `duration` is normalized to `HH:MM:SS`; `bytes` is a nonnegative integer from the staged file. If either value cannot be confirmed, the API fails the upload and cleans up staged output rather than returning a partial success. The Angular form applies the values only on completed upload response, retains raw bytes for the write payload, and displays decimal MB with exactly two decimal places (`1 MB = 1,000,000 bytes`) using nonnegative half-up rounding.

The complete music-credit invariant is shared by the UI and API: at least one credit must have a trimmed name and at least one trimmed reference URL. Duration, Bytes, and Spotify ID are read-only light-gray fields in the form; there are no hint-text requirements. Trailer-audio remains on its existing filename/message contract and does not invoke episode-audio metadata extraction.

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
