# Phase 4: Artifact Job Contract - Discussion Log

> **Audit trail only.** Decisions are captured in `04-CONTEXT.md`.

**Date:** 2026-07-29
**Phase:** 4-artifact-job-contract
**Areas discussed:** Job API shape, Progress semantics, Missing artifacts, Job lifecycle

---

## Job API shape

**User's choice:** Accepted the recommended three-endpoint contract.
**Notes:** Separate authenticated start, status, and completed-download endpoints.

## Progress semantics

**User's choice:** Accepted monotonic integer `0–100` progress with `pending`, `processing`, `completed`, and `failed` states.
**Notes:** Stage-based progress is sufficient; exact byte-level progress is not required.

## Missing artifacts

**User's choice:** Accepted partial ZIP behavior.
**Notes:** Create a ZIP when at least one requested artifact exists, report missing selectors, and reject no-artifact requests before job creation.

## Job lifecycle

**User's choice:** Accepted SQLite persistence, opaque job-specific paths, duplicate protection, failure cleanup, and short TTL retention.
**Notes:** Cancellation remains deferred.

## the agent's Discretion

- Exact SQLite table/repository shape.
- Concrete progress stage weights.
- Whether no available artifacts returns `404` or `422`, provided the behavior is consistent and tested.

## Deferred Ideas

- Job cancellation, multi-episode batch downloads, and download history.
