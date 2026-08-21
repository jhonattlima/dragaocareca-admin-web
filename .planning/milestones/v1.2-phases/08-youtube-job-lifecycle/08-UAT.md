---
status: complete
phase: 08-youtube-job-lifecycle
source:
  - 08-01-SUMMARY.md
  - 08-02-SUMMARY.md
  - 08-03-SUMMARY.md
  - 08-04-SUMMARY.md
started: 2026-08-12T02:00:00Z
updated: 2026-08-21T11:35:00-03:00
---

## Current Test

number: 1
name: Start and recover a draft YouTube job
expected: |
  In New Episode > File Management, upload a valid trailer MP4. After staging completes, the private YouTube job starts automatically, the private link fills the YouTube field, and the same job survives saving/reloading without creating a duplicate.
awaiting: none

## Tests

### 1. Start and recover a YouTube job
expected: Uploading a trailer to a new episode starts one current private job from the staged draft; polling, Save, page reload, and API restart restore that same job.
result: pass
notes: User validated trailer upload, private YouTube creation, private-ready state, and private watch link in the running workflow.

### 2. Display transfer, processing, and private-ready states
expected: The lifecycle card shows byte-based percentage during transfer, honest indeterminate progress during provider processing, and a private-ready/not-published state with a sanitized watch link when available.
result: pass

### 3. Retry, cancel, and replace the trailer safely
expected: Retry resumes the same job; cancellation distinguishes local cancellation from retained private provider work; replacing the trailer prevents late responses from the old job from changing the new trailer state.
result: pass

### 4. Present safe recoverable failures
expected: Authentication, quota, timeout, network/provider, invalid-trailer, and reconciliation failures show normalized categories and bounded guidance without exposing credentials, provider sessions, filesystem paths, raw payloads, or stack traces.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Resolution

The Save/publication checkpoint was completed by the later operator-workflow integration UAT and current source/API lifecycle evidence. The user's accepted runtime validation covers private-ready upload, link population, and the Save-time publication boundary. ChromeHeadless and live provider-error replay remain environment limitations, not open UAT scenarios.
