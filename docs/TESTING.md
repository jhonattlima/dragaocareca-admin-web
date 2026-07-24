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

Current visible test coverage is very small:

- `src/app/app.component.spec.ts`

## Current Test Gap

The current root spec is stale relative to the app implementation:

- It expects `app.title`.
- It expects `.content span` text in the template.

The current `AppComponent` instead renders:

- the mosaic background
- the router outlet
- no title property

So the existing test should be replaced before relying on the suite for correctness.

## Suggested Coverage Priorities

1. Root shell rendering and mosaic fetch fallback.
2. Auth bypass and login redirect behavior.
3. Episode save/upload/delete flows in `ManageComponent`.
4. Feed XML parsing and fallback error handling.
5. Health and metrics rendering from backend responses.

## Notes

- No separate E2E setup is present.
- Playwright is installed, but it is only used by `scripts/capture-metrics-screenshot.js`.
- The repo currently has no dedicated coverage script.

---

*Testing analysis: 2026-07-24*
