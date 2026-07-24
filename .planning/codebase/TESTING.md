---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# Testing Patterns

**Analysis Date:** 2026-07-24

## Test Framework

**Runner:**
- Karma 6.4 via Angular CLI `ng test`.
- Config lives in `angular.json` with `tsconfig.spec.json`.

**Assertion Library:**
- Jasmine 4.5.
- Common matcher style: `toBeTruthy`, `toEqual`, and template DOM assertions through the test fixture.

**Run Commands:**
```bash
npm test
npm test -- --watch
```

## Test File Organization

**Location:**
- `*.spec.ts` colocated with source files.
- No separate `tests/` tree surfaced in the repository.

**Naming:**
- `something.component.spec.ts` for Angular component tests.
- The repo currently only surfaced `src/app/app.component.spec.ts`.

**Structure:**
```text
src/
  app/
    app.component.ts
    app.component.spec.ts
```

## Test Structure

**Suite Organization:**
- Angular `TestBed.configureTestingModule(...)` setup.
- Component creation checks plus DOM assertion against rendered output.

**Patterns:**
- `beforeEach(async () => ...)` for module setup.
- Fixture creation per test case.
- Minimal shared helpers.

## Mocking

**Framework:**
- Jasmine / Angular TestBed test doubles as needed.
- No advanced mocking framework surfaced beyond standard Angular/Jasmine patterns.

**Patterns:**
- Most application behavior is currently untested.
- For network-heavy code, the likely next step is to mock `HttpClient` or use Angular testing utilities.

**What to Mock:**
- HTTP calls.
- Browser APIs such as `fetch` and `localStorage` when testing auth and shell behavior.

**What NOT to Mock:**
- Pure transformation helpers where simple unit assertions are enough.

## Fixtures and Factories

**Test Data:**
- No shared fixture directory found.
- Data is likely to be created inline per spec file.

**Location:**
- Co-locate helpers in the spec file unless reuse grows.

## Coverage

**Requirements:**
- No explicit coverage threshold found in the project scripts or config.

**Configuration:**
- Coverage can be generated through the Angular/Karma stack, but no dedicated coverage script is defined in `package.json`.

**View Coverage:**
```bash
npm test
```

## Test Types

**Unit Tests:**
- Angular component and service tests are the intended default.
- Current coverage is extremely thin.

**Integration Tests:**
- Not yet established.

**E2E Tests:**
- No E2E suite found.
- Playwright exists only for the screenshot helper script in `scripts/capture-metrics-screenshot.js`.

## Common Patterns

**Async Testing:**
- Component init and observable behavior would normally be tested with `fakeAsync`, `tick`, or async fixture stabilization, but that pattern is not yet established here.

**Error Testing:**
- Not meaningfully exercised in the inspected test set.

**Snapshot Testing:**
- Not used.

## Current Gaps

- `src/app/app.component.spec.ts` is stale: it references `app.title` and `.content span`, but the current `AppComponent` no longer exposes that API or template.
- No meaningful coverage was found for auth, episode management, feed parsing, metrics, or health views.

---

*Testing analysis: 2026-07-24*
*Update when test patterns change*
