# dragaocareca-admin-web

## Context First (AI / Agent)
Before making changes, read:
- `docs/SDD.md`

This is the canonical compressed context for routing, auth toggles, API contract, layout direction, and runbook.

Angular frontend for `dragaocareca-admin-api`.

## Run

```bash
npm install
npm start
```

By default it calls `http://localhost:3000/v1` (backend app running locally).

Set API + Google client in:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Current config intentionally points both environments to local backend to avoid using legacy/live endpoints during migration validation.

## Authentication

Preferred flow:
- Google button (GIS) in login page gets ID token
- app sends token to `POST /v1/auth/google`
- backend returns JWT access token
- interceptor adds `Authorization: Bearer <token>` to protected calls

Fallback:
- Manual token paste in login page details block

## Screens

- Login (`/login`)
- Dashboard (`/`) with:
  - feed status (`GET /v1/feed/status`)
  - episodes list (`GET /v1/episodes`)
  - episode create/update (`POST/PUT /v1/episodes`)
