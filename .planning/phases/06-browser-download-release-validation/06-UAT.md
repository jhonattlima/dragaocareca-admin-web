---
status: partial
phase: 06-browser-download-release-validation
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md]
started: 2026-07-31T00:00:00Z
updated: 2026-07-31T15:15:00Z
---

## Current Test

[testing complete with live recovery gaps]

## Tests

### 1. Complete native artifact download
expected: The episode 334 modal prepares the archive, reaches Archive ready, and downloads one correctly named ZIP containing the selected artifacts.
result: pass — retained prior full-selection ZIP evidence; 06-04 did not re-stage the mismatched live fixture.

### 2. Recovery and retry behavior
expected: Empty, partial, failed, network/auth/expiry, reopen, reset, and same-job delivery retry states are understandable; retry does not create a second preparation job.
result: partial — focused Karma recovery tests pass; live harness passed empty-selection and focus/cleanup, but recorded partial/failure/auth/expiry/reopen/retry/reset/repeated-completion unsupported.

### 3. Release gates and cleanup
expected: The API CORS filename exposure, fixture restoration, build status, and object-URL cleanup are all acceptable for release.
result: partial — full Karma/build/dependency gates pass and cleanup is verified; complete live recovery acceptance remains blocked.

## Summary

total: 3
passed: 1
issues: 2
pending: 2
skipped: 0
blocked: 0

## Gaps

1. The live API row for ID 334 is currently DC 319 metadata and does not match the supplied DC334 source; no mutation was attempted.
2. A reversible verifier control or correctly staged completed job is required to run the remaining browser recovery matrix.
