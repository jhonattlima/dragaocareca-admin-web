# SDD - Dragao Careca Admin Web

## 1. Purpose
Frontend context document to reduce AI prompt/token cost for future maintenance.

Project:
- `E:\Jhonatt\Development\Projects\angular\dragaocareca-admin-web`

Primary backend dependency:
- `E:\Jhonatt\Development\Projects\node\dragaocareca-admin-api`

## 2. Product Role
This Angular app is an **admin client** for episode/feed operations.
It should not contain business logic that belongs to feed construction or scheduling.

Backend remains source of truth for:
- release-time decisions (`pubDate`)
- feed generation
- persistence
- auth token validation

## 3. Stack
- Angular 15
- TypeScript
- Bootstrap CSS (imported globally)

## 4. App Structure
- `src/app/core/auth.service.ts`
  - login with Google ID token (`/v1/auth/google`)
  - token storage
  - profile fetch (`/v1/auth/me`)
  - frontend auth bypass handling

- `src/app/core/auth.interceptor.ts`
  - injects `Authorization: Bearer <token>`

- `src/app/core/auth.guard.ts`
  - protects dashboard route

- `src/app/core/api.service.ts`
  - episodes list/create/update
  - episode media uploads
  - feed status

- `src/app/pages/login/*`
  - Google sign-in UI (GIS)
  - manual token fallback

- `src/app/pages/dashboard/*`
  - sectioned admin layout inspired by legacy app
  - episode form + table
  - feed status panel
  - drag-and-drop media upload cards for episode audio, trailer, and covers
  - upload progress bars on each media card
  - delete buttons only when a file is staged or already present
  - guest name search filter on episode table
  - pagination footer separated from the rows-per-page control

## 5. Routing
Configured in `app-routing.module.ts`:
- `/login` -> login page
- `/` -> dashboard (guarded)
- wildcard -> `/`

## 6. Environment Config
### 6.1 Development
`src/environments/environment.ts`
- `production: false`
- `apiBaseUrl: http://localhost:3000/v1`
- `googleClientId: ...`
- `authBypass: true|false`

### 6.2 Production
`src/environments/environment.prod.ts`
- `production: true`
- `apiBaseUrl: https://api.dragaocareca.com/v1`
- `googleClientId: ...`
- `authBypass: false`

## 7. Auth Modes
### 7.1 Normal mode
- Google GIS returns ID token
- app calls `POST /v1/auth/google`
- backend returns JWT
- JWT stored in localStorage and sent by interceptor

### 7.2 Local bypass mode
When `authBypass=true`:
- guard considers user authenticated
- login screen auto-redirects to dashboard
- `getProfile()` returns local mock profile

Note: for full local bypass, backend should also have `AUTH_BYPASS=true` in `.env`.

## 8. Backend Contract Assumptions
Expected endpoints:
- `POST /v1/auth/google`
- `GET /v1/auth/me`
- `GET /v1/episodes`
- `POST /v1/episodes`
- `PUT /v1/episodes/:episodeId`
- `GET /v1/feed/status`
- `POST /v1/episodes/:episodeId/audio`
- `POST /v1/episodes/:episodeId/trailer`
- `POST /v1/episodes/:episodeId/cover`
- `POST /v1/episodes/:episodeId/cover-webp`
- `DELETE /v1/episodes/:episodeId/audio`
- `DELETE /v1/episodes/:episodeId/trailer`
- `DELETE /v1/episodes/:episodeId/cover`
- `DELETE /v1/episodes/:episodeId/cover-webp`

Media flow:
- uploads are staged first
- save/update applies staged media to the selected episode
- delete removes the staged or existing media file for that episode ID

## 9. UI Direction
Layout intentionally follows legacy admin structure:
- grouped sections
- form-first workflow
- operational table and status blocks

Do not regress to minimal single-panel layout.

## 10. Local Runbook
```powershell
cd E:\Jhonatt\Development\Projects\angular\dragaocareca-admin-web
npm install
npm start
```
Open: `http://localhost:4200/`

## 11. Build
```powershell
npm run build
```
Known: current build may show a small initial budget warning; not functional blocker.

## 12. Known Gaps
- Legacy advanced credits subflows (members/guests/music/citations management UX depth) are not fully restored.

## 13. AI Prompt Starter (Frontend)
```text
Project: dragaocareca-admin-web
Path: E:\Jhonatt\Development\Projects\angular\dragaocareca-admin-web
Read docs/SDD.md first.
Preserve sectioned legacy-like admin layout.
Keep business logic on backend; frontend should call APIs only.
Respect auth toggle: environment.authBypass.
```
