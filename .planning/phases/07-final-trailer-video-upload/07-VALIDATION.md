---
phase: 07
slug: final-trailer-video-upload
status: evidence-recorded
nyquist_compliant: false
wave_0_complete: true
created: 2026-08-03
updated: 2026-08-04
---

# Phase 07 — Validation Strategy

> Validation matrix for the authenticated local trailer-video lifecycle. Phase 7 stops at local MP4 staging/finalization; YouTube transfer, processing, publishing, hashtags, title generation, and trailer artifact-download integration are explicitly out of scope.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend framework** | Karma 6 + Jasmine 4; Angular CLI 15 test target |
| **Frontend config** | `angular.json` |
| **Focused service command** | `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/core/api.service.spec.ts` |
| **Focused component command** | `npm test -- --watch=false --browsers=ChromeHeadless --include src/app/pages/manage/manage.component.spec.ts` |
| **Full frontend command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Sibling API build** | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build` |
| **Sibling API lifecycle verifier** | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run verify:trailer-video-upload-lifecycle` |
| **Frontend build** | `npm run build` |
| **Watch mode** | None of the validation commands use watch mode. |

## Final Gate Results (2026-08-04)

| Gate | Command | Result | Evidence / limitation |
|------|---------|--------|-----------------------|
| API build | `npm run build` in sibling API | **PASS** | TypeScript build completed. |
| API lifecycle/security | `npm run verify:trailer-video-upload-lifecycle` in sibling API | **PASS** | Verifier reported reservation, auth, staging, create promotion, validation, rollback, expiry cleanup, and no-YouTube route boundary. |
| Focused Angular service | Focused service command above | **UNAVAILABLE** | Angular bundles compiled, but ChromeHeadless could not launch: `No binary for ChromeHeadless browser on your platform. Please, set "CHROME_BIN" env variable.` |
| Focused Angular component | Focused component command above | **UNAVAILABLE** | Angular bundles compiled, but ChromeHeadless could not launch; no Jasmine assertions executed. |
| Full Angular Karma | Full frontend command above | **UNAVAILABLE** | Angular bundles compiled and Karma started, but no ChromeHeadless binary was available; no browser assertions executed. |
| Angular production build | `npm run build` | **PASS WITH WARNINGS** | Build completed. Existing warnings: metrics stylesheet budget (3.96 kB vs 2.00 kB) and initial bundle budget (687.16 kB vs 500.00 kB); Angular selector-parser warnings for `legend+*` and `.form-floating>~label`. |

The unavailable-browser results are environmental and remain open. Install/provide a ChromeHeadless binary or set `CHROME_BIN`, then rerun both focused commands and the full command before release sign-off. Bundle compilation passing is recorded separately and is not treated as test assertion success.

## Requirement-to-Evidence Matrix

| Requirement | Automated evidence | Manual / remaining evidence | Status |
|-------------|--------------------|-----------------------------|--------|
| **TRAILER-01** Select an MP4 in New Episode File Management | `manage.component.spec.ts`: dedicated Trailer video card, MP4 hint, input/drop dispatch; sibling lifecycle verifier validates MP4 route boundary | Real browser: choose a valid MP4 and confirm the card shows the selected file | Browser execution unavailable; implementation and source coverage present |
| **TRAILER-02** Upload through backend and show byte progress | `api.service.spec.ts`: `POST /episodes/:episodeId/trailer-video`, multipart `file`, `X-Episode-Draft-Id`, progress event; `manage.component.spec.ts`: byte progress and terminal-response boundary; API verifier validates authenticated staging | Real MP4: observe visible progress through staged response | Browser execution unavailable; API verifier passed |
| **TRAILER-03** Cancel upload while retaining prior final asset | `manage.component.spec.ts`: unsubscribe/cancel, retained `File`, retained prior final filename; API verifier validates staging cleanup, failure preservation, and rollback | Real browser: cancel an active transfer and confirm prior finalized video remains represented | Browser execution unavailable; API verifier passed |
| **TRAILER-04** Retry or replace without stale-response corruption | `manage.component.spec.ts`: retry same `File`, replacement generations, stale A response ignored, teardown; API verifier validates expired/reused/mismatched/other-owner draft rejection and create failure recovery | Real browser: retry canceled/failed upload and replace with a different MP4 | Browser execution unavailable; API verifier passed |
| **TRAILER-05** Distinguish lifecycle states and expose no publish action | `manage.component.spec.ts`: selected/uploading/staged/promoting/finalized/failed/canceled labels and controls; template has no YouTube publishing controls; API verifier asserts no-YouTube route boundary | Real browser: inspect all visible states and confirm no YouTube controls | Browser execution unavailable; no-YouTube automated evidence passed |

## Security and Lifecycle Assertions

The sibling verifier command is the canonical backend evidence and covers:

- authenticated reservation issuance with opaque UUID, positive episode ID, normalized owner binding, and bounded expiry;
- missing, malformed, unreserved, expired, reused, mismatched, and other-owner draft rejection before staging or create;
- MP4 MIME/extension/size/missing-file validation and deterministic staging;
- select-before-Save staged response, same `episodeId`/`draftId` create handoff, reservation consumption, canonical `episodes/{episodeId}/trailer.mp4` promotion, and create-failure recovery;
- persisted replacement rollback, last-known-good preservation, expiry cleanup, and no YouTube/provider call.

The Angular contract is deliberately thin: it owns selection, progress, cancellation, retry, replacement-generation guards, state labels, and Save orchestration. The API owns authentication, ownership, validation, server-derived paths, staging, cleanup, promotion, rollback, and persistence. `authBypass` remains a local development login toggle and does not weaken these API checks.

## Manual-Only Verification

| Behavior | Requirement | Instructions |
|----------|-------------|--------------|
| Visible progress, browser cancellation, retry, replacement, and finalization with a real MP4 | TRAILER-01..05 | Start the sibling API and Angular app in local bypass mode, open New Episode → File Management, select a valid MP4 before Save, confirm reservation/staged status and visible byte progress, cancel and retry, select a replacement, then Save the same episode and verify finalized `episodes/{episodeId}/trailer.mp4` state. Confirm a failed/canceled replacement retains the prior finalized asset and no YouTube controls appear. |

## Validation Sign-Off

- [x] Task and plan IDs are mapped to focused and full verification commands.
- [x] Reservation issuance, ownership, unreserved-ID rejection, staging, Save/create promotion, failure recovery, rollback, cleanup, and no-YouTube evidence are named.
- [x] TRAILER-01 through TRAILER-05 each have automated/source evidence plus the required manual recovery check.
- [x] All commands are deterministic and non-watch.
- [ ] Focused and full Angular Karma assertions executed successfully — **blocked by unavailable ChromeHeadless binary**.
- [ ] `nyquist_compliant: true` — pending successful browser-backed rerun.
- [ ] Approval/sign-off — pending browser-backed rerun and manual real-MP4 recovery check.
