---
phase: 08-youtube-job-lifecycle
plan: 03
subsystem: angular-api-boundary
tags: [angular, httpclient, youtube, lifecycle, contract-tests]
dependency_graph:
  requires: [08-00, 08-01]
  provides: [typed-youtube-job-wrappers, safe-youtube-job-snapshot, angular-http-contract-tests]
  affects: [08-04-manage-youtube-lifecycle]
tech_stack:
  added: []
  patterns: [typed-api-service-wrapper, HttpTestingController-contract-fixtures, safe-dto-allowlist]
key_files:
  created: [.planning/phases/08-youtube-job-lifecycle/deferred-items.md]
  modified: [src/app/core/api.service.ts, src/app/core/api.service.spec.ts]
decisions:
  - Keep Angular limited to authenticated API orchestration with title/summary metadata and empty retry/cancel bodies.
  - Represent all raw backend lifecycle statuses while exposing only normalized operator-safe error and cancellation fields.
  - Preserve the API-owned publication boundary by adding no Angular publish wrapper or provider integration.
metrics:
  duration: 8min
  completed_date: 2026-08-12
status: complete
---

# Phase 08 Plan 03: Typed YouTube Lifecycle HTTP Boundary Summary

Typed Angular YouTube lifecycle wrappers using sanitized DTOs, with exact HttpTestingController request/response contract coverage.

## Completed Tasks

| Task | Description | Commit |
|---|---|---|
| 1 | Defined safe snapshot/status types and start/current/status/retry/cancel wrappers | 296775e |
| 2 | Hardened exact URL, method, metadata/body, status, no-store, and safe-field fixtures | 7d3223f |

## Implementation Details

- Added `YoutubeTrailerJobSnapshot` with lifecycle status, transfer/processing progress, cancellation boundary, normalized error category, retry timing, timestamps, and nullable sanitized `privateWatchUrl`.
- Added typed `ApiService` methods for metadata-bearing start, current-source lookup, status polling, same-job retry, and cancellation.
- Added fixtures for all nine raw backend statuses and both queued `202 Accepted` and reused `200 OK` starts.
- Asserted exact authenticated route shapes, title/summary-only start input, empty retry/cancel bodies, no-store-compatible responses, and absence of provider/session/source/raw-error/OAuth fields and Angular publication controls.

## Verification

- `npm run build` — passed. Existing Angular warnings remain for the metrics stylesheet budget, initial bundle budget, and two CSS selector parser skips.
- `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` — blocked before browser execution by unrelated TypeScript errors in downstream `src/app/pages/manage/manage.component.spec.ts` RED expectations for plan 08-04. The API spec itself compiled after the 08-03 changes.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Converted the existing RED scaffold to the exported service contract**
- **Found during:** Task 1
- **Issue:** The pre-existing scaffold used casts and a private duplicate DTO, so it did not verify the actual `ApiService` boundary.
- **Fix:** Imported the exported snapshot type and called the typed wrappers directly, preserving the intended RED/GREEN gate.
- **Files modified:** `src/app/core/api.service.spec.ts`
- **Commit:** 29300d0

## Deferred Issues

- Downstream Manage RED-spec compilation errors are recorded in `deferred-items.md` and remain owned by plan 08-04.

## Known Stubs

None in the files modified by this plan.

## Threat Surface Review

No new trust boundary was introduced beyond the planned Angular-to-API authenticated routes. The DTO is allowlisted and does not expose provider credentials, sessions, source identity/path, raw errors, or publication controls.

## Self-Check: PASSED

- Summary and deferred-items files exist.
- Commits `29300d0`, `296775e`, and `7d3223f` exist in repository history.
- All planned source and test files exist.
