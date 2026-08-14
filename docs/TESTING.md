# Testing

**Analysis Date:** 2026-07-24

## Current Test Stack

- Runner: Karma 6.4 via Angular CLI.
- Assertion library: Jasmine 4.5.
- Config: `angular.json` plus `tsconfig.spec.json`.

## Commands

```bash
npm test
npm test -- --watch
npm test -- --watch=false --browsers=ChromeHeadless
npm run build

# Run from /home/jhonatt/repos/jhonatt_projects/dragaocareca-admin-api
npm run build
NODE_ENV=development DISABLE_BACKGROUND_WORKERS=true node dist/scripts/verify-episode-audio-contract.js
```

## Current Layout

Tests are colocated with source files as `*.spec.ts`.

Current coverage is concentrated in the phase-focused tests listed by each phase
plan. The root shell spec is not treated as the source of truth for feature
verification; feature contracts should be covered by colocated component,
service, and API contract tests.

Phase 8.1 verification focuses on `src/app/pages/manage/manage.component.spec.ts`,
`src/app/core/api.service.spec.ts`, and the sibling API
`dist/scripts/verify-episode-audio-contract.js`. The API verifier covers the
draft/upload response, Angular payload shape, create response and persisted DTO,
reload equivalence, upload/probe/create cleanup failures, complete music-credit
validation, and trailer-audio compatibility.

## Suggested Coverage Priorities

1. Auth bypass and login redirect behavior.
2. Episode save/upload/delete flows in `ManageComponent`.
3. Feed XML parsing and fallback error handling.
4. Health and metrics rendering from backend responses.

## Notes

- No separate E2E setup is present.
- Playwright is installed, but it is only used by `scripts/capture-metrics-screenshot.js`.
- The repo currently has no dedicated coverage script.
- ChromeHeadless is an independent browser gate. A nonzero Angular test status is
  limited only when output explicitly reports a missing ChromeHeadless/Chrome
  binary or launcher; Karma/Jasmine assertion failures and compilation failures
  remain failed gates. When the runner is unavailable, record the exact output and
  keep the build and both API gates independent—build success does not mean tests
  passed.

---

*Testing analysis: 2026-07-24*
