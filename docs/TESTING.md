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
```

## Current Layout

Tests are colocated with source files as `*.spec.ts`.

Current coverage is concentrated in the phase-focused tests listed by each phase
plan. The root shell spec is not treated as the source of truth for feature
verification; feature contracts should be covered by colocated component,
service, and API contract tests.

## Suggested Coverage Priorities

1. Auth bypass and login redirect behavior.
2. Episode save/upload/delete flows in `ManageComponent`.
3. Feed XML parsing and fallback error handling.
4. Health and metrics rendering from backend responses.

## Notes

- No separate E2E setup is present.
- Playwright is installed, but it is only used by `scripts/capture-metrics-screenshot.js`.
- The repo currently has no dedicated coverage script.

---

*Testing analysis: 2026-07-24*
