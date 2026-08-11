---
phase: 08
slug: youtube-job-lifecycle
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-11
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for the durable private YouTube trailer job.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Frontend framework** | Karma 6 + Jasmine 4 through Angular CLI 15 |
| **Frontend quick command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Frontend build command** | `npm run build` |
| **Backend build command** | `cd ../dragaocareca-admin-api && npm run build` |
| **Backend lifecycle command** | `cd ../dragaocareca-admin-api && npm run verify:youtube-trailer-job-lifecycle` |

## Sampling Rate

- **After each backend task:** run the focused lifecycle verifier and type/build check.
- **After each frontend task:** run focused Angular tests where the browser is available, then `npm run build`.
- **Before verification:** run the backend lifecycle verifier, both builds, and the available Angular suite.
- **Manual gate:** exercise metadata-bearing start → upload → processing → private-ready, reload/recovery, retry, cancellation before/after provider acceptance, retained-private URL/guidance, replacement staleness, safe error copy, and confirm no Angular publish control.

## Per-Task Verification Map

| Task area | Requirements | Test Type | Automated Verification |
|-----------|--------------|-----------|------------------------|
| Backend route/DTO contract | YOUTUBE-01, YOUTUBE-02, OPS-01 | API integration/security | Auth, no-store, metadata validation/storage/provider handoff, sanitized DTO/OpenAPI fields, safe private-link decision |
| Backend durable worker/recovery | YOUTUBE-02, YOUTUBE-04, OPS-02, OPS-03 | API fake-provider integration | Persistence, metadata/provider handoff, lease/CAS, restart recovery, range reconciliation, provider-ID reuse, active-source and publish idempotency, stale replacement obsolescence |
| Backend cancellation/failure normalization | YOUTUBE-05, OPS-04 | API integration/unit | Pre-acceptance local cancel, post-acceptance retained-private boundary, OAuth/quota/timeout/network categories, retry timestamps |
| Angular API wrappers | YOUTUBE-01..05 | service unit | Exact metadata start/status/current/retry/cancel URLs, auth boundary, typed snapshots/errors/privateWatchUrl |
| Angular job state/polling | YOUTUBE-03..05, OPS-02..03 | component unit | Backend-to-UI state mapping, determinate transfer/indeterminate processing, polling teardown, retry/cancel, reload/current-job recovery, stale generation guards |
| Operator presentation | YOUTUBE-01, YOUTUBE-03, YOUTUBE-05 | component/template + manual | Explicit metadata-bearing start action, truthful private-ready copy, actionable retry/cancel/reconciliation messaging, no Angular publish controls |

## Wave 0 Requirements

- [ ] Execute 08-00-PLAN.md backend RED verifier tests for title/summary job input, privateWatchUrl, retained-private cancellation, publish idempotency, and sensitive-field/log omission.
- [ ] Execute 08-00-PLAN.md Angular RED tests for metadata start, wrappers, state mapping, polling teardown, reload recovery, retry, cancellation boundaries, and source-generation guards.
- [ ] Confirm Wave 0 fails before implementation and becomes green after Plans 01-04.
- [ ] Confirm a permitted ChromeHeadless runner or record the environment limitation without treating compilation as assertion success.

## Manual-Only Verifications

| Behavior | Requirements | Why Manual | Test Instructions |
|----------|--------------|------------|-------------------|
| Authenticated operator flow reaches private readiness | YOUTUBE-01..03 | Requires configured YouTube OAuth/channel and provider processing | Start with title and summary for a finalized trailer, observe transfer and processing states, reload, and confirm private-ready plus sanitized privateWatchUrl without Angular publish controls. |
| Accepted-provider cancellation and recovery copy | YOUTUBE-05, OPS-04 | Provider acceptance boundary cannot be fully simulated in the browser | Cancel before and after provider acceptance; confirm local cancellation versus provider-video-retained/reconciliation-required status, URL when known, and guidance without deletion/publication. |

## Validation Sign-Off

- [ ] All tasks have automated verification or Wave 0 dependencies
- [ ] Sampling continuity has no three consecutive tasks without automated verification
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set after validation
- [ ] Approval: pending
