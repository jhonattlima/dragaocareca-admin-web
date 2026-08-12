---
status: testing
phase: 08-youtube-job-lifecycle
source:
  - 08-01-SUMMARY.md
  - 08-02-SUMMARY.md
  - 08-03-SUMMARY.md
  - 08-04-SUMMARY.md
started: 2026-08-12T02:00:00Z
updated: 2026-08-12T02:00:00Z
---

## Current Test

number: 1
name: Start and recover a draft YouTube job
expected: |
  In New Episode > File Management, upload a valid trailer MP4. After staging completes, the private YouTube job starts automatically, the private link fills the YouTube field, and the same job survives saving/reloading without creating a duplicate.
awaiting: user response

## Tests

### 1. Start and recover a YouTube job
expected: Uploading a trailer to a new episode starts one current private job from the staged draft; polling, Save, page reload, and API restart restore that same job.
result: pending

### 2. Display transfer, processing, and private-ready states
expected: The lifecycle card shows byte-based percentage during transfer, honest indeterminate progress during provider processing, and a private-ready/not-published state with a sanitized watch link when available.
result: pending

### 3. Retry, cancel, and replace the trailer safely
expected: Retry resumes the same job; cancellation distinguishes local cancellation from retained private provider work; replacing the trailer prevents late responses from the old job from changing the new trailer state.
result: pending

### 4. Present safe recoverable failures
expected: Authentication, quota, timeout, network/provider, invalid-trailer, and reconciliation failures show normalized categories and bounded guidance without exposing credentials, provider sessions, filesystem paths, raw payloads, or stack traces.
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps

none yet
