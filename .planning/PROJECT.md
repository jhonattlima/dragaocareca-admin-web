# Dragao Careca Admin Web

## What This Is

This is an Angular admin client for the Dragao Careca podcast operations workflow. It gives operators a sectioned, legacy-inspired UI for signing in, editing episode metadata, staging media, inspecting feed output, and checking runtime health and metrics.

The frontend should stay thin: it orchestrates API calls and presents state, while the backend remains the source of truth for feed decisions, persistence, and auth validation.

## Core Value

Keep the admin workflow reliable, legible, and backend-driven so operators can manage episodes and inspect system state without fighting the UI.

## Requirements

### Validated

- ✓ Authentication works through Google GIS in normal mode and an `authBypass` dev toggle in local mode.
- ✓ Operators can create and update episodes with metadata, participants, tags, citations, and media references.
- ✓ Operators can stage and delete episode audio, trailer, cover, and cover-webp files with upload progress feedback.
- ✓ Operators can inspect feed status and preview the generated feed XML.
- ✓ Operators can inspect Spotify metrics, YouTube metrics, and backend health/bot status.
- ✓ The app uses a branded shell with a sticky masthead and the legacy-inspired sectioned layout described in `docs/SDD.md`.

### Active

- [ ] Align the test suite with the current shell and feature set instead of stale component assertions.
- [ ] Reduce the maintenance risk in the episode management screen by splitting or isolating the densest behavior where it matters.
- [ ] Bring the build/style budgets back into a known state, or explicitly track the remaining overages as accepted debt.

### Out of Scope

- Reimplementing backend business rules in the frontend — feed generation, publish timing, persistence, and auth validation stay server-side.
- Replacing the sectioned admin UI with a minimalist placeholder layout — that would regress the working operator workflow.
- Adding direct storage or backend integrations outside the existing API contract — the frontend should continue to orchestrate API calls only.

## Context

This repo already contains the working admin app. The canonical behavioral assumptions are in `docs/SDD.md`, and the brownfield codebase map in `.planning/codebase/` documents the current stack, structure, and constraints.

The app is an Angular 15 frontend with template-driven forms, a shared `ApiService`, auth guard/interceptor plumbing, and routed screens for manage/feed/metrics/health/login. Environment files carry the `authBypass` toggle that changes both guard behavior and login routing.

## Constraints

- **Tech stack**: Angular 15 + TypeScript 4.8 + Bootstrap 5.3.8 — the app must fit the existing frontend stack.
- **Backend contract**: Keep the frontend thin and API-driven — business logic belongs in the backend API.
- **Auth mode**: Respect `environment.authBypass` in both login and route protection — local development depends on it.
- **Layout**: Preserve the sectioned, legacy-inspired admin layout — do not regress to a bare scaffold.
- **Verification**: `npm run build` must stay green before changes are considered done.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat the current repo as the project baseline, not a new product idea | The codebase already implements the admin workflow; onboarding should document and stabilize it | ✓ Good |
| Keep business logic on the backend | The SDD and current code both define the frontend as an orchestrator, not the source of truth | ✓ Good |
| Preserve the sectioned admin layout | The current UI is intentionally legacy-inspired and operational, not minimal | ✓ Good |
| Honor `authBypass` in local development | The repo already relies on that toggle for local operator flow | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `$gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `$gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-24 after initialization*
