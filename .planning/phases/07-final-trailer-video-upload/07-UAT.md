---
status: testing
phase: 07-final-trailer-video-upload
source:
  - 07-01-SUMMARY.md
  - 07-02-SUMMARY.md
  - 07-03-SUMMARY.md
started: 2026-08-04T19:10:00-03:00
updated: 2026-08-04T19:10:00-03:00
---

## Current Test

number: 1
name: Trailer video upload lifecycle
expected: |
  In New Episode > File Management, selecting a valid MP4 immediately shows the Trailer video card, selected filename, and byte-level progress. Cancel keeps the file retryable; retry and replacement work without losing the previous finalized filename. Saving the episode finalizes the staged video. Existing episodes use the same replacement flow without requiring a new-episode draft reservation.
awaiting: user response

## Tests

### 1. Authenticated opaque draft reservation and owner/episode binding
expected: Backend lifecycle verifier passes reservation, ownership, and episode binding checks.
result: pass
source: automated
coverage_id: D1

### 2. Immediate staging, Save promotion, canonical filename, and rollback-safe replacement
expected: Backend lifecycle and artifact verifiers pass staging, create promotion, canonical finalized media, and failure-preservation checks.
result: pass
source: automated
coverage_id: D2

### 3. Lifecycle validation, cleanup, expiry, and no-YouTube boundary
expected: API build and lifecycle verifier pass validation, cleanup, expiry, rollback, and no-provider-action checks.
result: pass
source: automated
coverage_id: D3

### 4. Canonical documentation contract
expected: Project docs describe draft reservation, staged upload, Save promotion, ownership, rollback, cleanup, and authBypass behavior.
result: pass
source: automated
coverage_id: D1-docs

### 5. Trailer video upload UI lifecycle
expected: |
  In New Episode > File Management, choose a valid MP4. The dedicated Trailer video card shows the filename and upload percentage. Cancel leaves the selected file available for retry; retry reuses it; selecting another file starts a replacement while the prior finalized filename remains represented until the new response succeeds. Saving promotes a staged new-episode upload.
result: pending

### 6. Persisted episode replacement and ordinary create compatibility
expected: |
  In an existing episode, selecting a replacement MP4 uploads through the persisted trailer replacement path and does not request a new-episode draft reservation. Creating an episode without selecting a trailer still succeeds normally.
result: pending

### 7. Angular test execution and real-MP4 browser recovery
expected: |
  The Angular Karma suites execute their Jasmine assertions, and a real MP4 run confirms progress, cancel, retry, replacement, and last-known-good preservation.
result: pending

## Summary

total: 7
passed: 4
issues: 0
pending: 3
skipped: 0

## Gaps

none yet
