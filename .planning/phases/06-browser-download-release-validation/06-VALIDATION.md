# Phase 6 Validation Record

Status: AUTOMATED PREPARATION COMPLETE — HUMAN CHECKPOINT BLOCKED

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
| UI-07 | `src/app/core/api.service.spec.ts` and `src/app/pages/manage/manage.component.spec.ts`; focused Karma command | One authenticated Blob request, one native download, server filename, CORS-readable `Content-Disposition`, object URL cleanup | AUTOMATED COMPILED; MANUAL PENDING |
| UI-08 | ManageComponent state/recovery specs for empty, partial, failed, network/auth, expired, retry, reset, and reopen; focused suite compiled | Browser recovery matrix with request counts proving same-job delivery retry and no duplicate preparation POST | AUTOMATED COMPILED; MANUAL PENDING |
| VAL-01 | Sibling API build and configured media-layout inspection | Episode 334 row plus real source fixture copied to effective `MEDIA_STORAGE_ROOT/episodes/334/`, with selector availability recorded | PREPARED; BROWSER PENDING |
| VAL-02 | Existing Angular tests cover state/wiring but cannot prove OS download or ZIP contents | Browser progress plus archive listing matches selected available selectors and visible omissions | PENDING — NO BROWSER EVIDENCE |
| VAL-03 | Full Karma suite, sibling API build, `npm run build`, package diff check | Human checkpoint confirms release evidence is complete | AUTOMATED BUILD PASS; KARMA BLOCKED |

## Automated checks

Record the date, working directory, exact command, exit code, and concise output for each command.

| Check | Command | Exit code | Evidence |
|---|---|---:|---|
| Focused API contract | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | 1 | Bundle generated; Karma reached port failure in sandbox first, then `No binary for ChromeHeadless browser on your platform` with elevated rerun. Assertions did not execute. CWD: `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web`; date: 2026-07-31. |
| Focused Manage recovery/delivery | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` | 1 | Bundle generated; elevated rerun reached Karma, then `No binary for ChromeHeadless browser on your platform`. Assertions did not execute. CWD/date as above. |
| Full frontend suite | `npm test -- --watch=false --browsers=ChromeHeadless` | 1 | Bundle generated; elevated rerun reached Karma, then `No binary for ChromeHeadless browser on your platform`. Assertions did not execute. CWD/date as above. |
| Frontend production build | `npm run build` | 0 | PASS. Angular reported existing selector-parser warnings (`legend+*`, `.form-floating>~label`) and existing metrics stylesheet (3.96 kB > 2.00 kB) and initial bundle (678.85 kB > 500.00 kB) budget warnings. Build hash: `2de46a1c`. CWD/date as above. |
| Sibling API build | `npm --prefix ../dragaocareca-admin-api run build` | 0 | PASS (`tsc -p tsconfig.json`). CWD/date as above. CORS commit: sibling `dd8dfbd`. |
| Dependency immutability | `git diff --exit-code -- package.json package-lock.json` | 0 | PASS; no package or lockfile changes. CWD/date as above. |

Pre-existing Angular budget warnings must be recorded separately from command failure; they do not silently become new failures.

## Authoritative CORS prerequisite

Target: `../dragaocareca-admin-api/src/app.ts` and any deployment layer that overrides application CORS. The current source uses bare `app.use(cors())`, which does not establish JavaScript visibility of `Content-Disposition`.

Required change before approval: the API response includes `Access-Control-Expose-Headers: Content-Disposition` for the Angular origin. If `X-Missing-Artifacts` is read by the client, expose that header too. A curl response showing `Content-Disposition` is insufficient.

Preparation evidence: `../dragaocareca-admin-api/src/app.ts` now configures `cors({ exposedHeaders: ["Content-Disposition", "X-Missing-Artifacts"] })`; the sibling build passed and the change is committed as `dd8dfbd`. No deployment-specific CORS override was found in the checked-in API configuration. Browser Network and Angular `HttpResponse.headers.get('Content-Disposition')` evidence remain PENDING because no Chrome/Chromium binary is installed.

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
| audio | `audio.mp3` | YES — mounted Windows source | `file_name=audio.mp3` | PENDING — browser/archive unavailable | Source copy size 30,178,566 bytes |
| trailer | `trailer.mp3` | YES — mounted Windows source | `trailer_file_name=trailer.mp3` | PENDING — browser/archive unavailable | Source copy size 399,503 bytes |
| cover | `cover.jpeg` | YES — mounted Windows source | `cover_file_name=cover.jpeg` | PENDING — browser/archive unavailable | Source copy size 2,419,847 bytes |
| coverLow | `cover.webp` | YES — mounted Windows source | `cover_low_file_name=cover.webp` | PENDING — browser/archive unavailable | Source copy size 2,037,918 bytes |
| transcript | `transcript.txt` | YES — mounted Windows source | `transcript_file_name=transcript.txt` | PENDING — browser/archive unavailable | Source copy size 2,614 bytes |

Fixture preparation evidence: the immutable Windows source was accessible through the mounted equivalent `/mnt/e/.../DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras`; the source folder was not modified. The effective development destination resolved to `../dragaocareca-admin-api/data/media/episodes/334/` from `MEDIA_STORAGE_ROOT=data/media`. Episode 334 existed before staging with title `DC 319 - Rapidinhas do Careca - Músicas plásticas para sentimentos bons e ruins`, `file_name=episode_334.mp3`, `cover_file_name=episode_334.jpeg`, and remaining artifact fields null. A row snapshot and destination pre-state were recorded under the sibling API's ignored `data/.phase6-dc334-prestate/`. The staged row now points to the five canonical names above and all five destination files exist. No synthetic data was used.

Restore procedure: stop the sibling API, restore the saved episode-334 row from `data/.phase6-dc334-prestate/episode-334-row.json` using the API database tooling, remove `data/media/episodes/334/` because it was absent before staging, verify the original source folder is unchanged, then remove the ignored `data/.phase6-dc334-prestate/` backup after verification. Cleanup result: PENDING until the human checkpoint is either completed or explicitly abandoned.

## Manual checkpoint — blocking human approval

This is a human verification checkpoint, not an automated substitute. Do not mark it approved based on source inspection, synthetic data, curl alone, or a compiled test suite.

1. Start the sibling API with the controlled episode 334 row/media copy at the effective configured `MEDIA_STORAGE_ROOT/episodes/334/` destination. Start Angular with the intentional `authBypass` pairing or a real authenticated bearer session.
2. Select all available canonical artifacts and confirm. Record `Preparing files`, `Creating ZIP`, `Finalizing ZIP`, and `Archive ready` progress.
3. Confirm exactly one authenticated Blob request and one native download. Confirm the downloaded filename equals the API `Content-Disposition` filename and that Angular can read the header cross-origin.
4. Inspect the downloaded ZIP. Record its central-directory entries and confirm they match selected available artifacts under `episode-334/`; omitted artifacts must match the visible missing warning.
5. Exercise partial availability, empty selection, failed preparation, status/network failure, 401/403 authentication failure, 404/409 expired delivery, completed reopen, explicit reset/new selection, and manual same-job delivery retry. Confirm retry does not send another preparation POST.
6. Confirm repeated completed status emissions do not create another Blob request/download and object URLs are revoked after successful and thrown activation.
7. Restore the API row/configuration/media destination and record cleanup evidence.

Human checkpoint result: BLOCKED — no Chrome/Chromium binary is available for Karma or real browser validation in this environment. VAL-01/VAL-02 remain unapproved; no browser, CORS-readable-header, request-count, progress, ZIP, recovery, or cleanup approval is claimed.

Approval signal: `approved` only after every step passes. Otherwise record the exact failing scenario or blocker and leave VAL-01/VAL-02 unapproved.

## Evidence index

- Screenshots / browser Network capture: BLOCKED — Chrome/Chromium unavailable
- ZIP listing: BLOCKED — no real browser download
- Request counts: BLOCKED — no browser execution
- CORS configuration and header exposure proof: SOURCE/build PASS; browser readability PENDING
- Recovery matrix: BLOCKED — no browser execution
- Fixture pre-state and restore result: pre-state recorded; cleanup PENDING
