---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# Technology Stack

**Analysis Date:** 2026-07-24

## Languages

**Primary:**
- TypeScript 4.8 - All Angular application code in `src/app/**`, `src/main.ts`, and test files.

**Secondary:**
- HTML - Angular templates in `src/app/**/*.html` and `src/index.html`.
- SCSS - Component and global styling in `src/app/**/*.scss` and `src/styles.scss`.
- JSON - Angular/build configuration in `angular.json`, `tsconfig*.json`, and environment files.
- JavaScript - Node helper script in `scripts/capture-metrics-screenshot.js`.

## Runtime

**Environment:**
- Browser runtime for the application itself.
- Node.js for build, test, and the Playwright screenshot script.
- Angular CLI 15 toolchain drives `ng serve`, `ng build`, and Karma test execution.

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present, lockfileVersion 3.

## Frameworks

**Core:**
- Angular 15 - Application framework.
- Angular Router - App routing and protected navigation.
- Angular Forms - Template-driven forms across login and episode management.

**Testing:**
- Karma 6 + Jasmine 4 - Default Angular unit-test stack.
- Playwright 1.55 - Used for the screenshot helper script, not wired into the test runner.

**Build/Dev:**
- Angular CLI / `@angular-devkit/build-angular` 15 - Build and dev server.
- TypeScript compiler 4.8 - Type-checking and transpilation.
- Bootstrap 5.3.8 - Global UI layer imported in `src/styles.scss`.
- zone.js 0.12 - Angular runtime polyfills.

## Key Dependencies

**Critical:**
- `@angular/core`, `@angular/common`, `@angular/router`, `@angular/forms` - Application runtime and UI composition.
- `@angular/common/http` - API orchestration through `ApiService` and auth interceptor.
- `bootstrap` - Legacy-inspired sectioned layout and shared form/table styling.
- `rxjs` - Observable-based HTTP flows, polling, and `finalize()` usage.
- `zone.js` - Angular change-detection runtime support.

**Infrastructure:**
- `playwright` - Used by `scripts/capture-metrics-screenshot.js` to capture the metrics page.
- `@types/node` - Type support for the script and Node-backed tooling.

## Configuration

**Environment:**
- `src/environments/environment.ts` and `src/environments/environment.prod.ts`
  - `apiBaseUrl`
  - `googleClientId`
  - `authBypass`
- Auth bypass is intentionally environment-driven and must stay respected by both guard and login flow.

**Build:**
- `angular.json` - Build, serve, and test targets.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` - TypeScript and Angular compiler settings.
- `.editorconfig` - Enforces 2-space indentation and single quotes for TypeScript.

## Platform Requirements

**Development:**
- Any platform with a compatible Node.js installation and a browser.
- Local backend expected at `http://localhost:3000/v1` when using the shipped dev environment.

**Production:**
- Static Angular frontend build, served separately from the backend API.
- Production API target is `https://api.dragaocareca.com/v1` in the checked-in environment file.

---

*Stack analysis: 2026-07-24*
*Update after major dependency changes*
