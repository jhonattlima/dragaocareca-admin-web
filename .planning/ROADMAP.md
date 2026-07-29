# Roadmap: Dragao Careca Admin Web

## Milestones

- ✅ **v1.0 Transcript Summary Integration** — Phases 1-3, shipped 2026-07-29
- 🚧 **v1.1 Episode Artifact Downloads** — Phases 4-6, current

## Phases

- [ ] **Phase 4: Artifact Job Contract** - Establish and verify the backend-owned asynchronous ZIP job, progress, validation, and download contract.
- [ ] **Phase 5: Episode Download Modal** - Add the row action, accessible artifact-selection modal, and thin Angular orchestration.
- [ ] **Phase 6: Browser Download & Release Validation** - Complete native ZIP delivery and validate full, partial, failure, and DC 334 flows.

## Phase Details

### Phase 4: Artifact Job Contract

**Goal**: Operators can request a validated artifact ZIP job and observe a reliable backend contract from creation through authenticated completion.
**Depends on**: Phase 3 (v1.0 complete); coordinated implementation may require the sibling `dragaocare-api` repository, while this repository records the client-facing contract assumptions.
**Requirements**: API-01, API-02, API-03, API-04, API-05, VAL-04
**Success Criteria** (what must be TRUE):

  1. A request for one episode and selected canonical artifact keys creates a job without accepting filenames or filesystem paths.
  2. The job exposes pending, processing, completed, and failed states with percentage progress that the client can consume.
  3. After completion, an authenticated request returns the ZIP with a safe filename and identifies requested artifacts omitted because they were unavailable.
  4. API verification demonstrates job creation, progress transitions, completion, failure, missing artifacts, and invalid selector/path rejection.

**Plans**: 2/3 plans executed

Plans:

- [x] 04-01-PLAN.md — Establish SQLite-backed artifact-job lifecycle and deterministic failure seam
- [x] 04-02-PLAN.md — Expose authenticated start, status, and completed-download REST contract
- [ ] 04-03-PLAN.md — Verify lifecycle, security, cleanup, partial results, expiry, and OpenAPI parity

### Phase 5: Episode Download Modal

**Goal**: Operators can open an episode’s artifact picker, choose the files they need, and start one asynchronous download without disrupting episode management.
**Depends on**: Phase 4
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06
**Success Criteria** (what must be TRUE):

  1. Every persisted episode row exposes an accessible artifact-download action that opens a modal for that episode.
  2. The modal presents episode file, trailer, cover art, low cover art (`.webp`), and transcript choices using the established canonical selector vocabulary.
  3. Available choices start checked, while unavailable choices are clearly disabled or omitted and cannot be submitted accidentally.
  4. The operator can select or deselect choices, and confirming with no selections produces a clear validation message without starting a job.
  5. Once confirmed, the modal shows asynchronous job progress and prevents duplicate submissions while retaining clear cancel/retry boundaries.

**Plans**: TBD
**UI hint**: yes

### Phase 6: Browser Download & Release Validation

**Goal**: Operators receive the completed ZIP in the browser and can understand and recover from partial, empty, and failed download outcomes using the DC 334 Season 3 fixture.
**Depends on**: Phase 5
**Requirements**: UI-07, UI-08, VAL-01, VAL-02, VAL-03
**Success Criteria** (what must be TRUE):

  1. A completed job triggers one native browser ZIP download with the backend-provided safe filename, without requiring a ZIP or file-saver dependency.
  2. A partially fulfilled job downloads successfully while clearly warning which requested artifacts were unavailable; object URLs are cleaned up after delivery.
  3. Empty-selection, failed-job, network/authentication, reset, and retry states are visible and leave the operator able to try again safely.
  4. The DC 334 Season 3 mock episode, using the provided episode folder, produces a manually verified ZIP whose contents match the selected available artifacts and visible progress.
  5. Existing frontend tests and `npm run build` pass after the feature is integrated.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** Phase 4 → Phase 5 → Phase 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-3 | v1.0 Transcript Summary Integration | 6/6 | Complete | 2026-07-29 |
| 4. Artifact Job Contract | v1.1 | 2/3 | In Progress|  |
| 5. Episode Download Modal | v1.1 | 0/TBD | Not started | - |
| 6. Browser Download & Release Validation | v1.1 | 0/TBD | Not started | - |
