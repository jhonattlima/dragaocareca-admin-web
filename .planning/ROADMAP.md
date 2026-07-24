# Roadmap: Dragao Careca Admin Web

## Overview

This roadmap stabilizes the existing admin client rather than inventing a new product. The work moves from shell/auth accuracy into episode management safety, then into operational views and build hygiene so the current workflow stays dependable as the repo evolves.

## Phases

- [ ] **Phase 1: Shell and Auth Baseline** - Keep the app shell, login flow, and auth bypass behavior aligned with the current codebase.
- [ ] **Phase 2: Episode Workflow Safety** - Harden the episode editor, uploads, and list interactions so routine admin changes stay low-risk.
- [ ] **Phase 3: Operational Visibility** - Keep feed, metrics, and health views trustworthy and covered.
- [ ] **Phase 4: Maintenance Cleanup** - Clear stale tests and reduce the current Angular build/style budget pressure.

## Phase Details

### Phase 1: Shell and Auth Baseline
**Goal**: Confirm the app’s public shell, login flow, and route protection remain correct in both normal and bypass modes.
**Depends on**: Nothing
**Requirements**: AUTH-01, AUTH-02, UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. Operators can get into the dashboard through the expected auth path for the environment.
  2. The shell still renders the branded masthead and sectioned admin layout.
  3. The background mosaic behavior remains graceful when the backend asset manifest is missing.
**Plans**: 2 plans

Plans:
- [ ] 01-01: Align auth and route expectations with the current Angular shell.
- [ ] 01-02: Document and verify the current shell/background behavior.

### Phase 2: Episode Workflow Safety
**Goal**: Make the episode management screen safer to maintain without changing its operator-facing behavior.
**Depends on**: Phase 1
**Requirements**: EPIS-01, EPIS-02, EPIS-03
**Success Criteria** (what must be TRUE):
  1. Operators can still create, update, search, and paginate episodes.
  2. Media staging and deletion still show clear progress and state.
  3. The manage screen can be changed without relying on one giant mutable surface for every concern.
**Plans**: 3 plans

Plans:
- [ ] 02-01: Map the manage screen’s state and helper boundaries.
- [ ] 02-02: Separate the highest-risk episode-editing logic into smaller units where it improves maintainability.
- [ ] 02-03: Verify upload, delete, and list behavior against the current API contract.

### Phase 3: Operational Visibility
**Goal**: Keep feed, metrics, and health screens reliable as operator tools.
**Depends on**: Phase 2
**Requirements**: OPS-01, OPS-02, OPS-03
**Success Criteria** (what must be TRUE):
  1. Feed status and preview remain readable and accurate.
  2. Health and bot state remain visible in a usable operator format.
  3. Spotify and YouTube metrics continue to render from backend snapshots.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Confirm operational screen contracts and edge cases.
- [ ] 03-02: Add or update coverage for feed, health, and metrics behavior.

### Phase 4: Maintenance Cleanup
**Goal**: Remove obvious maintenance debt without changing the product shape.
**Depends on**: Phase 3
**Requirements**: MNT-01, MNT-02, MNT-03
**Success Criteria** (what must be TRUE):
  1. The stale root test no longer misrepresents the app shell.
  2. The manage screen is easier to modify safely.
  3. The current Angular budget overages are either reduced or explicitly documented as accepted debt.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Replace stale tests with coverage that matches the current app.
- [ ] 04-02: Triage and resolve the current Angular budget warnings where practical.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Shell and Auth Baseline | 0/2 | Not started | - |
| 2. Episode Workflow Safety | 0/3 | Not started | - |
| 3. Operational Visibility | 0/2 | Not started | - |
| 4. Maintenance Cleanup | 0/2 | Not started | - |
