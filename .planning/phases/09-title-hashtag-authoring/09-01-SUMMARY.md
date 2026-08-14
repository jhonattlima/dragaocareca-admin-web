---
phase: 09-title-hashtag-authoring
plan: 01
subsystem: api
tags: [youtube, hashtags, metadata, openapi, sqlite-cache, unicode-validation]

requires:
  - phase: 08-youtube-job-lifecycle
    provides: durable private YouTube jobs, metadata_snapshot_json, and Save-time publication boundary
provides:
  - canonical Save/start/commit title and hashtag metadata contract in the sibling API
  - shared 100-Unicode-code-point assembled-title validation and legacy-tag fallback removal
  - one-hour normalized hashtag lookup cache defaults and verifier coverage
affects: [09-02-title-hashtag-authoring-frontend, youtube-publication, hashtag-lookup]

tech-stack:
  added: []
  patterns: [API-owned publication metadata snapshots, shared boundary validation, normalized one-hour cache freshness]

key-files:
  created: []
  modified:
    - ../dragaocareca-admin-api/src/routes/episodes.routes.ts
    - ../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts
    - ../dragaocareca-admin-api/src/services/youtube-trailer-publication.service.ts
    - ../dragaocareca-admin-api/src/config/env.ts
    - ../dragaocareca-admin-api/.env.example
    - ../dragaocareca-admin-api/src/docs/openapi.ts
    - ../dragaocareca-admin-api/src/scripts/verify-episode-hashtag-authoring.ts

key-decisions:
  - "Save/commit accepts title and hashtags as the authoritative authored metadata and persists the complete snapshot through existing metadata_snapshot_json/requestPublication."
  - "The shared validator counts Unicode code points, rejects forbidden/control characters and duplicate hashtag tokens, and runs at start, commit, and publication boundaries."
  - "Successful and zero-result normalized hashtag cache entries default to the same one-hour freshness window; error results retain the existing retry policy."

patterns-established:
  - "Legacy episode.tags are not substituted for the separate authored trailer hashtag field."
  - "Lookup DTOs continue to expose only approximate count, retrieval/cache state, and safe retryable error metadata."

requirements-completed: [TITLE-01, TITLE-02, TITLE-03, TITLE-04]

coverage:
  - id: D1
    description: "Authored title and hashtags survive Save commit, metadata snapshot reload, retry, and worker publication paths."
    requirement: TITLE-01
    verification:
      - kind: integration
        ref: "NODE_ENV=development DISABLE_BACKGROUND_WORKERS=true npm run verify:episode-hashtag-authoring -- --focus=lifecycle"
        status: pass
    human_judgment: false
  - id: D2
    description: "Assembled trailer titles enforce the 100-Unicode-code-point boundary and reject malformed or duplicate hashtags without provider delegation."
    requirement: TITLE-02
    verification:
      - kind: integration
        ref: "verify-episode-hashtag-authoring lifecycle focus; npm run build"
        status: pass
    human_judgment: false
  - id: D3
    description: "Normalized hashtag lookup reports approximate results and safe recoverable provider/quota states with one-hour hit/expiry behavior."
    requirement: TITLE-03
    verification:
      - kind: integration
        ref: "NODE_ENV=development DISABLE_BACKGROUND_WORKERS=true npm run verify:episode-hashtag-authoring -- --focus=lookup"
        status: pass
    human_judgment: false
  - id: D4
    description: "OpenAPI and environment documentation describe the authored metadata contract and one-hour cache policy."
    requirement: TITLE-04
    verification:
      - kind: integration
        ref: "NODE_ENV=development DISABLE_BACKGROUND_WORKERS=true npm run verify:episode-hashtag-authoring"
        status: pass
    human_judgment: false

duration: 18min
completed: 2026-08-14
status: complete
---

# Phase 09 Plan 01: API Title and Hashtag Contract Summary

**API-owned Save/start/commit metadata persistence with shared Unicode title validation and one-hour normalized hashtag lookup caching**

## Performance

- **Duration:** 18 minutes
- **Started:** 2026-08-14T13:20:00Z
- **Completed:** 2026-08-14T13:38:00Z
- **Tasks:** 2
- **Files modified:** 7 sibling API files

## Accomplishments

- Added the authenticated Save/commit `{ title, hashtags }` contract, persisted through the existing YouTube job `metadata_snapshot_json`, and removed silent fallback to legacy episode tags.
- Reused one exported assembled-title validator at start, commit, and provider publication boundaries, including Unicode code-point 100/101 checks, forbidden/control characters, and duplicate-token validation.
- Set successful and zero-result normalized hashtag cache defaults to one hour, documented the policy, and extended the offline verifier for normalized hits, expiry, safe errors, quota, metadata reload/retry, and OpenAPI parity.

## Task Commits

1. **Task 1: Make Save/start/commit metadata canonical and validate assembled title** - `4322627` (test RED), `50414e0` (feat GREEN)
2. **Task 2: Set one-hour hashtag cache freshness and lookup recovery coverage** - `74fd234` (feat)

## Files Created/Modified

- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` - validates and accepts authored commit metadata; validates start metadata; no legacy hashtag substitution.
- `../dragaocareca-admin-api/src/services/youtube-trailer-publication.service.ts` - shared assembled-title validator.
- `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` - publishes from durable metadata snapshots.
- `../dragaocareca-admin-api/src/config/env.ts`, `../dragaocareca-admin-api/.env.example` - one-hour cache defaults/documentation.
- `../dragaocareca-admin-api/src/docs/openapi.ts` - start/commit and lookup contract documentation.
- `../dragaocareca-admin-api/src/scripts/verify-episode-hashtag-authoring.ts` - lifecycle, boundary, cache, quota, and safe DTO checks.

## Decisions Made

- Kept the existing YouTube job repository column and publication flow; no new table or second publication route was introduced.
- Kept provider credentials, quota ledgers, cache internals, and raw provider responses server-side.
- Used one hour for both successful and zero-result cache entries while retaining configurable bounds and retry TTL behavior for errors.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added a durable episode fixture to the verifier**
- **Found during:** Task 1 lifecycle verification
- **Issue:** The new metadata snapshot assertion attempted to create a YouTube job without its required foreign-key episode row.
- **Fix:** Created a disposable valid episode fixture before creating the verifier job.
- **Files modified:** `../dragaocareca-admin-api/src/scripts/verify-episode-hashtag-authoring.ts`
- **Verification:** Focused lifecycle verifier passed.
- **Committed in:** `50414e0`

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Required only to make the planned persistence verification use the real SQLite schema; no production scope expansion.

## Issues Encountered

- The sibling API repository is outside the default writable sandbox root. Explicit escalated access was required for API edits/builds, as requested by the plan’s cross-repository scope.
- The frontend build passed with existing Angular budget warnings and selector-parser warnings; no frontend application source was changed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 09-02 can now send the computed read-only trailer title and authored hashtag array to the existing start and Save/commit API calls. The API build and hashtag-authoring verifier are green.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/09-title-hashtag-authoring/09-01-SUMMARY.md`.
- API commits `4322627`, `50414e0`, and `74fd234` exist in the sibling repository.
- Frontend application source remains unchanged.

---
*Phase: 09-title-hashtag-authoring*
*Completed: 2026-08-14*
