# Phase 8 YouTube/API Capability Coverage

This coverage record resolves the provider/API gate for Phase 8. It preserves the locked private-first boundary and identifies later-phase ownership explicitly.

| Capability | Decision | Evidence / test owner | Scope disposition |
|---|---|---|---|
| Authenticated explicit start | `POST .../youtube-trailer-jobs`, validated `{title, summary}` body, canonical finalized source | API route/OpenAPI and lifecycle verifier; Angular ApiService spec | Covered in Phase 8 per D-01, D-08, D-11 |
| YOUTUBE-01 title/summary wording | Phase 8 accepts the current operator-supplied or derived title and summary in the start payload, persists them as job input, and passes them to the provider. Phase 9 owns richer title authoring/validation. | Route/service/OpenAPI and verifier contract test | Covered literally in Phase 8; richer authoring belongs to Phase 9 |
| Reload/current-job recovery | Authenticated `GET .../youtube-trailer-jobs/current` returns the current non-obsolete source job | Repository/service/route verifier and Angular reload test | Covered in Phase 8 per D-07 |
| Resumable private upload | Existing API provider/worker/session/range reconciliation is retained | Worker/provider fake-provider verifier | Covered in Phase 8 per D-03, D-04 |
| Processing and private readiness | Provider privacy/upload/processing checks determine `ready`; UI maps it to `private-ready` | Service DTO/OpenAPI, Manage tests/manual check | Covered in Phase 8; never public/published |
| YOUTUBE-02 private watch link | Add nullable `privateWatchUrl` once the provider video is available; no `providerVideoId` field is exposed | DTO/OpenAPI omission and URL assertions; Angular DTO/template tests | Covered literally in Phase 8; broader link/publishing UI remains Phase 9/10 |
| Same-job retry | Retry route preserves row, session URI, and provider video evidence; no new provider upload is created | Repository/service/route verifier | Covered in Phase 8 per D-04, D-08 |
| OPS-03 API publish idempotency | Existing API-owned publish route remains; repeated publish requests converge safely. Angular publish controls remain outside Phase 8. | Existing publish route and lifecycle verifier | Covered API contract in Phase 8; Angular publication integration belongs to Phase 9/10 |
| Cancellation boundary | Before acceptance: `local-cancelled`; after accepted bytes/video: `provider-video-retained` / reconciliation-required with sanitized privateWatchUrl when known; status/link/guidance only, no automatic deletion/publication | Provider fake scenarios and Manage tests/manual check | Covered in Phase 8 per D-05/D-06 |
| Source identity and stale protection | SHA-256/bytes/relative filename plus revision/lease CAS; browser source generation/job guards | Repository/worker verifier and Manage tests | Covered in Phase 8 per D-09 and OPS-02/03 |
| API restart recovery | Startup recovery and worker single-run guard reclaim persisted interrupted jobs | Worker/repository verifier | Covered in Phase 8 per D-07 |
| Error normalization | Authentication/OAuth, quota, timeout, network/provider, invalid trailer, session-expired, and reconciliation categories are bounded and retry-aware | Provider/service fake fixtures and DTO/log verifier | Covered in Phase 8 per D-10/D-12 and OPS-04 |
| Credential/session/source/log safety | API-only credentials; DTO/log allowlist omits OAuth, raw payloads, paths, stacks, sessions, provider IDs, and raw messages/reasons | Verifier log/DTO/OpenAPI assertions | Covered in Phase 8 per D-11 and OPS-01 |
| Browser OAuth/direct YouTube calls | Not permitted; Angular only calls authenticated sibling API | Architecture tests/review boundary | Explicit opt-out: Phase 8 security boundary |
| Angular publish controls | No Angular Publish action or publication workflow is added to Phase 8 | Template tests and manual UI review | Explicit opt-out: Phase 9/10 owns broader publication integration; API publish route remains |
| Automatic public publication/deletion | No automatic publication or deletion of retained/private videos | API/service/verifier boundary | Explicit opt-out: Phase 8 provides status/link/guidance only |
| Rich title authoring and 100-Unicode validation | Basic title/summary are accepted at start; richer authoring/validation is not implemented | Start contract tests and handoff | Explicit opt-out: Phase 9 |
| Hashtag lookup/count | Not implemented | Roadmap/requirements trace | Explicit opt-out: Phase 9 |
| Trailer artifact download | Not changed | Existing artifact regression plus roadmap trace | Explicit opt-out: Phase 11 |
| Final workflow-wide integration/compatibility | Phase 8 adds thin Manage lifecycle controls only; release-wide integration remains separate | Angular build/test gate and roadmap trace | Explicit opt-out: Phase 10 owns final workflow integration; OPS-05 remains Phase 10 |
| Scheduled/batch/playlists/thumbnails/captions/analytics/public replacement | Not implemented | Future requirements/out-of-scope trace | Explicit future-scope opt-out |

## Contract handoff to Phase 9

Phase 8 hands off a persisted private-ready job, accepted title/summary job input, normalized status/error/cancellation data, optional sanitized `privateWatchUrl`, and the existing API-owned idempotent publish route. Phase 9 must define and test richer title validation, link persistence in the existing YouTube field, and publication UI; Phase 10 owns broader Angular workflow integration. Phase 8 must not add Angular publish controls, automatic publication, or deletion of retained/private videos.
