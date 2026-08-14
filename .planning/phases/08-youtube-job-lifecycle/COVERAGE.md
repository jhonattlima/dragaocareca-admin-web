# Phase 8 YouTube/API Capability Coverage

This is the API coverage-gate artifact for Phase 8. The boundary is private-first,
server-owned, authenticated, and source-identity bound. D-01 through D-12 are the
locked decisions from `08-CONTEXT.md`.

| Capability | Decision | Evidence / owner | Disposition |
|---|---|---|---|
| Authenticated metadata-bearing start | Accept only optional `title` and `summary`; reject provider IDs, session URLs, credentials, filesystem paths, and unknown body fields. | `episodes.routes.ts` strict Zod schema; lifecycle verifier no-store/body assertions; OpenAPI start schema. | Covered: YOUTUBE-01, D-01, D-08, D-11 |
| Accepted title/summary job input | Persist the accepted pair in `metadata_snapshot_json` and pass it to the private upload provider. | `youtube-trailer-job.service.ts`; fake-provider metadata capture in `verify-youtube-trailer-job-lifecycle.ts`. | Covered: YOUTUBE-01 |
| Current lookup and reload recovery | Authenticated `current` lookup fingerprints the canonical finalized trailer and returns the active current-source job. | Service/repository route plus current/status verifier assertions. | Covered: YOUTUBE-03, OPS-02, D-07 |
| Resumable private upload | Persist session/range evidence internally, resume after interruption, and begin provider uploads with `privacyStatus=private`. | Worker/provider implementation and fake-provider range/restart assertions. | Covered: YOUTUBE-02, YOUTUBE-03, D-03/D-04 |
| Processing poll and private readiness | Poll processing separately from transfer; `ready` requires processed private provider state. | Worker fake-provider processing assertions and sanitized DTO/OpenAPI schema. | Covered: YOUTUBE-02, D-02/D-03 |
| Sanitized `privateWatchUrl` | Expose only a validated YouTube watch URL after provider-video evidence; invalid IDs produce null. Never expose provider ID, session, source, lease, or raw failure fields. | DTO negative assertions, OpenAPI omission checks, and lifecycle verifier. | Covered: YOUTUBE-02, OPS-01, D-11 |
| Same-job retry | Retry the same durable row and resumable evidence; do not create another provider upload for an unchanged source. | Repository/service retry implementation and lifecycle retry assertions. | Covered: YOUTUBE-03, OPS-04, D-04 |
| Cancellation boundary/reconciliation | Before provider acceptance report `local-cancelled`; after accepted bytes/video report `provider-video-retained` and reconciliation guidance. Never claim remote deletion. | Worker fake-provider cancellation scenarios and route DTO assertions. | Covered: YOUTUBE-04, D-05/D-06 |
| Source fingerprint/idempotency | Bind each job to canonical relative filename, SHA-256, and byte count; obsolete replaced sources and reject late CAS writes. | Repository `obsoletePriorSource`, worker source guard, and replacement verifier scenario. | Covered: YOUTUBE-03, OPS-02, D-08/D-09 |
| Duplicate starts | Repeated starts for the same episode/source reuse the active job and return no-store responses. | `createOrReuse`, route duplicate-start verifier assertion, OpenAPI response. | Covered: OPS-02, D-08 |
| API restart recovery | Recover claimed/transferring/processing rows with a single worker lease and reconcile persisted session/provider evidence. | Worker `recoverInterrupted`, startup guard, and restart/range verifier scenarios. | Covered: YOUTUBE-03, OPS-02, D-07 |
| Stable errors and bounded retry | Normalize authentication/OAuth, quota, timeout, network/provider, invalid-trailer, session-expired, and reconciliation categories; retry only bounded recoverable classes with `nextAttemptAt`. | Provider normalization, service retry policy, DTO category allowlist, and fake-provider failure fixtures. | Covered: OPS-04, D-10/D-12 |
| Logs/DTO/OpenAPI sanitization | Serialized evidence omits credentials, session URLs, raw provider payloads/messages/reasons, filesystem paths, provider IDs, leases, and stack traces. | Verifier negative serialized-field assertions plus safe OpenAPI schema. | Covered: OPS-01, T-08-06, D-11 |
| Existing API publish idempotency | Retain the authenticated API publish route; repeated requests reconcile the same provider video and publication row. Phase 8 verifier proves route presence/boundary; publication-specific fake-provider evidence remains in the sibling publication verifier. | `/youtube-trailer-jobs/{jobId}/publish`, `publishYoutubeTrailer`, publication verifier. | Covered API seam: OPS-03; no Angular publish control in Phase 8 |
| Browser OAuth/direct provider calls | Browser never receives OAuth credentials or calls YouTube; Angular calls only the authenticated sibling API. | Architecture contract and API-only provider boundary. | Explicit opt-out: Phase 8 security boundary; API owns OAuth |
| Angular publish controls | No separate Angular Publish action or provider workflow is added; Save remains the publication boundary. | Manage Save calls the API commit route after episode persistence. | Covered by Phase 8; Phase 9 owns title/hashtag authoring only |
| Automatic deletion/publication | No automatic public transition or deletion of a retained/private provider video. | Cancellation/service/provider contract. | Explicit opt-out: Phase 8 only reports status/link/guidance; publication is explicit and deletion is future scope |
| Rich title authoring and 100-Unicode validation | Phase 8 accepts/publishes basic title/summary metadata, but richer title assembly and Unicode validation are not part of job start. | Start schema and Phase 9 handoff. | Explicit opt-out: Phase 9 |
| Hashtag lookup/count | Not part of the private upload lifecycle. | Requirements/roadmap boundary. | Explicit opt-out: Phase 9 |
| Trailer artifact download | Existing artifact routes are unchanged by YouTube jobs. | Phase 7 artifact contract and regression verifier. | Explicit opt-out: Phase 11 |
| Final workflow-wide integration | Backend lifecycle evidence is complete, but full placement and compatibility release integration is not claimed here. | Phase 8 verifier/build; roadmap handoff. | Explicit opt-out: Phase 10; OPS-05 remains there |
| Post-public replacement/deletion, scheduling, playlists, thumbnails, captions, analytics, batch operations | Not implemented in the private-first lifecycle. | Future-scope boundary. | Explicit future opt-out: later product/infrastructure phase |

## Handoff to Phase 9

Phase 8 provides a durable private-ready job, accepted title/summary input,
normalized status/error/cancellation data, an optional sanitized `privateWatchUrl`,
Save-time metadata commit, and the existing API-owned idempotent publish route.
Phase 9 owns richer title validation and hashtag authoring/counting; it does not
introduce a second publication flow. Phase 10 owns final Angular workflow integration. Phase 11 owns
adding finalized `trailer-video` to the artifact modal and ZIP flow.

No capability above is silently omitted: every unsupported provider/API surface is
marked as an explicit security or later-phase opt-out with an owner.
