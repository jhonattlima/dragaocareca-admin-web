# Requirements: Dragao Careca Admin Web

**Defined:** 2026-07-29
**Core Value:** Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## v1 Requirements

Requirements for milestone v1.1 Episode Artifact Downloads.

### Artifact Download API

- [x] **API-01**: The user can start a ZIP-generation job for one episode using selected artifact keys.
- [x] **API-02**: The API reports ZIP-generation progress as a percentage with pending, processing, completed, and failed states.
- [x] **API-03**: The user receives the completed ZIP through an authenticated download response after generation finishes.
- [x] **API-04**: The completed response provides a safe download filename and reports requested artifacts that were unavailable.
- [x] **API-05**: The API validates artifact selections and does not accept arbitrary filesystem paths.

### Episode List and Download Modal

- [x] **UI-01**: The user can see an artifact-download action on each episode row.
- [x] **UI-02**: The user can open a download modal for the selected episode.
- [x] **UI-03**: The modal offers episode file, trailer, cover art, low cover art (`.webp`), and transcript options.
- [x] **UI-04**: All available artifact options are checked by default, while unavailable options are clearly disabled or omitted.
- [x] **UI-05**: The user can select or deselect artifacts before confirming the download.
- [x] **UI-06**: After confirmation, the modal shows ZIP-generation progress and prevents duplicate submissions.
- [x] **UI-07**: The browser downloads the ZIP automatically when generation completes.
- [x] **UI-08**: The modal shows clear empty-selection, partial-download, failure, reset, and retry states.

### Validation and Release Quality

- [x] **VAL-01**: API mock data is configured for the Season 3 DC 334 episode using the provided episode folder.
- [ ] **VAL-02**: The complete UI flow is manually validated, including visible progress and ZIP contents.
- [x] **VAL-03**: Existing frontend tests and `npm run build` remain passing.
- [x] **VAL-04**: API tests or equivalent verification cover job creation, progress transitions, completion, failure, and missing artifacts.

## v2 Requirements

Deferred to a future release.

### Download Management

- **DL-01**: The user can cancel an in-progress ZIP-generation job from the UI.
- **DL-02**: The user can download artifacts for multiple episodes in one batch.
- **DL-03**: The user can view download-job history and retrieve a completed ZIP later.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Client-side ZIP creation | ZIP assembly and filesystem access remain backend responsibilities. |
| Arbitrary filesystem path selection | The API must resolve artifacts from the episode identity and an allowlisted selector set. |
| Separate browser downloads for each artifact | The user requested one backend-generated ZIP per episode. |
| Replacement of the existing episode list layout | The download action extends the current operator workflow. |

## Traceability

Mapped to the v1.1 roadmap phases.

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 4 | Complete |
| API-02 | Phase 4 | Complete |
| API-03 | Phase 4 | Complete |
| API-04 | Phase 4 | Complete |
| API-05 | Phase 4 | Complete |
| UI-01 | Phase 5 | Complete |
| UI-02 | Phase 5 | Complete |
| UI-03 | Phase 5 | Complete |
| UI-04 | Phase 5 | Complete |
| UI-05 | Phase 5 | Complete |
| UI-06 | Phase 5 | Complete |
| UI-07 | Phase 6 | Complete |
| UI-08 | Phase 6 | Complete |
| VAL-01 | Phase 6 | Complete |
| VAL-02 | Phase 6 | Pending |
| VAL-03 | Phase 6 | Complete |
| VAL-04 | Phase 4 | Complete |

**Coverage:**

- v1 requirements: 17 total

## Phase 6 evidence reconciliation — 2026-07-31

- UI-01/UI-06 and polling cleanup: satisfied by the final 22/22 focused and 28/28 full ChromeHeadless runs after test-lifecycle repair (`9dd8c15`).
- UI-08: implementation and focused recovery tests pass, but the bounded real-browser harness only observed empty-selection and modal focus/cleanup; remaining live recovery scenarios are unsupported and remain needs-human.
- VAL-01: prior staged-fixture evidence is retained, while the 06-04 live preflight found the current API ID-334 row is DC 319 metadata and does not match the supplied source; no mutation was attempted.
- VAL-02: remains pending because complete live recovery and ZIP evidence for the current matched fixture were not produced.
- VAL-03: satisfied by 22/22 focused Karma, 28/28 full Karma, `npm run build` exit 0, clean package/lockfile diff, and `npm ls --depth=0` exit 0. Existing selector-parser and Angular budget warnings are recorded as non-blocking.
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-29*
*Last updated: 2026-07-29 after v1.1 scope adjustment*
