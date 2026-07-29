---
phase: 04-artifact-job-contract
verified: 2026-07-29T20:34:48Z
status: human_needed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
deferred:
  - truth: "A real DC 334 Season 3 fixture produces a manually inspected ZIP whose contents match the selected available artifacts."
    addressed_in: "Phase 6"
    evidence: "ROADMAP Phase 6 success criterion 4 and 04-VALIDATION.md manual-only verification explicitly defer DC 334 fixture provisioning/content inspection."
human_verification:
  - test: "Provision the real DC 334 Season 3 episode folder in the API media layout, start an authenticated job with the intended selectors, poll it to completion, download the ZIP, and inspect its entries against the selected available files."
    expected: "The ZIP opens successfully, contains exactly the selected available canonical artifacts with the expected catalog-derived entry names, and the UI/API-visible missing-artifact result matches any unavailable selections."
    why_human: "The Phase 4 verifier uses isolated synthetic fixtures and only records DC 334 as a Phase 6 prerequisite; it cannot prove the external/local Season 3 media fixture exists or that its real contents match the expected release fixture."
---

# Phase 4: Artifact Job Contract Verification Report

**Phase Goal:** Operators can request a validated artifact ZIP job and observe a reliable backend contract from creation through authenticated completion.
**Verified:** 2026-07-29T20:34:48Z
**Status:** HUMAN VERIFICATION NEEDED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A request for one episode and selected canonical artifact keys creates a job without accepting filenames or filesystem paths. | ✓ VERIFIED | Compiled API verifier passes strict JSON/Zod validation, canonical catalog normalization, invalid selector/path rejection, unknown episode/no-artifact rejection before row creation, and direct-router authenticated start. `POST /v1/episodes/:episodeId/artifacts/jobs` calls `parseEpisodeArtifactSelectors` and never accepts a client path. |
| 2 | The job exposes pending, processing, completed, and failed states with percentage progress the client can consume. | ✓ VERIFIED | SQLite schema constrains the exact four states and progress to integer 0..100. The verifier releases named lifecycle barriers, captures pending=0, processing stage snapshots with nondecreasing progress, completed=100, and a persisted failed snapshot with a sanitized nonempty error. |
| 3 | After completion, an authenticated request returns the ZIP with a safe filename and identifies requested artifacts omitted because they were unavailable. | ✓ VERIFIED | Verifier completes a full and a partial job, inspects ZIP entries, asserts `application/zip`, `Content-Disposition: attachment; filename="episode-987654321-artifacts.zip"`, `X-Missing-Artifacts: trailer`, and `Cache-Control: no-store`. Download revalidates completed state, job scope, expected server-derived path, and regular-file existence. |
| 4 | API verification demonstrates job creation, progress transitions, completion, failure, missing artifacts, and invalid selector/path rejection. | ✓ VERIFIED | `npm run verify:episode-artifact-downloads` passed in the sibling API checkout and reported lifecycle, progress, partial/failure cleanup, duplicate/restart/expiry, auth/ownership, traversal, and OpenAPI parity. |
| 5 | Authenticated status and download operations preserve episode/job ownership and do not leak internal metadata. | ✓ VERIFIED | Direct-router verifier proves unauthenticated start/status/download return 401 before lookup, mismatched and unknown jobs return the same 404, and public snapshots/logs contain no archive paths, storage roots, cache keys, manifests, or raw filesystem fields. |
| 6 | The documented OpenAPI contract matches the runtime three-operation contract. | ✓ VERIFIED | Verifier asserts exact start/status/download paths, bearer security, selector enum, four-state snapshot, integer progress bounds, no-store headers, binary ZIP response, safe download headers, and documented 400/401/404/409 responses. |

**Score:** 6/6 truths verified (0 present-but-behavior-unverified)

## Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/sqlite.ts` | Durable `artifact_jobs` schema and lifecycle indexes | ✓ VERIFIED | Substantive schema has opaque job ID, episode/selector snapshots, four-state/progress constraints, job-scoped path metadata, timestamps, and active/FIFO/episode-job indexes. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/database/repositories/artifact-job.repository.ts` | Typed parameterized SQLite lifecycle boundary | ✓ VERIFIED | CRUD, active/completed lookup, FIFO pending selection, guarded transitions, monotonic progress update, completion/failure, processing recovery, and expiry cleanup are implemented. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts` | Persisted worker processor, stage controller, cleanup, retention, and safe download validation | ✓ VERIFIED | Uses repository state, canonical preflight, 25/65/10 stage progress, atomic rename, 45-minute expiry, failure injection, restart cleanup, duplicate creation guard, and server-derived archive paths. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/workers/episode-artifact-preparation.worker.ts` | Serialized restart-safe worker | ✓ VERIFIED | Starts recovery/TTL cleanup and serialized pending processing, with overlap guard and polling. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/routes/episodes.routes.ts` | Authenticated start/status/download operations | ✓ VERIFIED | Exact three routes exist; no-store middleware precedes auth/validation; route handlers enforce status, scope, headers, and binary delivery. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/docs/openapi.ts` | Runtime-parity OpenAPI contract | ✓ VERIFIED | Exact routes and schemas/errors/security/header/binary definitions are present and asserted by the verifier. |
| `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/src/scripts/verify-episode-artifact-downloads.ts` | Deterministic cross-contract verifier | ✓ VERIFIED | Direct-router MemoryResponse tests exercise success, partial, failure, cleanup, duplicate, recovery, expiry, auth, ownership, traversal, disclosure, and OpenAPI parity. |

## Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `episodes.routes.ts` | `episode-artifact-preparation.service.ts` | Authenticated handlers call preflight/create/status/validated-download exports | ✓ WIRED | Imports and calls are present in the three exact route handlers; direct-router verifier invokes each stack. |
| `episodes.routes.ts` | `requireAuth` | Middleware on start/status/download | ✓ WIRED | All three routes include `noStoreArtifactPreparation, requireAuth`; verifier proves 401 behavior with bypass disabled. |
| `episode-artifact-preparation.service.ts` | `artifact-job.repository.ts` | All persisted lifecycle reads/writes use repository methods | ✓ WIRED | Service imports repository and uses create/find/transition/progress/complete/fail/recovery/expiry methods; no JSON manifest state path remains. |
| `episode-artifact-preparation.service.ts` | `episode-artifact-download.service.ts` | Canonical selector parser and preflight supply archive candidates | ✓ WIRED | Both job creation and worker processing use the canonical parser/preflight; verifier asserts canonical entry names and path rejection. |
| `episode-artifact-preparation.worker.ts` | `server.ts` | Startup worker registration honoring `DISABLE_BACKGROUND_WORKERS` | ✓ WIRED | Server starts the artifact worker only in the enabled worker branch; worker owns recovery and polling. |
| `verify-episode-artifact-downloads.ts` | route/service/OpenAPI | Direct route-stack calls plus service barriers and schema assertions | ✓ WIRED | Verifier source contains direct route lookup, stage release/capture, fixture reset, and OpenAPI runtime assertions. |

## Data-Flow Trace (Level 4)

| Artifact | Data variable | Source | Produces real data | Status |
|---|---|---|---|---|
| Start/status routes | Public job snapshot | SQLite `artifact_jobs` row mapped by repository/service | Yes; verifier observes persisted pending/processing/completed/failed rows across calls | ✓ FLOWING |
| Worker archive | Available artifact entries | Canonical preflight resolves episode media files, then snapshots are archived with catalog entry names | Yes; verifier writes isolated audio/transcript fixtures and inspects resulting ZIP central-directory names | ✓ FLOWING |
| Download route | ZIP stream and missing-artifact header | Validated completed job plus server-derived regular archive path | Yes; verifier receives nonempty ZIP bytes and partial `X-Missing-Artifacts` | ✓ FLOWING |

## Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| API type safety | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck` | Exit 0 | ✓ PASS |
| API build and compiled contract verifier | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads` | Exit 0; verifier reports lifecycle/progress/cleanup/security/OpenAPI parity | ✓ PASS |
| Frontend regression build | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web && npm run build` | Exit 0; only existing Angular selector/budget warnings | ✓ PASS |

The initial API build attempt in the restricted sandbox failed only because the sibling checkout’s `dist` was mounted `EROFS`; rerunning the exact recorded command with the plan-required writable API access passed. This is not a source failure.

## Probe Execution

| Probe | Command | Result | Status |
|---|---|---|---|
| `scripts/*/tests/probe-*.sh` | Probe discovery | No phase-declared or conventional probe scripts found; the phase uses the compiled npm verifier instead | ? SKIP — not applicable |

## Requirements Coverage

| Requirement | Source plan | Description | Status | Evidence |
|---|---|---|---|---|
| API-01 | 04-02 | Start one-episode ZIP job with selected artifact keys | ✓ SATISFIED | Authenticated direct-router POST, canonical normalization, duplicate coalescing, and public snapshot assertions pass. |
| API-02 | 04-01 | Report progress percentage with pending/processing/completed/failed states | ✓ SATISFIED | SQLite constraints, persisted worker transitions, deterministic stage barrier, monotonic progress, recovery, and failure assertions pass. |
| API-03 | 04-02 | Authenticated completed ZIP download | ✓ SATISFIED | Auth middleware and completed-only binary download verifier pass. |
| API-04 | 04-02 | Safe filename and unavailable-artifact reporting | ✓ SATISFIED | Safe server filename, requested/available/missing snapshots, and missing-artifact header/ZIP assertions pass. |
| API-05 | 04-02 | Canonical selector validation and rejection of arbitrary paths | ✓ SATISFIED | Invalid selectors, filenames, traversal paths, internal kinds, malformed bodies, and no-artifact requests are rejected. |
| VAL-04 | 04-03 | Verify creation, progress, completion, failure, and missing artifacts | ✓ SATISFIED | Compiled verifier passes the full lifecycle and security matrix; real DC 334 content remains a Phase 6 manual prerequisite. |

No Phase 4 requirement mapped in `REQUIREMENTS.md` is orphaned from the plans.

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| — | — | No unreferenced `TBD`, `FIXME`, or `XXX` markers; no placeholder implementation or empty user-visible data path found in modified API files | None | No blocker identified |

## Human Verification Required

### DC 334 Season 3 real-fixture ZIP inspection

**Test:** Provision the real DC 334 Season 3 fixture in the sibling API media layout, request the intended canonical artifact set with authenticated routes, poll to `completed`, download the ZIP, and inspect its contents.

**Expected:** The archive opens and contains exactly the selected available artifacts under the expected `episode-334/<canonical-file>` entry names; any unavailable requested selectors are reported consistently in the snapshot/header.

**Why human:** The automated verifier intentionally uses isolated synthetic fixtures and only records `{ episodeId: 334, status: "manual-phase-6-prerequisite" }`; it does not inspect the external/local DC 334 media contents. This validation is explicitly scheduled for Phase 6.

## Gaps Summary

No automated gaps found. The backend contract is implemented and behaviorally verified across the required lifecycle, security, path-safety, partial-artifact, duplicate/restart/expiry, and OpenAPI cases. Phase 4 remains `human_needed` solely because real DC 334 fixture provisioning and ZIP-content inspection cannot be established from this codebase and is explicitly deferred to Phase 6.

---

_Verified: 2026-07-29T20:34:48Z_  
_Verifier: the agent (gsd-verifier)_
