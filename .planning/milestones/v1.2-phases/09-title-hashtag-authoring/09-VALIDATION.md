# Phase 9: Title & Hashtag Authoring - Validation Architecture

**Defined:** 2026-08-14
**Requirements:** TITLE-01, TITLE-02, TITLE-03, TITLE-04

## Test Framework

- Frontend: Angular 15 Karma/Jasmine with `npm test -- --watch=false --browsers=ChromeHeadless`.
- Backend: sibling API TypeScript verifier scripts with temporary SQLite/fake-provider fixtures.
- Release gate: `npm run build` in this repository and `npm run build` in `../dragaocareca-admin-api`.

## Wave 0 Requirements

- [ ] Add typed `suggestedTags` and `hashtag-lookup` HTTP contract tests.
- [ ] Add ManageComponent tests for additive suggestion merge, maximum-three normalization, read-only title preview, Unicode 100/101 boundaries, stale lookup suppression, debounce, and dismissal.
- [ ] Extend the sibling API verifier for Save commit `{ title, hashtags }`, metadata-snapshot persistence/reload, publication validation, and one-hour cache hit/expiry boundaries.
- [ ] Add template/accessibility assertions or a concrete manual UAT checkpoint for hover/focus popup display, blur/tab/outside-click dismissal, disabled automatic-authoring state, and section placement.

## Requirement-to-Test Map

| Requirement | Evidence | Command |
|---|---|---|
| TITLE-01 | Angular preview recomputation and API metadata contract tests | Focused Angular specs; `npm run verify:episode-hashtag-authoring -- --focus=lifecycle` |
| TITLE-02 | Code-point title boundary and forbidden-character tests at start and commit/publication | Focused Manage specs; sibling lifecycle verifier |
| TITLE-03 | Typed lookup DTO/API route and approximate count/retrieval-time popup tests | API service/Manage specs; `npm run verify:episode-hashtag-authoring -- --focus=lookup` |
| TITLE-04 | One-second debounce/stale cancellation plus normalized API cache/quota/error tests | Focused Manage/API specs; sibling lookup verifier |

## Sampling and Phase Gate

- After API plan: sibling API build and focused lifecycle/lookup verifiers.
- After Angular orchestration: focused `ApiService` and `ManageComponent` specs.
- After template/style plan: focused Manage spec and `npm run build`.
- Before verification: full frontend test/build where the environment permits, sibling API build and both hashtag-authoring verifier focuses, plus manual UAT for popup and responsive placement.

## Manual UAT Checkpoint

1. Upload an episode and confirm the hashtag field is disabled while automatic authoring is pending/processing, then becomes editable.
2. Confirm generated hashtags append without replacing existing operator text; confirm summary failure/unavailable does not block manual hashtags.
3. Type a hashtag, wait about one second, and confirm approximate count/retrieved-at feedback; hover/focus an automatic and manual hashtag.
4. Confirm feedback disappears on further typing, tab/blur, and outside click; confirm lookup failure remains non-blocking.
5. Confirm the read-only trailer title updates with episode name/hashtags and blocks Save/start above 100 Unicode code points, including astral characters.
6. Save and confirm the exact authored title/hashtags are used by the existing Phase 8 publication contract.

## Known Environment Limitation

If ChromeHeadless is unavailable, record that the Angular test bundle compiled but browser assertions could not execute; do not claim the UI UAT passed from compilation alone.
