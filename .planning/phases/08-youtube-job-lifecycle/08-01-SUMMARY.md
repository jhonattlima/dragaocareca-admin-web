---
phase: 08-youtube-job-lifecycle
plan: 01
subsystem: api
tags: [youtube, resumable-upload, sqlite, express, openapi, recovery]
requires:
  - phase: 08-youtube-job-lifecycle
    provides: Wave 0 RED lifecycle contract and verifier
  - phase: 07-final-trailer-video-upload
    provides: finalized local trailer source and source identity
provides:
  - authenticated metadata-bearing YouTube job start with durable current-source lookup
  - same-row retry, resumable provider/session recovery, cancellation boundaries, and safe private URL DTO
  - OpenAPI contract for current/retry lifecycle routes and API-owned publish idempotency
affects: [08-02, 08-03, 08-04, frontend YouTube lifecycle integration]
tech-stack:
  added: []
  patterns: [server-owned metadata, source fingerprint CAS, sanitized DTO allowlist, no-store lifecycle routes]
key-files:
  created: []
  modified:
    - ../dragaocareca-admin-api/src/routes/episodes.routes.ts
    - ../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts
    - ../dragaocareca-admin-api/src/services/youtube-trailer-upload.provider.ts
    - ../dragaocareca-admin-api/src/database/repositories/youtube-trailer-job.repository.ts
    - ../dragaocareca-admin-api/src/docs/openapi.ts
requirements-completed: [YOUTUBE-01, YOUTUBE-02, YOUTUBE-03, YOUTUBE-04, YOUTUBE-05, OPS-01, OPS-02, OPS-03, OPS-04]
coverage:
  - id: D1
    description: "Authenticated metadata-bearing start, current lookup, retry, cancellation, private URL sanitization, and safe OpenAPI DTO."
    requirement: YOUTUBE-01
    verification:
      - kind: integration
        ref: "cd ../dragaocareca-admin-api && npm run verify:youtube-trailer-job-lifecycle"
        status: pass
    human_judgment: false
  - id: D2
    description: "Durable resumable worker/provider lifecycle with restart recovery, source replacement CAS, duplicate protection, and bounded retry."
    requirement: OPS-02
    verification:
      - kind: integration
        ref: "cd ../dragaocareca-admin-api && npm run build && npm run verify:youtube-trailer-job-lifecycle"
        status: pass
    human_judgment: false
  - id: D3
    description: "Frontend compatibility preserved through the required Angular production build."
    requirement: OPS-04
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: false
---

# Phase 8 Plan 1: YouTube Job Lifecycle Summary

**Durable authenticated YouTube trailer jobs now accept persisted title/summary metadata, recover the current source safely, reuse provider work on retry, and expose only an operator-safe private watch URL.**

## Performance

- **Duration:** approximately 12 min
- **Started:** 2026-08-12T01:13:00Z
- **Completed:** 2026-08-12T01:24:56Z
- **Tasks:** 2
- **Files modified:** 5 sibling API files

## Accomplishments

- Replaced the empty start-body contract with strict optional title/summary metadata, server-derived defaults, durable job input, and provider metadata handoff.
- Added authenticated current-source lookup and same-job retry while preserving source fingerprint, revision/lease CAS, resumable session, and accepted provider video evidence.
- Added nullable sanitized `privateWatchUrl`, normalized safe error categories, no-store route coverage, and OpenAPI documentation for lifecycle and API-owned publish idempotency.

## Task Commits

1. **Task 1: Lock the authenticated job contract and safe DTO** - `1e04402` (feat)
2. **Task 2: Harden durable recovery, idempotency, cancellation, and failure normalization** - `af0eb4d` (fix)

## Files Created/Modified

- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` - strict metadata start, current lookup, retry, auth, and no-store lifecycle routes.
- `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` - metadata persistence/provider handoff, current/retry service operations, safe DTO URL/category mapping.
- `../dragaocareca-admin-api/src/database/repositories/youtube-trailer-job.repository.ts` - durable metadata persistence while retaining active-source uniqueness and CAS transitions.
- `../dragaocareca-admin-api/src/services/youtube-trailer-upload.provider.ts` - private resumable session metadata handoff.
- `../dragaocareca-admin-api/src/docs/openapi.ts` - snapshot, start, current, retry, cancellation, and publish contract documentation.

## Decisions Made

- Reused the existing `metadata_snapshot_json` durable column for initial job title/summary input, avoiding a second schema or provider architecture while allowing later API-owned publication metadata reconciliation.
- Kept provider identifiers, sessions, source evidence, credentials, raw errors, and lease data persistence-only; only a validated private watch URL is mapped into the browser DTO.
- Kept publish as an API-owned route and added no Angular publish control.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added strict control-body validation and safe failure mapping**
- **Found during:** Task 1 and Task 2
- **Issue:** Expanding the start schema could accidentally permit metadata on retry/cancel, and persisted provider categories were not consistently operator-safe.
- **Fix:** Added a separate empty control-body schema for retry/cancel and normalized browser-visible error categories without exposing raw provider details.
- **Files modified:** `../dragaocareca-admin-api/src/routes/episodes.routes.ts`, `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts`
- **Verification:** lifecycle verifier and API build pass.
- **Committed in:** `1e04402`, `af0eb4d`

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Correctness and trust-boundary hardening only; no new package or provider architecture was introduced.

## Issues Encountered

- The sibling API contained unrelated pre-existing uncommitted work in overlapping files. It was preserved; only the plan-listed API files were staged for the two task commits.
- The Angular build completed with the repository’s existing selector-parser and bundle/style budget warnings. No build failure occurred.

## User Setup Required

None - provider credentials and OAuth readiness remain API deployment configuration, outside this plan’s automated offline verifier.

## Next Phase Readiness

The sibling API contract is ready for the planned backend coverage handoff and Angular wrapper/UI plans. Live YouTube OAuth/channel verification remains a release-time manual gate.

## Self-Check: PASSED

- Summary file exists.
- Task commits `1e04402` and `af0eb4d` exist in the sibling API checkout.
- Sibling API build and lifecycle verifier pass.
- Frontend `npm run build` passes with known warnings.

---
*Phase: 08-youtube-job-lifecycle*
*Completed: 2026-08-12*
