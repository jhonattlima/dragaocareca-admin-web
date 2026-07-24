---
last_mapped_commit: 8cd01e4b2b24e56458b98b8d52b55ee110a33ceb
analysis_date: 2026-07-24
---

# Codebase Concerns

**Analysis Date:** 2026-07-24

## Tech Debt

**`src/app/pages/manage/manage.component.ts` owns too much behavior:**
- Issue: One component handles episode CRUD, structured entry editing, uploads, deletions, pagination, duplicate checks, transcription polling, and suggestion caching.
- Why: The screen intentionally preserves a legacy-style all-in-one operator workflow.
- Impact: Hard to test in isolation and easy to break adjacent behavior while changing one feature.
- Fix approach: Split low-risk subflows into smaller child components or services once the UX is stable.

**Stale component test:**
- Issue: `src/app/app.component.spec.ts` asserts a title field and DOM structure that no longer exist.
- Why: The app shell was redesigned, but the spec was not updated.
- Impact: Test suite is misleading and may fail once executed.
- Fix approach: Replace the test with coverage for the current shell behavior, especially mosaic loading and router outlet rendering.

## Known Bugs

**Potential test/runtime mismatch in the root component spec:**
- Symptoms: `npm test` is likely to fail or report useless assertions.
- Trigger: Running the Angular test suite as-is.
- Workaround: None in code; the spec needs updating.
- Root cause: `AppComponent` no longer has the properties and markup the spec expects.

## Security Considerations

**Auth bypass is environment-controlled and easy to misconfigure:**
- Risk: Shipping `authBypass: true` outside local/dev would skip guard protection.
- Current mitigation: Production environment file sets `authBypass: false`.
- Recommendations: Keep the toggle explicit and verify production env packaging carefully.

**Client stores bearer token in localStorage:**
- Risk: Token is readable by any script running in the page context.
- Current mitigation: None in frontend beyond relying on the backend-issued JWT.
- Recommendations: Consider httpOnly session cookies if the backend contract is ever revised.

**Upload actions are frontend-initiated but backend-enforced:**
- Risk: The client does not validate file content beyond the file picker accept hints.
- Current mitigation: API boundaries still exist, but the frontend does not inspect file type deeply.
- Recommendations: Preserve backend-side validation and consider client-side preflight checks for user feedback.

## Performance Bottlenecks

**Manage page component size:**
- Problem: One component performs many sequential local transformations and repeated HTTP-triggered refreshes.
- Measurement: No numeric measurement available.
- Cause: Feature density and mutation-heavy state.
- Improvement path: Break out subcomponents and pure helpers when refactoring becomes necessary.

**Metrics rendering path:**
- Problem: Multiple derived series, SVG chart paths, and range recomputation happen in one page component.
- Measurement: No numeric measurement available.
- Cause: The page owns data fetch, transformation, and rendering state.
- Improvement path: Extract chart transforms to pure utilities if the page becomes slower or harder to maintain.

## Fragile Areas

**Episode editor state is mutation-heavy:**
- Why fragile: The same objects are mutated across add/edit modes, upload status, and structured-entry suggestion flows.
- Common failures: Stale pointers, partial resets, and state leaking between tabs.
- Safe modification: Keep helper methods small and reset the editor state deliberately after save/load transitions.
- Test coverage: Sparse.

**XML parsing in `FeedComponent`:**
- Why fragile: Feed preview depends on browser XML parsing and can fail on malformed payloads.
- Common failures: Parser errors or missing preview state.
- Safe modification: Keep error handling around `DOMParser` and document parsing tight.
- Test coverage: Not present.

**Background mosaic fetch in `AppComponent`:**
- Why fragile: Shell presentation depends on a backend asset manifest and `fetch()` at startup.
- Common failures: Empty background if the endpoint is missing or returns malformed data.
- Safe modification: Preserve the graceful empty-state fallback.
- Test coverage: Not present.

## Missing Critical Features

**Coverage for admin workflows:**
- Problem: Auth, episode CRUD, media upload, feed parsing, metrics, and health screens have little to no test coverage.
- Current workaround: Manual verification.
- Blocks: Safe refactors are harder than they need to be.
- Implementation complexity: Medium.

**Project-init artifacts are absent:**
- Problem: `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, and `STATE.md` do not exist yet.
- Current workaround: Use `docs/SDD.md` and the codebase map.
- Blocks: Full planning workflow is not yet unlocked.
- Implementation complexity: Depends on the next onboarding step.

## Test Coverage Gaps

**Root shell behavior:**
- What's not tested: Mosaic fetch, router outlet rendering, and fallback behavior.
- Risk: Regressions in the shell can go unnoticed.
- Priority: Medium.
- Difficulty to test: Low.

**Auth bypass and login flow:**
- What's not tested: Guard behavior, auth service bypass, and token exchange.
- Risk: Local dev and production auth paths can diverge.
- Priority: High.
- Difficulty to test: Medium.

**Manage page workflows:**
- What's not tested: Save/update, upload/delete, duplicate handling, pagination, transcription polling.
- Risk: High regression surface.
- Priority: High.
- Difficulty to test: Medium.

---

*Concerns audit: 2026-07-24*
*Update as issues are fixed or new ones discovered*
