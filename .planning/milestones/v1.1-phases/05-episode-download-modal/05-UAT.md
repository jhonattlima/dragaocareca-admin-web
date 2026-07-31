---
status: complete
phase: 05-episode-download-modal
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-07-31T03:30:00-03:00
updated: 2026-07-31T04:00:00-03:00
---

## Current Test

[testing complete]

## Tests

### 1. ApiService provides the five-selector union, typed job snapshot, and start/status methods
expected: The Angular API service contains the closed five-selector contract and start/status methods.
result: pass
source: automated
coverage_id: D1

### 2. ManageComponent maps the five episode filename fields to ordered canonical artifact options with disabled unavailable choices and per-episode retained state
expected: Source inspection confirms fixed selector mapping, filename-based availability, and retained per-episode state.
result: pass
source: automated
coverage_id: D1

### 3. Open the artifact picker from an episode row
expected: In the Episodes tab, each persisted episode row has a dedicated Downloads icon in its own column. Activating it opens a labeled artifact-selection modal for that episode without changing the Add episode tab.
result: pass

### 4. Review artifact choices and defaults
expected: The modal shows Episode audio, Trailer, Cover art, Low cover art (.webp), and Transcript in that order. Available files are checked; unavailable files remain visible, disabled, unchecked, and labeled “Unavailable — file not uploaded.”
result: pass

### 5. Confirm a ZIP job and observe progress
expected: After confirming selected files, the modal shows its own progress bar below the artifact list, updates stage text and percentage while polling, prevents a second submission, and reaches “Archive ready” for a completed job.
result: pass

### 6. Verify keyboard focus and modal recovery
expected: Keyboard activation opens the dialog with focus inside, Tab and Shift+Tab stay trapped, Escape closes it and restores focus to the Downloads button, and closing/reopening an active job resumes its state.
result: pass

### 7. Verify partial, empty, failure, and retry states
expected: Missing artifacts produce a clear in-modal warning; no available files disables confirmation; failed jobs preserve selections and offer Retry/Close; retry starts only after the previous job is terminal.
result: pass

### 8. Verify canonical API submission and duplicate protection
expected: The UI submits only canonical selectors, never filenames or paths, and rapid confirmation before the first response produces exactly one job-start request.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

<!-- YAML format for plan-phase --gaps consumption -->
