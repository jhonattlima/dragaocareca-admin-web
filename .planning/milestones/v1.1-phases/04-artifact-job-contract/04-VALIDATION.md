---
phase: 4
slug: artifact-job-contract
status: planning
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-29
---

# Phase 4 — Validation Strategy

> Planning validation contract for feedback sampling during execution. Requirement ownership is authoritative in the `Owner` column; later verifier rows are regression evidence only. All API tasks require the writable sibling-checkout prerequisite stated in their plan.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing API verifier script; no API test runner is configured |
| **Config file** | `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/package.json` |
| **Quick run command** | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck` |
| **Full suite command** | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads` |
| **Estimated runtime** | Under 60 seconds after the isolated verifier fixtures and build output are available |

## Sampling Rate

- **After every task commit:** Run `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck`.
- **After every plan wave:** Run `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads`.
- **Before `$gsd-verify-work`:** Full API verifier and frontend build must be green.
- **Max feedback latency:** 60 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Owner | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 04-01 | 0 | — | T-04-01-02, T-04-01-03 | SQLite schema/repository, isolated fixtures, and failure-hook scaffold establish lifecycle prerequisites; this task is prerequisite/regression-only and does not own API-02. | Repository prerequisite integration | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ verifier scaffold owned by 04-01 | ⬜ pending |
| 04-01-02 | 04-01 | 0 | API-02 | T-04-01-02, T-04-01-03, T-04-01-04 | Persisted worker lifecycle has exactly four states, bounded monotonic progress, deterministic stage barriers, duplicate-key lookup, restart-safe rows, and deterministic failure cleanup. | Worker/service integration | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ lifecycle files and verifier controller contract | ⬜ pending |
| 04-02-01 | 04-02 | 1 | API-01 | T-04-01-01, T-04-01-02 | Authenticated start route accepts one episode and canonical selectors, coalesces identical active requests, and returns a public snapshot. | Route contract integration | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ route verifier target | ⬜ pending |
| 04-02-02 | 04-02 | 1 | API-03 | T-04-01-02 | Authenticated download route streams only completed jobs with safe headers and episode/job scope. | Route contract integration | `cd /home/jhonatt/repos/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ route verifier target | ⬜ pending |
| 04-02-03 | 04-02 | 1 | API-04 | T-04-01-01, T-04-01-04 | Partial reporting preserves requested/available/missing selectors, safe filename, and no-artifact `404`. | Route contract integration | `cd /home/jhonatt/repos/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ route verifier target | ⬜ pending |
| 04-02-04 | 04-02 | 1 | API-05 | T-04-01-01, T-04-01-04 | Selector validation rejects paths, filenames, unknown values, and invalid episode/job scope. | Route contract integration | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ route verifier target | ⬜ pending |
| 04-02-05 | 04-02 | 1 | — | T-04-01-02 | Route-level no-store and error behavior remain regression evidence for the four API contract requirements. | Route regression | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads` | ✅ route verifier target | ⬜ pending |
| 04-02-06 | 04-02 | 1 | — | T-04-01-02 | OpenAPI paths, schemas, security, binary response, and documented errors match the route contract as regression evidence. | OpenAPI/runtime regression | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build` | ✅ OpenAPI file | ⬜ pending |
| 04-03-01 | 04-03 | 2 | VAL-04 | T-04-03-01..05 | Full lifecycle, failure, cleanup, partial, duplicate, restart, expiry, auth, ownership, traversal, and OpenAPI evidence passes. | API verification | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads` | ✅ verifier | ⬜ pending |
| 04-03-02 | 04-03 | 2 | — | T-04-03-01..05 | Repository/path-scope and frontend-build checks are regression evidence, not additional requirement ownership. | Cross-repository regression | `cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api && npm run typecheck && npm run build && npm run verify:episode-artifact-downloads && cd /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web && npm run build` | ✅ both repositories | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Prerequisites

Wave 0 covers only Plan 04-01’s lifecycle prerequisites and API-02 ownership. Route contract assertions belong to Wave 1, and full verifier/OpenAPI parity belongs to Wave 2:

- [x] `src/scripts/verify-episode-artifact-downloads.ts` — 04-01 creates only the isolated verifier/reset scaffold and lifecycle-controller contract.
- [x] Injectable/fake archive or worker seam — 04-01 owns deterministic lifecycle stage and failure control; route assertions wait for Wave 1.
- [x] Artifact-job SQLite repository/schema fixtures — 04-01 owns isolated schema, rows, job roots, and cleanup fixtures.
- [x] Sibling API path — all commands use `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api`.

DC 334 Season 3 fixture provisioning is explicitly a Phase 6/manual prerequisite, not a missing Wave 0 reference. Phase 4 uses isolated verifier fixtures for VAL-04 contract evidence.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DC 334 fixture provisioning and real ZIP contents | VAL-04 handoff to Phase 6 | The fixture is external to the current checkout and depends on local media availability; provisioning is explicitly deferred to Phase 6/manual setup. | In Phase 6, provision the Season 3 DC 334 folder in the API media layout, start a job with all selectors, poll to completion, download the ZIP, and inspect entries against selected available files. |

## Validation Sign-Off

- [x] All planned tasks have an automated verify command.
- [x] Sampling continuity: no 3 consecutive tasks without automated verify.
- [x] Wave 0 owns only lifecycle prerequisites and API-02; Wave 1 owns route contract checks; Wave 2 owns full verifier/OpenAPI parity.
- [x] No watch-mode flags.
- [x] Feedback latency < 60s.
- [x] `nyquist_compliant: true` and `wave_0_complete: true` are set in frontmatter.

**Approval:** planning contract compliant; execution pending.
