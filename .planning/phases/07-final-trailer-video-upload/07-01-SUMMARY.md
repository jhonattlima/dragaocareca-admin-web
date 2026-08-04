---
phase: 07-final-trailer-video-upload
plan: 01
subsystem: api
tags: [express, sqlite, multer, multipart-upload, trailer-video, rollback, security]

requires:
  - phase: 06
    provides: Existing authenticated trailer-video route and canonical media layout
provides:
  - Authenticated opaque trailer-video draft reservations with 24-hour expiry
  - Safe pre-save staging and save-time promotion with explicit staged/finalized responses
  - Executable lifecycle verifier covering validation, ownership, cleanup, promotion, and rollback
affects: [phase-07-02, phase-07-03, frontend-trailer-video-upload]

tech-stack:
  added: []
  patterns: [owner-bound opaque SQLite capability, server-derived staging/final paths, rollback-safe atomic promotion]

key-files:
  created:
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-draft-reservation.service.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/scripts/verify-trailer-video-upload-lifecycle.ts
  modified:
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/repositories/episode.repository.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/sqlite.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-media-layout.service.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/schemas/episode-draft-state.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/docs/openapi.ts
    - /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/package.json

key-decisions:
  - "Use a server-issued UUID reservation bound to normalized authenticated email and positive episodeId; never trust browser owner or path data."
  - "Keep draft uploads staged until POST /v1/episodes consumes the same reservation, while persisted replacement reuses the existing rollback-safe service."
  - "Return explicit staged/finalized lifecycle state and preserve existing episode fields in finalized responses for compatibility."

patterns-established:
  - "Pre-save multipart writes are authorized before Multer retains bytes and use only server-derived staging paths."
  - "Final promotion copies old media to rollback storage, prepares new bytes, renames atomically, then updates the repository."

requirements-completed: [TRAILER-02, TRAILER-03, TRAILER-04]

coverage:
  - id: D1
    description: "Authenticated opaque draft reservation and owner/episode binding"
    requirement: TRAILER-02
    verification:
      - kind: integration
        ref: "npm run verify:trailer-video-upload-lifecycle"
        status: pass
    human_judgment: false
  - id: D2
    description: "Immediate trailer staging, create promotion, canonical finalized response, and rollback-safe replacement"
    requirement: TRAILER-03
    verification:
      - kind: integration
        ref: "npm run verify:trailer-video-upload-lifecycle"
        status: pass
      - kind: integration
        ref: "npm run verify:trailer-video-artifact"
        status: pass
    human_judgment: false
  - id: D3
    description: "Lifecycle verifier for validation, cleanup, expiry, failure preservation, and no-YouTube boundary"
    requirement: TRAILER-04
    verification:
      - kind: other
        ref: "npm run build && npm run verify:trailer-video-upload-lifecycle"
        status: pass
    human_judgment: false

metrics:
  duration: 32min
  completed: 2026-08-04
  status: complete
---

# Phase 07 Plan 01: Final Trailer Video Upload API Summary

**Authenticated draft reservations now gate immediate MP4 staging, save-time promotion, and rollback-safe final trailer replacement in the sibling API.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-08-04T00:00:00Z (approximate session start)
- **Completed:** 2026-08-04
- **Tasks:** 3
- **Files modified:** 9 unique sibling API files

## Accomplishments

- Added durable SQLite-backed opaque draft reservations bound to authenticated owner and positive episode ID, with 24-hour expiry and staging cleanup.
- Added authenticated pre-save trailer-video staging, explicit staged/finalized response DTOs, create consumption, canonical `episodes/{episodeId}/trailer.mp4` promotion, and existing final-media preservation.
- Added an isolated verifier covering authorization, malformed uploads, retries, create promotion, replacement, rollback, expiry cleanup, and the Phase 7 no-YouTube boundary.

## Task Commits

Each task was committed atomically in the sibling API repository:

1. **Task 1: Define authenticated draft reservation and response contract** - `a59fd35` (`feat`)
2. **Task 2: Implement staged trailer upload and atomic promotion lifecycle** - `2b824da` (`feat`)
3. **Task 3: Add backend lifecycle, security, and rollback verification** - `2466f62` (`test`)

The frontend planning summary/state metadata is committed separately below.

## Files Created/Modified

- `src/services/episode-draft-reservation.service.ts` - Issues, validates, consumes, expires, and cleans owner-bound reservations.
- `src/database/sqlite.ts` and `src/database/repositories/episode.repository.ts` - Persist reservation state and lifecycle transitions.
- `src/routes/episodes.routes.ts` - Adds `/episodes/drafts`, guarded pre-save upload, create promotion, and explicit response states.
- `src/services/episode-media-layout.service.ts` - Provides server-owned staging cleanup.
- `src/schemas/episode-draft-state.ts` - Defines reservation and upload response types.
- `src/docs/openapi.ts` - Documents reservation, draft header, multipart field, and lifecycle errors.
- `src/scripts/verify-trailer-video-upload-lifecycle.ts` - Isolated executable lifecycle/security verifier.
- `package.json` - Adds `verify:trailer-video-upload-lifecycle` using temporary SQLite/media paths.

## Decisions Made

- Reservations are opaque UUID capabilities, owner-bound to normalized `req.user.email`, and are required for new-episode pre-save upload/create.
- Staged responses never expose a finalized filename; finalization is represented only after authenticated create or persisted replacement succeeds.
- The existing persisted replacement service remains the shared rollback-safe promotion implementation, preserving backward-compatible episode fields in its response.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Preserved existing episode fields in finalized upload responses**
- **Found during:** Task 2
- **Issue:** The exact lifecycle response initially omitted existing fields such as `youtube`, breaking the established persisted trailer verifier.
- **Fix:** Included the updated episode object alongside explicit `state`, `draftId`, canonical filename, sync status, and message.
- **Files modified:** `src/routes/episodes.routes.ts`
- **Verification:** `npm run verify:trailer-video-artifact`
- **Committed in:** `2b824da`

**2. [Rule 3 - Blocking] Made multipart lifecycle fixtures deterministic**
- **Found during:** Task 3
- **Issue:** The isolated verifier initially lacked a multipart content length and used a runtime limit mutation after Multer configuration had been created.
- **Fix:** Added content length to the fixture and configured a 1 KiB verifier limit, with an overflow payload above that limit.
- **Files modified:** `src/scripts/verify-trailer-video-upload-lifecycle.ts`, `package.json`
- **Verification:** `npm run build && npm run verify:trailer-video-upload-lifecycle`
- **Committed in:** `2466f62`

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking test-fixture issue)
**Impact on plan:** Both fixes were directly required for compatibility and reliable security/lifecycle evidence; no feature scope was added.

## Issues Encountered

- The sibling API repository is outside the default workspace write boundary. Scoped escalation was required for its Git commits and build/verifier output; source changes remained limited to plan files.
- The sibling API had pre-existing modifications under `.planning/`; they were preserved and not included in any task commit.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- The Angular client can issue `POST /v1/episodes/drafts`, send `X-Episode-Draft-Id` on immediate trailer upload, and send the same `draftId` in create.
- No YouTube/provider route or publishing control was introduced; later phases can build on the finalized local-media contract.

## Self-Check: PASSED

- All three sibling API task commits exist: `a59fd35`, `2b824da`, `2466f62`.
- Created verifier and reservation service exist on disk.
- `npm run typecheck`, `npm run build`, `npm run verify:trailer-video-upload-lifecycle`, and `npm run verify:trailer-video-artifact` passed.

---
*Phase: 07-final-trailer-video-upload*
*Completed: 2026-08-04*
