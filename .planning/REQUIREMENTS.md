# Requirements: Dragao Careca Admin Web

**Defined:** 2026-07-24
**Core Value:** Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Operators can sign in with Google GIS in normal mode and bypass auth in local development when `authBypass` is enabled.
- [ ] **AUTH-02**: Protected routes stay gated behind the auth guard, while bypass mode lets local operators reach the dashboard without a token.

### Episode Administration

- [ ] **EPIS-01**: Operators can create and update episodes with title, summary, publish time, episode number, type, explicit flag, authors, guests, tags, citations, and platform references.
- [ ] **EPIS-02**: Operators can stage and delete episode audio, trailer, cover, and cover-webp files with visible upload/delete progress.
- [ ] **EPIS-03**: Operators can search and paginate the episode list by title and guest name.

### Operational Views

- [ ] **OPS-01**: Operators can inspect feed status and preview the feed XML.
- [ ] **OPS-02**: Operators can inspect backend health, bot status, and runtime queue signals.
- [ ] **OPS-03**: Operators can inspect Spotify and YouTube metrics from the admin UI.

### UI Shell

- [ ] **UI-01**: The app preserves the sectioned, legacy-inspired admin layout with the branded shell and masthead navigation.
- [ ] **UI-02**: The background mosaic loads from the backend asset manifest when available and fails gracefully when it is not.

## v2 Requirements

### Maintainability

- **MNT-01**: Replace stale or misleading tests with coverage that matches the current shell and workflows.
- **MNT-02**: Reduce the manage screen’s coupling so episode editing, uploads, and table behavior are easier to change safely.
- **MNT-03**: Track and eventually reduce the current Angular budget overages.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Moving business rules such as feed generation or pubDate decisions into the frontend | The SDD makes the backend the source of truth |
| Replacing the legacy-inspired admin layout with a minimalist scaffold | That would regress the operator workflow this repo already supports |
| Direct storage access from the browser | The current contract is API-mediated staging and deletion |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| EPIS-01 | Phase 2 | Pending |
| EPIS-02 | Phase 2 | Pending |
| EPIS-03 | Phase 2 | Pending |
| OPS-01 | Phase 3 | Pending |
| OPS-02 | Phase 3 | Pending |
| OPS-03 | Phase 3 | Pending |
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-24*
*Last updated: 2026-07-24 after initialization*
