# Phase 6 Validation Record

Status: PARTIAL — KARMA AND CLEANUP GATES PASS; LIVE RECOVERY MATRIX REMAINS UNSUPPORTED

This artifact is the evidence record for Phase 6. Plans 06-01 through 06-03 populate the automated and fixture sections. Manual browser recovery and release approval remain explicitly separate from the automated threshold correction.

The original automated tables below are retained as historical baselines; the authoritative 06-04 reconciliation is recorded at the end of this file.

## Scope and locked acceptance rules

- D-01: completed `downloadUrl` is fetched as an authenticated Blob through Angular `HttpClient` and the existing interceptor.
- D-02: one automatic native download occurs when a job first reaches `completed`.
- D-03: the backend `Content-Disposition` filename is authoritative. Missing, malformed, unsafe, or CORS-invisible headers fail closed; no Angular-derived or browser-default filename is accepted.
- D-04: one temporary object URL is cleaned up after delivery, including activation failure; no new ZIP/file-saver/download dependency is permitted.
- D-05: delivery retry reuses the completed archive URL and does not create a new preparation job.

## Requirement-to-validation map

| Requirement | Automated evidence | Manual evidence | Result |
|---|---|---|---|
| UI-07 | `src/app/core/api.service.spec.ts` and `src/app/pages/manage/manage.component.spec.ts`; focused Karma command | One authenticated Blob request, one native download, server filename, CORS-readable `Content-Disposition`, object URL cleanup | PASS — Playwright evidence below |
| UI-08 | ManageComponent state/recovery specs for empty, partial, failed, network/auth, expired, retry, reset, and reopen; focused suite compiled | Bounded real-browser matrix; only empty-selection and modal focus/cleanup were observed live | PARTIAL — unsupported scenarios remain explicit |
| VAL-01 | Sibling API build and configured media-layout inspection | Episode 334 row plus real source fixture copied to effective `MEDIA_STORAGE_ROOT/episodes/334/`, with selector availability recorded | PASS — real fixture resolved; restored afterward |
| VAL-02 | Existing Angular tests cover state/wiring; focused suite passes | Prior full-selection ZIP evidence retained; 06-04 recovery harness records live unsupported scenarios | PARTIAL — complete recovery acceptance is not evidenced |
| VAL-03 | Focused and full ChromeHeadless Karma, `npm run build`, package/lockfile diff, `npm ls --depth=0` | Bounded browser cleanup and fixture/API preflight | PASS — full 28/28 Karma and build pass; warnings recorded |

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

### 06-03 threshold correction and release-gate rerun — 2026-07-31

The existing Playwright Chromium binary was supplied through `CHROME_BIN`:
`/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`.
All commands ran from `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-web`.

| Check | Exact command | Exit code | Result |
|---|---|---:|---|
| Focused API contract | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | 0 | 4/4 assertions passed in Chrome Headless 149. |
| Focused threshold contract | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | 0 | 1/1 assertion passed, covering 24/25/89/90% labels. |
| Combined focused API/Manage/threshold | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts' --include='src/app/pages/manage/manage.component.spec.ts' --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | 1 | 20 assertions executed; threshold and API assertions passed, while pre-existing ManageComponent UI-01 and UI-06 failed. The run also reported the existing `undefined.subscribe` polling-spy afterAll error. |
| Full frontend Karma suite | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless` | 1 | 28 assertions executed; 26 passed and the same pre-existing UI-01/UI-06 tests failed. The existing polling-spy `undefined.subscribe` afterAll error was also reported. |
| Frontend production build | `npm run build` | 0 | PASS. Existing selector-parser warnings (`legend+*`, `.form-floating>~label`) and Angular metrics stylesheet (3.96 kB > 2.00 kB) and initial bundle (678.85 kB > 500.00 kB) budget warnings remain. Build hash: `a4d773fb83093a85`. |
| Dependency immutability | `git diff --exit-code -- package.json package-lock.json` | 0 | PASS; no dependency manifest or lockfile changes. |

The focused threshold failure recorded below is superseded: `ManageComponent.getArtifactStage()` now mirrors the sibling API's `<25` preparation, `<90` archive-assembly, and `>=90` finalization boundaries. The full-suite failures are pre-existing UI fixture/DOM assumptions and incomplete polling spies outside this plan's display-only change; they remain release-test debt and were not altered here.

## Authoritative CORS prerequisite

Target: `../dragaocareca-admin-api/src/app.ts` and any deployment layer that overrides application CORS. The current source uses bare `app.use(cors())`, which does not establish JavaScript visibility of `Content-Disposition`.

Required change before approval: the API response includes `Access-Control-Expose-Headers: Content-Disposition` for the Angular origin. If `X-Missing-Artifacts` is read by the client, expose that header too. A curl response showing `Content-Disposition` is insufficient.

Preparation and browser evidence: `../dragaocareca-admin-api/src/app.ts` configures `cors({ exposedHeaders: ["Content-Disposition", "X-Missing-Artifacts"] })`; the sibling build passed and the change is committed as `dd8dfbd`. Playwright Chromium observed `Access-Control-Expose-Headers: Content-Disposition,X-Missing-Artifacts` on the API responses. An instrumented browser XHR `getAllResponseHeaders()` observed `content-disposition: attachment; filename="episode-334-artifacts.zip"` on the Angular-origin Blob request, proving JavaScript-readable exposure. No deployment-specific CORS override was found in the checked-in API configuration.

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
| audio | `audio.mp3` | YES — mounted Windows source | `file_name=audio.mp3` | YES | Source copy size 30,178,566 bytes; ZIP entry `episode-334/audio.mp3` |
| trailer | `trailer.mp3` | YES — mounted Windows source | `trailer_file_name=trailer.mp3` | YES | Source copy size 399,503 bytes; ZIP entry `episode-334/trailer.mp3` |
| cover | `cover.jpeg` | YES — mounted Windows source | `cover_file_name=cover.jpeg` | YES | Source copy size 2,419,847 bytes; ZIP entry `episode-334/cover.jpeg` |
| coverLow | `cover.webp` | YES — mounted Windows source | `cover_low_file_name=cover.webp` | YES | Source copy size 2,037,918 bytes; ZIP entry `episode-334/cover.webp` |
| transcript | `transcript.txt` | YES — mounted Windows source | `transcript_file_name=transcript.txt` | YES | Source copy size 2,614 bytes; ZIP entry `episode-334/transcript.txt` |

Fixture preparation evidence: the immutable Windows source was accessible through the mounted equivalent `/mnt/e/.../DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras`; the source folder was not modified. The effective development destination resolved to `../dragaocareca-admin-api/data/media/episodes/334/` from `MEDIA_STORAGE_ROOT=data/media`. Episode 334 existed before staging with title `DC 319 - Rapidinhas do Careca - Músicas plásticas para sentimentos bons e ruins`, `file_name=episode_334.mp3`, `cover_file_name=episode_334.jpeg`, and remaining artifact fields null. A row snapshot and destination pre-state were recorded under the sibling API's ignored `data/.phase6-dc334-prestate/`. The staged row now points to the five canonical names above and all five destination files exist. No synthetic data was used.

Restore procedure: stop the sibling API, restore the saved episode-334 row from `data/.phase6-dc334-prestate/episode-334-row.json` using the API database tooling, remove `data/media/episodes/334/` because it was absent before staging, verify the original source folder is unchanged, then remove the ignored `data/.phase6-dc334-prestate/` backup after verification. Cleanup result: PASS — API stopped, original row restored exactly, destination removed, validation artifact/archive rows removed, and source was never modified.

## Manual checkpoint — blocking human approval

This is a human verification checkpoint, not an automated substitute. Do not mark it approved based on source inspection, synthetic data, curl alone, or a compiled test suite.

1. Start the sibling API with the controlled episode 334 row/media copy at the effective configured `MEDIA_STORAGE_ROOT/episodes/334/` destination. Start Angular with the intentional `authBypass` pairing or a real authenticated bearer session.
2. Select all available canonical artifacts and confirm. Record `Preparing files`, `Creating ZIP`, `Finalizing ZIP`, and `Archive ready` progress.
3. Confirm exactly one authenticated Blob request and one native download. Confirm the downloaded filename equals the API `Content-Disposition` filename and that Angular can read the header cross-origin.
4. Inspect the downloaded ZIP. Record its central-directory entries and confirm they match selected available artifacts under `episode-334/`; omitted artifacts must match the visible missing warning.
5. Exercise partial availability, empty selection, failed preparation, status/network failure, 401/403 authentication failure, 404/409 expired delivery, completed reopen, explicit reset/new selection, and manual same-job delivery retry. Confirm retry does not send another preparation POST.
6. Confirm repeated completed status emissions do not create another Blob request/download and object URLs are revoked after successful and thrown activation.
7. Restore the API row/configuration/media destination and record cleanup evidence.

Human checkpoint result: PARTIAL PASS — Prior Playwright-managed Chromium evidence completed the real DC 334 full-selection browser download and cleanup checks. The 06-04 bounded recovery harness used the live auth-bypass pairing and mounted source without mutation: empty selection correctly disabled `Prepare archive` with zero preparation POSTs, and modal cleanup restored invoker focus. Partial, failure, auth/expiry, reopen, retry, reset, and repeated-completion scenarios are explicitly unsupported because the current API row does not match the supplied source and no reversible verifier control/prepared completed job was available. Final focused/full Karma are green; only the live recovery matrix remains open.

### Playwright browser evidence — 2026-07-31

- Browser: Playwright 1.61.0 package with `/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`, headless.
- Auth/config: frontend and API development `authBypass=true`; API ran with workers enabled. No tokens were recorded.
- Real UI: Episodes search found episode ID 334 and all five canonical options checked/available from the staged real fixture.
- Request counts: one `POST /v1/episodes/334/artifacts/jobs` (202), seven status GETs before completion, and one authenticated Blob `GET /v1/episodes/334/artifacts/jobs/{jobId}/download` (200). No second preparation POST occurred in the successful flow.
- Visible states captured: `Preparing files` and `Archive ready — 100%`. `Creating ZIP` and `Finalizing ZIP` were not observed because the real API transitioned through those short-lived stages between browser polling observations; they are not claimed as captured.
- Header evidence: download response contained `Content-Disposition: attachment; filename="episode-334-artifacts.zip"`; Playwright’s native download suggested filename was `episode-334-artifacts.zip`; the instrumented Angular XHR header collection saw the same value.
- Browser delivery: one native download, no download failure, one `URL.createObjectURL`, one anchor activation, and one `URL.revokeObjectURL`.
- ZIP listing: `episode-334/audio.mp3`, `episode-334/trailer.mp3`, `episode-334/transcript.txt`, `episode-334/cover.jpeg`, `episode-334/cover.webp`. Python standard-library ZIP inspection was used because `unzip`/`zipinfo` are not installed; no package was added.
- Recovery limitation: `/tmp/phase6-recovery.js` reached the empty-selection scenario, where the real UI disabled `Prepare archive` after all five checkboxes were unchecked. The harness then timed out waiting for a clickable disabled control at line 18; later retry, 401/403, 404/409, network-failure, partial-availability, and repeated-completed-emission scenarios have no result artifact and remain unapproved.

Approval signal: `approved` only after every step passes. Otherwise record the exact failing scenario or blocker and leave VAL-01/VAL-02 unapproved.

## Evidence index

- Screenshots / browser Network capture: Playwright headless evidence recorded; screenshots not captured
- ZIP listing: PASS — five canonical `episode-334/` entries recorded
- Request counts: PASS for full-selection flow; recovery counts incomplete
- CORS configuration and header exposure proof: PASS — source, response exposure, and Angular XHR-readable header observed
- Recovery matrix: PARTIAL — exact harness blocker recorded; untested scenarios remain unapproved
- Fixture pre-state and restore result: PASS — original row restored and destination removed

## Retroactive Nyquist audit — 2026-07-31

The original ChromeHeadless command was environment-blocked because Karma could not find a
ChromeHeadless binary (and the sandbox could not bind port 9876). The repository already
contains Playwright and a usable Chromium binary, so no dependency or application change was
needed. Setting Karma's existing launcher hook to that binary executed real browser assertions:

`CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`

| Gap | Test file | Executed command | Actual result | Classification |
|---|---|---|---|---|
| Browser runner unavailable | `src/app/core/api.service.spec.ts` | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` | 4/4 assertions passed in Chrome Headless 149 | FILLED |
| Recovery matrix incomplete | `src/app/pages/manage/phase6-validation.spec.ts` | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/phase6-validation.spec.ts'` | 6/6 assertions passed: empty, partial, failed preparation, network/401/403/404/409, same-job delivery retry without a preparation POST, reset, and repeated completion | FILLED |
| API/UI progress-stage threshold mismatch (historical result) | `src/app/pages/manage/phase6-progress-threshold.spec.ts` | Prior CHROME_BIN-qualified run | Historical 06-02 failure at old boundaries; 06-03 rerun passed 1/1 after the `<25`/`<90` correction. | CLOSED BY 06-03 |

The threshold failure is an implementation issue, not a test-fixture issue. The sibling API
uses `<25` for preparation, `<90` for archive assembly, and `>=90` for finalization in
`../dragaocareca-admin-api/src/services/episode-artifact-preparation.service.ts`; the frontend
uses the corrected `<25` and `<90` boundaries in `src/app/pages/manage/manage.component.ts`.
06-03 aligned the displayed stage boundaries with the API contract and tested both sides of
each boundary. No sibling API source was modified.

The full browser-backed frontend command was also run:

`CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless`

It executed all 28 assertions but failed 3 existing tests: two stale/fixture failures in
`src/app/pages/manage/manage.component.spec.ts` (UI-01 and UI-06) and the new threshold
escalation; it also reported an afterAll `undefined.subscribe` from an existing incomplete
polling spy. The production build remains green via `npm run build` (exit 0, existing selector
parser and Angular budget warnings only). The original full Karma command without `CHROME_BIN`
still remains non-runnable in this environment; the explicit binary-qualified command above is
the safe browser-capable validation command.

### Audit classification

| Gap | Status | Debug iterations | Notes |
|---|---|---:|---|
| Karma ChromeHeadless cannot run | FILLED | 0 | Existing Playwright Chromium supplied through `CHROME_BIN`; no install/dependency change |
| Browser recovery scenarios incomplete | FILLED | 1 | Test fixture corrected to mock the retry polling observable; rerun green |
| API/frontend progress-stage mismatch | CLOSED | 1 | 06-03 corrected the frontend to `<25`/`<90` and the boundary suite passed 1/1 |

## Authoritative 06-04 reconciliation — 2026-07-31

Task 1 repaired only the test lifecycle seam proven by the focused baseline. The test setup now restores the episode row after the synchronous `listEpisodes(of([]))` initialization, supplies the artifact-status Observable used by the start/poll test, and destroys the direct-instantiated recovery component after each spec. No production artifact/download code, API contract, selector, or dependency changed.

| Check | Exact command | Exit code | Actual result |
|---|---|---:|---|
| Focused Manage/recovery/threshold | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts' --include='src/app/pages/manage/phase6-validation.spec.ts' --include='src/app/pages/manage/phase6-progress-threshold.spec.ts'` | 0 | 22/22 passed in Chrome Headless 149; UI-01, UI-06, polling cleanup, delivery/retry/reset/reopen/repeated completion, and Add episode isolation passed. |
| Full frontend Karma | `CHROME_BIN=/home/jhonatt/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome npm test -- --watch=false --browsers=ChromeHeadless` | 0 | 28/28 passed in Chrome Headless 149; no `undefined.subscribe` or Chrome disconnect. |
| Production build | `npm run build` | 0 | PASS; Angular selector-parser and existing metrics stylesheet/initial-bundle budget warnings remain. Build hash `a4d773fb83093a85`. |
| Dependency manifests | `git diff --exit-code -- package.json package-lock.json` | 0 | PASS; no dependency or lockfile changes. |
| Installed dependency tree | `npm ls --depth=0` | 0 | PASS; existing Playwright 1.61.0 used, no install attempted. |
| Harness help | `node scripts/phase6-validation.js --help` | 0 | PASS; explicit paths/timeouts/report options shown. |
| Bounded real browser | `node scripts/phase6-validation.js --frontend-url http://127.0.0.1:4200/ --api-url http://127.0.0.1:3000 --fixture-path '/mnt/e/Jhonatt/DC/_VersãoFinalParaPostagem/_Episódios - Season 3/DC 334 - Leitura de Pergaminhos - O pergaminho rebote dos caras' --report-dir /tmp/phase6-validation-final-2 --scenario-timeout 15000 --overall-timeout 120000` | 0 | Report `/tmp/phase6-validation-final-2/phase6-validation.json`: bounded; 2 live passes, 10 explicit unsupported results; 26 requests/25 responses; no page errors/downloads; cleanup pass. |

### Real harness facts

- Preconditions: existing Chromium, frontend HTTP 200, sibling API `/health` HTTP 200, mounted immutable source present, and empty API destination `/home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api/data/media/episodes/334/` before/after.
- The real API lookup for ID 334 returned HTTP 200, but its current row is titled `DC 319 - Rapidinhas do Careca - Músicas plásticas para sentimentos bons e ruins`, has `episodeNumber=319`, `fileName=episode_334.mp3`, and `coverFileName=episode_334.jpeg`; it does not match the supplied DC334 source metadata. The harness therefore did not stage files, start a preparation job, or claim a ZIP/recovery result.
- Live browser passes: the Episodes modal opened; after all available checkboxes were cleared, `Prepare archive` was disabled and preparation POST count was 0; closing the modal restored focus to the original `.episode-download-button` invoker.
- Explicitly unsupported: partial ZIP, failed preparation, network delivery, 401, 403, 404, 409, completed reopen, same-job delivery retry, reset/new selection, and repeated completion. Reason: no reversible verifier control/prepared completed real browser job was available without mutating the mismatched live row/source. These are not passes.
- Cleanup: no destination, row, source, archive, or temporary validation state was mutated; media destination before/after listings were both empty. The report captured no tokens/cookies.

The earlier real full-selection DC334 ZIP evidence remains retained as historical evidence, but it is not upgraded by this run into recovery-matrix proof. VAL-02 and UI-08 remain partial pending a correctly staged/matched DC334 runtime or an approved reversible verifier control.
