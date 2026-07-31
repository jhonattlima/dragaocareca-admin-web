# Phase 6 Validation Record

Status: READY FOR EXECUTION

This artifact is the evidence record for Phase 6. Task 1 and Task 2 populate the automated and fixture sections. Task 3 is the blocking human checkpoint; it must be explicitly approved only after the real browser, CORS, ZIP, recovery, and cleanup checks pass.

## Scope and locked acceptance rules

- D-01: completed `downloadUrl` is fetched as an authenticated Blob through Angular `HttpClient` and the existing interceptor.
- D-02: one automatic native download occurs when a job first reaches `completed`.
- D-03: the backend `Content-Disposition` filename is authoritative. Missing, malformed, unsafe, or CORS-invisible headers fail closed; no Angular-derived or browser-default filename is accepted.
- D-04: one temporary object URL is cleaned up after delivery, including activation failure; no new ZIP/file-saver/download dependency is permitted.
- D-05: delivery retry reuses the completed archive URL and does not create a new preparation job.

## Requirement-to-validation map

| Requirement | Automated evidence | Manual evidence | Result |
|---|---|---|---|
| UI-07 | `src/app/core/api.service.spec.ts` and `src/app/pages/manage/manage.component.spec.ts`; focused Karma command | One authenticated Blob request, one native download, server filename, CORS-readable `Content-Disposition`, object URL cleanup | PENDING |
| UI-08 | ManageComponent state/recovery specs for empty, partial, failed, network/auth, expired, retry, reset, and reopen | Browser recovery matrix with request counts proving same-job delivery retry and no duplicate preparation POST | PENDING |
| VAL-01 | Sibling API build and configured media-layout inspection | Episode 334 row plus real source fixture copied to effective `MEDIA_STORAGE_ROOT/episodes/334/`, with selector availability recorded | PENDING |
| VAL-02 | Existing Angular tests cover state/wiring but cannot prove OS download or ZIP contents | Browser progress plus archive listing matches selected available selectors and visible omissions | PENDING |
| VAL-03 | Full Karma suite, sibling API build, `npm run build`, package diff check | Human checkpoint confirms release evidence is complete | PENDING |

## Automated checks

Record the date, working directory, exact command, exit code, and concise output for each command.

| Check | Command | Exit code | Evidence |
|---|---|---:|---|
| Focused API contract | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | PENDING | PENDING |
| Focused Manage recovery/delivery | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` | PENDING | PENDING |
| Full frontend suite | `npm test -- --watch=false --browsers=ChromeHeadless` | PENDING | PENDING |
| Frontend production build | `npm run build` | PENDING | PENDING |
| Sibling API build | `npm --prefix ../dragaocareca-admin-api run build` | PENDING | PENDING |
| Dependency immutability | `git diff --exit-code -- package.json package-lock.json` | PENDING | PENDING |

Pre-existing Angular budget warnings must be recorded separately from command failure; they do not silently become new failures.

## Authoritative CORS prerequisite

Target: `../dragaocareca-admin-api/src/app.ts` and any deployment layer that overrides application CORS. The current source uses bare `app.use(cors())`, which does not establish JavaScript visibility of `Content-Disposition`.

Required change before approval: the API response includes `Access-Control-Expose-Headers: Content-Disposition` for the Angular origin. If `X-Missing-Artifacts` is read by the client, expose that header too. A curl response showing `Content-Disposition` is insufficient.

Evidence to record:

- effective API/deployment configuration path;
- sibling API build result;
- browser Network response headers;
- Angular-visible `HttpResponse.headers.get('Content-Disposition')` value;
- result: PASS only when the header is readable cross-origin, otherwise RELEASE BLOCKED.

## DC 334 fixture record

Immutable copy source:

`E:\Jhonatt\DC\_VersãoFinalParaPostagem\_Episódios - Season 3\DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras`

Effective API destination:

`MEDIA_STORAGE_ROOT/episodes/334/`

Default sibling checkout destination when `MEDIA_STORAGE_ROOT` is unset:

`../dragaocareca-admin-api/data/media/episodes/334/`

The executor must resolve the actual configured value and record it here. The source folder is never modified. Preserve any existing API row and destination media state before staging; after validation restore the row/configuration and remove or restore the dedicated destination copy.

| Canonical selector | Destination filename | Exists in source | API row field | Included in ZIP | Evidence |
|---|---|---|---|---|---|
| audio | `audio.mp3` | PENDING | PENDING | PENDING | PENDING |
| trailer | `trailer.mp3` | PENDING | PENDING | PENDING | PENDING |
| cover | `cover.jpeg` | PENDING | PENDING | PENDING | PENDING |
| coverLow | `cover.webp` | PENDING | PENDING | PENDING | PENDING |
| transcript | `transcript.txt` | PENDING | PENDING | PENDING | PENDING |

## Manual checkpoint — blocking human approval

This is a human verification checkpoint, not an automated substitute. Do not mark it approved based on source inspection, synthetic data, curl alone, or a compiled test suite.

1. Start the sibling API with the controlled episode 334 row/media copy at the effective configured `MEDIA_STORAGE_ROOT/episodes/334/` destination. Start Angular with the intentional `authBypass` pairing or a real authenticated bearer session.
2. Select all available canonical artifacts and confirm. Record `Preparing files`, `Creating ZIP`, `Finalizing ZIP`, and `Archive ready` progress.
3. Confirm exactly one authenticated Blob request and one native download. Confirm the downloaded filename equals the API `Content-Disposition` filename and that Angular can read the header cross-origin.
4. Inspect the downloaded ZIP. Record its central-directory entries and confirm they match selected available artifacts under `episode-334/`; omitted artifacts must match the visible missing warning.
5. Exercise partial availability, empty selection, failed preparation, status/network failure, 401/403 authentication failure, 404/409 expired delivery, completed reopen, explicit reset/new selection, and manual same-job delivery retry. Confirm retry does not send another preparation POST.
6. Confirm repeated completed status emissions do not create another Blob request/download and object URLs are revoked after successful and thrown activation.
7. Restore the API row/configuration/media destination and record cleanup evidence.

Human checkpoint result: PENDING

Approval signal: `approved` only after every step passes. Otherwise record the exact failing scenario or blocker and leave VAL-01/VAL-02 unapproved.

## Evidence index

- Screenshots / browser Network capture: PENDING
- ZIP listing: PENDING
- Request counts: PENDING
- CORS configuration and header exposure proof: PENDING
- Recovery matrix: PENDING
- Fixture pre-state and restore result: PENDING
