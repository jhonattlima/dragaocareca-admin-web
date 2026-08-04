---
phase: 07
slug: final-trailer-video-upload
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-03
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for the local trailer-video upload lifecycle.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Karma 6 + Jasmine 4; Angular CLI 15 test target |
| **Config file** | `angular.json` |
| **Quick run command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Estimated runtime** | ~60 seconds; verify in the target environment |

## Sampling Rate

- **After every task commit:** Run the focused or full Karma suite for changed behavior.
- **After every plan wave:** Run the full Karma suite.
- **Before `$gsd-verify-work`:** Full suite and `npm run build` must be green.
- **Max feedback latency:** 60 seconds where ChromeHeadless is available.

## Per-Task Verification Map

The final task IDs are assigned by the phase planner; every task must map to one or more rows below.

| Task area | Requirement | Test Type | Automated Verification |
|-----------|-------------|-----------|------------------------|
| Draft reservation issuance | TRAILER-01, TRAILER-02, TRAILER-03 | backend contract/security | `POST /v1/episodes/drafts` issues opaque draftId; missing, expired, reused, mismatched, other-owner, and unreserved IDs are rejected |
| API staged upload contract | TRAILER-02, TRAILER-03 | backend contract/integration | New-ID staging, auth/ownership, MP4/size/missing-file errors, cancellation cleanup, and last-known-good preservation |
| API promotion lifecycle and Save consumption | TRAILER-03, TRAILER-04 | backend integration | Select-before-Save staged response, create with same episodeId/draftId, reservation consumption, final promotion, create failure rollback/retained retry state, and replacement rollback |
| API service/reservation wrappers | TRAILER-02, TRAILER-03 | Angular service unit | Exact draft reservation URL/DTO, trailer upload URL/header/multipart `file`, create draftId wiring, and progress-enabled event request |
| Trailer video card | TRAILER-01, TRAILER-05 | Angular component/template | Dedicated card, MP4 hint, selected/uploading/staged-promoting/finalized/failed/canceled states, no publish controls |
| Progress and terminal success | TRAILER-02, TRAILER-05 | Angular component unit | Byte progress is rendered; 100% transfer alone does not finalize; staged response and matching successful Save response transition state |
| Cancel/retry/replacement | TRAILER-03, TRAILER-04, TRAILER-05 | Angular component/DOM unit | Unsubscribe on cancel, retain selected file and prior final filename/asset while B uploads, retry same file, replacement generation ignores stale responses, and only matching B success replaces A |
| Reset/destroy teardown | TRAILER-03, TRAILER-04 | Angular component unit | Active upload is torn down and late events cannot mutate a new editor |

## Wave 0 Requirements

- [ ] Add focused Angular service/component tests for the rows above.
- [ ] Add sibling API contract tests for reservation issuance/ownership, pre-save staging, select-before-Save create consumption, and create/update trailer-video promotion.
- [ ] Confirm the available headless browser and adjust the command only if the project runner requires it.

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visible byte progress and cancel/retry interaction with a real MP4 | TRAILER-01..05 | Browser transport and filesystem timing are environment-dependent | Start the app and API, open New Episode File Management, confirm the draft reservation exists, choose a valid MP4 before Save, observe staged response, Save the same episode, verify finalized promotion, then cancel/retry/replace; verify the prior finalized video remains represented after a failed replacement. Confirm no YouTube controls appear. |

## Validation Sign-Off

- [ ] All tasks have automated verification or Wave 0 dependencies
- [ ] Sampling continuity has no three consecutive tasks without automated verification
- [ ] Wave 0 covers all missing test references
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set after validation
- [ ] Approval: pending
