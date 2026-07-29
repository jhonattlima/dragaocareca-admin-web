---
phase: 4
slug: artifact-job-contract
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-29
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Existing API verifier script; no API test runner is configured |
| **Config file** | `../dragaocareca-admin-api/package.json` |
| **Quick run command** | `cd ../dragaocareca-admin-api && npm run typecheck` |
| **Full suite command** | `cd ../dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads` |
| **Estimated runtime** | Under 60 seconds after the API fixture and build output are available |

## Sampling Rate

- **After every task commit:** Run `cd ../dragaocareca-admin-api && npm run typecheck`.
- **After every plan wave:** Run `cd ../dragaocareca-admin-api && npm run build && npm run verify:episode-artifact-downloads`.
- **Before `$gsd-verify-work`:** Full API verifier and frontend build must be green.
- **Max feedback latency:** 60 seconds.

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | API-01 | T-04-01 | Authenticated start accepts only canonical selectors and returns an opaque job ID. | API contract | `npm run verify:episode-artifact-downloads` | ✅ existing verifier, extend | ⬜ pending |
| 04-01-02 | 01 | 1 | API-02 | T-04-02 | Persisted lifecycle reports monotonic progress and terminal failure state. | API integration | `npm run verify:episode-artifact-downloads` | ❌ W0 seam needed | ⬜ pending |
| 04-01-03 | 01 | 1 | API-03 | T-04-03 | Status/download routes require auth and only completed jobs stream ZIPs. | API integration | `npm run verify:episode-artifact-downloads` | ✅ existing verifier, extend | ⬜ pending |
| 04-01-04 | 01 | 1 | API-04 | T-04-04 | Partial jobs report missing selectors and return a safe, deterministic ZIP filename. | API integration | `npm run verify:episode-artifact-downloads` | ✅ preflight fixture exists | ⬜ pending |
| 04-01-05 | 01 | 1 | API-05 | T-04-05 | Invalid selectors, paths, IDs, and job scope cannot read arbitrary files or reveal jobs. | API contract/security | `npm run verify:episode-artifact-downloads` | ✅ existing verifier, extend | ⬜ pending |
| 04-01-06 | 01 | 1 | VAL-04 | T-04-01..05 | Creation, transitions, completion, failure, missing artifacts, cleanup, and expiry all have evidence. | API verification | `npm run build && npm run verify:episode-artifact-downloads` | ❌ W0 fixtures/seams needed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

## Wave 0 Requirements

- [ ] `src/scripts/verify-episode-artifact-downloads.ts` in the sibling API — extend the existing verifier for async job lifecycle scenarios.
- [ ] Injectable/fake archive or worker seam — force deterministic failure and progress without timing-dependent tests.
- [ ] Artifact-job SQLite repository/schema fixtures — isolate jobs between verifier runs and test cleanup/expiry.
- [ ] OpenAPI definitions for start, status, and download operations — keep the published contract aligned with implementation.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DC 334 fixture provisioning and real ZIP contents | VAL-04 | The fixture is external to the current checkout and depends on local Windows media availability. | Provision the Season 3 DC 334 folder in the API media layout, start a job with all selectors, poll to completion, download the ZIP, and inspect entries against the selected files. |

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies.
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify.
- [ ] Wave 0 covers all missing references.
- [ ] No watch-mode flags.
- [ ] Feedback latency < 60s.
- [ ] `nyquist_compliant: true` set in frontmatter.

**Approval:** pending
