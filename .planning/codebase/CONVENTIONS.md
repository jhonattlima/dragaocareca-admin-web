---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# Coding Conventions

**Analysis Date:** 2026-07-24

## Naming Patterns

**Files:**
- Kebab-case for source files and feature folders.
- Angular component triplets use `*.component.ts`, `*.component.html`, `*.component.scss`.
- Tests use `*.spec.ts`.

**Functions:**
- camelCase for methods and helpers.
- Methods often describe the action directly: `loadEpisodes`, `saveEpisode`, `deleteUpload`.
- Async work is not specially prefixed; it is handled through Observables and component methods.

**Variables:**
- camelCase for locals and fields.
- Constants are written in `UPPER_SNAKE_CASE` when module-level (`ACCESS_TOKEN_KEY`).
- Private state uses regular camelCase field names; no underscore convention.

**Types:**
- PascalCase for interfaces, type aliases, enums, and components.
- Interfaces and type aliases are used heavily for component state and API shapes.

## Code Style

**Formatting:**
- 2-space indentation.
- Single quotes in TypeScript.
- Semicolons are used.
- Long page components rely on strict formatting and Angular template syntax rather than clever abstractions.

**Angular Style:**
- Template-driven forms dominate the UI.
- Components are class-based with decorators.
- Inputs are passed through explicit `@Input()` bindings where component decomposition is needed.

## Import Organization

**Order:**
- Angular/framework imports first.
- RxJS and other external packages next.
- Relative app imports last.

**Grouping:**
- Imports are grouped logically, but not aggressively over-abstracted.
- The codebase prefers direct relative imports over barrel files.

## Error Handling

**Patterns:**
- Component-level `subscribe({ next, error })` handlers for user-facing requests.
- Fallback messages use backend response messages when present, otherwise a local string.
- `try/catch` is used only where parsing can genuinely fail, such as JSON guest/reference parsing and XML parsing.

**UI Feedback:**
- Errors and success states are exposed as page-level strings.
- Validation failures return early before network calls.

## Comments

**When to Comment:**
- Comments are sparse.
- The code relies more on descriptive names and explicit UI labels than on narrative comments.
- SDD and templates are the main documentation layer.

**TODO Comments:**
- No strong TODO convention surfaced in the inspected files.

## Function Design

**Size:**
- Feature components are large, but helpers are extracted for repeated UI state and transformation logic.
- `ManageComponent` is intentionally dense because it owns the full admin workflow.

**Parameters:**
- Functions tend to take explicit primitive arguments or a single editor/state object.
- Methods that operate on form state usually take `(editor, field, index)` style arguments.

**Return Values:**
- Early returns are common for guard clauses and invalid input.
- Many helper methods return derived strings, booleans, or normalized arrays.

## Module Design

**Exports:**
- Named exports are preferred for shared types and services.
- Angular components are exported as classes.

**Barrel Files:**
- No barrel-file pattern surfaced in the app source.
- Direct imports are favored for clarity.

## UI/State Patterns

**State Ownership:**
- Each page owns its local mutable state.
- `ManageComponent` keeps add/edit editors, upload states, pagination state, and suggestion caches together.

**Network Flow:**
- Services orchestrate HTTP calls; pages own business-adjacent decisions such as validation, tab switching, and form staging.

**Styling:**
- Global shared theme lives in `src/styles.scss`.
- Page-level SCSS is used for layout and component-specific presentation.

---

*Convention analysis: 2026-07-24*
*Update when patterns change*
