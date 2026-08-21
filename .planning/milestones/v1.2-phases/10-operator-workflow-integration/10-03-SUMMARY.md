---
phase: 10-operator-workflow-integration
plan: 03
subsystem: testing
tags: [angular, auth, authBypass, jasmine, karma, youtube]
requires:
  - phase: 10-operator-workflow-integration
    provides: persisted workflow restoration and save/YouTube commit transaction
provides:
  - focused AuthService bypass/normal-mode regression coverage
  - centralized bearer interceptor compatibility coverage
  - final Manage hashtag transaction regression assertions
  - explicit paired-auth and live lifecycle UAT checklist
affects: [operator-workflow-integration, phase-11-artifacts]
tech-stack:
  added: []
  patterns: [Angular HTTP testing seams, editor-scoped lifecycle assertions]
key-files:
  created:
    - src/app/core/auth.service.spec.ts
    - src/app/core/auth.interceptor.spec.ts
    - .planning/phases/10-operator-workflow-integration/10-03-UAT.md
  modified:
    - src/app/pages/manage/manage.component.spec.ts
key-decisions:
  - "Keep authBypass as an explicit local environment behavior while testing the normal Google exchange/profile and bearer-token seams independently."
  - "Close the plan only after the required human checkpoint; browser OAuth, deployment, and provider timing remain human-evaluated rather than inferred from unit tests or build output."
  - "Leave Phase 11 artifact selector/download implementation outside this plan."
requirements-completed: [OPS-05]
coverage:
  - id: D1
    description: "Auth bypass, normal Google exchange/profile boundaries, and centralized bearer attachment are covered by focused specs."
    requirement: OPS-05
    verification:
      - kind: unit
        ref: "src/app/core/auth.service.spec.ts and src/app/core/auth.interceptor.spec.ts"
        status: unknown
    human_judgment: true
    rationale: "ChromeHeadless is not installed in this environment, so Karma could compile bundles but could not execute browser assertions."
  - id: D2
    description: "Manage lifecycle, save/commit, summary, stale-response, and hashtag continuity regressions are covered and the production build succeeds."
    requirement: OPS-05
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts"
        status: unknown
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Live paired-auth and provider timing were accepted by the explicit human UAT pass recorded in 10-03-UAT.md."
metrics:
  duration: 19min
  completed: 2026-08-20
  status: complete
---

# Phase 10 Plan 03: Auth Compatibility and Final Angular Gates

**Focused auth and Manage compatibility regressions are committed, final compilation/build gates are recorded, and the required paired-auth/provider lifecycle checkpoint passed.**

## Performance

- **Started:** 2026-08-20T21:53:00Z
- **Checkpoint reached:** 2026-08-20T22:05:41Z
- **Human validation completed:** 2026-08-20 (explicit user-reported pass)
- **Tasks:** 2 of 2 complete
- **Task 1 commit:** `cf96748`
- **Checkpoint/UAT commit:** `5f9d83e`

## Accomplishments

- Added explicit `authBypass` mock-profile/authenticated coverage while asserting staging and production remain normal-auth configurations.
- Added Google exchange/profile and bearer-token/pass-through interceptor regression coverage.
- Added final Manage assertions for hashtag success/error continuity across ordinary Save and Save-time YouTube commit boundaries.
- Preserved the existing artifact controls and did not add Phase 11 selector/download behavior.

## Verification

- `./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit` — passed after a temporary, restored `provider: null` alignment in the unrelated dirty `api.service.spec.ts` fixture.
- Focused Karma command — bundles compiled, but execution stopped because no ChromeHeadless binary is installed; the first sandboxed attempt also could not bind port 9876.
- `npm run build` — passed. Existing selector-parser, `episode-form`/metrics stylesheet-budget, and initial-bundle warnings remain.

## Deviations and Deferred Issues

- The unrelated dirty `src/app/core/api.service.ts` contract requires a `provider` fixture field in `api.service.spec.ts`; it was aligned only temporarily for compilation and restored without staging.
- Pre-existing dirty application files were preserved and remain unstaged: `api.service.ts`, `manage.component.ts`, `episode-form.component.html`, `episode-form.component.scss`, and `styles.scss`.
- ChromeHeadless is unavailable, so local Karma browser assertions remain unavailable; the required runtime checkpoint was separately accepted by the user and recorded in `10-03-UAT.md`.

## Human Checkpoint

Task 2 passed. The paired-auth and live Manage lifecycle acceptance is recorded in [10-03-UAT.md](./10-03-UAT.md).

---
*Phase: 10-operator-workflow-integration*
*Plan: 03*
*Status: complete*
