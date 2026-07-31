# Phase 4 Contract Coverage

This matrix is the cross-repository REST integration gate for the artifact-job contract. The API repository owns implementation and verification; the web repository remains documentation-only in Phase 4. Each requirement has exactly one authoritative executable owner. Additional plan tasks are regression evidence only.

| Contract area | Decision / requirement | Authoritative owner | Regression evidence | Integration status | Verification evidence |
|---|---|---|---|---|---|
| Start job | D-01, D-02, D-04; API-01 | 04-02 Task 1 | 04-03 Task 1 | INTEGRATE | Direct-router POST with JSON body, 202 Location, public snapshot, duplicate active coalescing |
| Status polling | D-01, D-03, D-04, D-05, D-06; API-02 | 04-01 Task 2 | 04-01 Task 1; 04-03 Task 1 | INTEGRATE | Task 2 owns the full persisted lifecycle and deterministic stage barrier; Task 1 is prerequisite/regression-only |
| Completed download | D-01, D-03, D-07; API-03 | 04-02 Task 1 | 04-03 Task 1 | INTEGRATE | Authenticated binary route, finalization-before-completion, ZIP entry inspection, stream error handling |
| Selector validation | D-02, D-11; API-05 | 04-02 Task 1 | 04-03 Task 1 | INTEGRATE | Zod JSON array plus canonical parser rejects paths, filenames, internal kinds, empty and unknown selectors |
| Partial/missing reporting | D-08, D-09, D-10; API-04 | 04-02 Task 1 | 04-03 Task 1 | INTEGRATE | Preflight snapshot, partial ZIP, status fields, safe filename, X-Missing-Artifacts, no-row no-artifact `404` |
| Lifecycle/failure/retention | D-05, D-06, D-07, D-13, D-15 | 04-01 Task 2 | 04-01 Task 1; 04-03 Tasks 1–2 | INTEGRATE | Failure hook, cleanup assertions, exactly 45-minute TTL expiry, opaque job-specific paths, SQLite transitions |
| Authentication and error behavior | D-01, D-03, D-10, D-14; API-01–API-05 | 04-02 Task 1 | 04-03 Tasks 1–2 | INTEGRATE | 401 start/status/download, 404 unknown/mismatch/expired, 409 non-ready, active duplicate protection, no-store |

## Source Audit

| Source | ID | Feature / constraint | Authoritative plan/task | Regression evidence | Status | Notes |
|---|---|---|---|---|---|---|
| GOAL | — | Operators can request a validated artifact ZIP job and observe a reliable backend contract through authenticated completion | 04-01 through 04-03 | 04-03 Task 1 | COVERED | Durable lifecycle, routes, download, and verifier are planned |
| REQ | API-01 | Start one-episode ZIP job with selected artifact keys | 04-02 Task 1 | 04-03 Task 1 | COVERED | Exact POST route and JSON selectors |
| REQ | API-02 | Progress percentage and four states | 04-01 Task 2 | 04-01 Task 1; 04-03 Task 1 | COVERED | Task 2 owns the full persisted lifecycle, deterministic stage barrier, and worker progress assertions; Task 1 is prerequisite/regression-only |
| REQ | API-03 | Authenticated completed ZIP | 04-02 Task 1 | 04-03 Task 1 | COVERED | Download route and ZIP verifier |
| REQ | API-04 | Safe filename and unavailable artifact reporting | 04-02 Task 1 | 04-03 Task 1 | COVERED | Snapshot, header, and archive checks |
| REQ | API-05 | Selector validation and no arbitrary paths | 04-02 Task 1 | 04-03 Task 1 | COVERED | Canonical catalog boundary and hostile inputs |
| REQ | VAL-04 | Lifecycle/failure/missing verification | 04-03 Task 1 | 04-03 Task 2 | COVERED | Full compiled verifier |
| RESEARCH | R-01 | Reuse existing selector/preflight, archiver, auth, Zod, SQLite, and worker patterns | 04-01 Task 1; 04-01 Task 2; 04-02 Task 1; 04-03 Task 1 | 04-02 Task 2; 04-03 Task 2 | COVERED | Concrete analogs cited in every plan’s actions |
| RESEARCH | R-02 | Replace synchronous/file-manifest assumptions with persisted async jobs | 04-01 Task 2 | 04-03 Task 1 | COVERED | SQLite repository and worker conversion |
| RESEARCH | R-03 | Job-specific paths, atomic finalize, cleanup, 45-minute retention | 04-01 Task 2 | 04-03 Tasks 1–2 | COVERED | Explicit stage and cleanup assertions |
| RESEARCH | R-04 | OpenAPI and compiled direct-router verification | 04-02 Task 2 | 04-03 Tasks 1–2 | COVERED | Runtime/schema parity |
| CONTEXT | D-01–D-04 | Separate authenticated start/status/download and public job snapshot | 04-02 Task 1 | 04-03 Task 1 | COVERED | Exact endpoints and schema |
| CONTEXT | D-05–D-07 | Four states, monotonic 0..100 progress, completion after finalization | 04-01 Task 2 | 04-03 Task 1 | COVERED | Worker and verifier |
| CONTEXT | D-08–D-11 | Preflight snapshot, partial/no-artifact behavior, canonical path boundary | 04-02 Task 1 | 04-03 Task 1 | COVERED | Selected no-artifact response is `404` |
| CONTEXT | D-12–D-16 | SQLite, opaque paths, duplicate protection, exactly 45-minute cleanup/TTL, no cancellation | 04-01 Task 1; 04-01 Task 2 | 04-03 Tasks 1–2 | COVERED | Cancellation remains excluded per decision; fixture provisioning is Phase 6/manual |

No items are opted out. UI modal, browser Blob delivery, and DC 334 manual fixture provisioning remain scoped to Phases 5–6 as explicitly excluded from Phase 4.
