---
phase: 09-title-hashtag-authoring
plan: 02
subsystem: ui
tags: [angular, rxjs, hashtags, youtube, jasmine]

requires:
  - phase: 09-title-hashtag-authoring
    provides: canonical sibling API title/hashtag save, start, commit, and lookup contracts
provides:
  - typed suggested-tag summary and hashtag lookup API DTOs/wrappers
  - guarded additive hashtag suggestion polling and canonical authoring state
  - Unicode-aware read-only trailer title validation and separate publication metadata wiring
  - cancellable one-second manual/hover/focus hashtag lookup state
affects: [09-03-title-hashtag-authoring-template]

tech-stack:
  added: []
  patterns: [guarded RxJS polling, WeakMap editor lifecycle state, canonical hashtag serialization]

key-files:
  created: []
  modified:
    - src/app/core/api.service.ts
    - src/app/core/api.service.spec.ts
    - src/app/pages/manage/manage.component.ts
    - src/app/pages/manage/manage.component.spec.ts

key-decisions:
  - "Keep authored hashtags separate from generic episode tags; suggestions merge additively and preserve manual token text."
  - "Send the API title prefix and canonical hashtag array separately because the sibling API assembles and validates the final title."
  - "Use editor-generation, lookup-token, timer, and subscription guards so reset/input/dismissal cannot accept stale asynchronous responses."

patterns-established:
  - "Summary polling remains the single source for summary and suggestedTags state, and continues while either asynchronous concern is non-terminal."
  - "The preview uses assembled title state while start/commit use the API's title-prefix-plus-hashtags contract."

requirements-completed: [TITLE-01, TITLE-02, TITLE-03, TITLE-04]

coverage:
  - id: D1
    description: "Typed summary suggestedTags and hashtag lookup DTOs are exposed through authenticated ApiService wrappers."
    requirement: TITLE-03
    verification:
      - kind: unit
        ref: "src/app/core/api.service.spec.ts"
        status: unknown
      - kind: other
        ref: "./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit"
        status: pass
    human_judgment: true
    rationale: "Focused Jasmine assertions could not run because Karma was unable to bind port 9876 in the execution sandbox."
  - id: D2
    description: "ManageComponent merges suggestions additively, preserves generic tags/manual summary behavior, and rejects assembled titles over 100 Unicode code points."
    requirement: TITLE-01
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts"
        status: unknown
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "The focused browser test launcher was blocked by the sandbox port restriction; TypeScript and production build verification passed."
  - id: D3
    description: "Manual, hover, and focus hashtag lookups debounce for one second, cancel stale work, dismiss transient feedback, and wire safe results."
    requirement: TITLE-03
    verification:
      - kind: unit
        ref: "src/app/pages/manage/manage.component.spec.ts"
        status: unknown
    human_judgment: true
    rationale: "Runtime Jasmine assertions remain pending because Karma could not bind 0.0.0.0:9876 in the sandbox."
  - id: D4
    description: "Save, private YouTube start, and Save-time commit use the canonical authored hashtag serializer and sibling API metadata contract."
    requirement: TITLE-02
    verification:
      - kind: unit
        ref: "src/app/core/api.service.spec.ts and src/app/pages/manage/manage.component.spec.ts"
        status: unknown
      - kind: other
        ref: "./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit"
        status: pass
    human_judgment: true
    rationale: "Focused Jasmine assertions could not run due to the environment-only Karma bind failure."

duration: 27min
completed: 2026-08-14
status: complete
---

# Phase 09 Plan 02: Frontend Title and Hashtag Authoring Summary

**Angular summary-driven hashtag authoring with additive suggestions, Unicode title validation, cancellable lookup feedback, and canonical YouTube metadata payloads**

## Performance

- **Duration:** 27 minutes
- **Started:** 2026-08-14T13:20:00Z
- **Completed:** 2026-08-14T13:47:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added typed `SuggestedTagsSnapshot`, retrieval, and `HashtagLookupResponse` contracts, including the authenticated lookup wrapper and required commit metadata body.
- Extended existing summary polling with editor-generation guards, additive capped suggestion merging, terminal-state handling, and preserved manual summary/generic episode tag behavior.
- Added separate authored hashtag state, canonical serialization, assembled read-only title preview/100-code-point validation, cancellable one-second lookup state, popup dismissal, and Save/start/commit wiring.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add typed summary-suggestion and hashtag-lookup orchestration** - `22f0866` (test RED), `2eaaf14` (feat GREEN)
2. **Task 2: Implement canonical title/hashtag state, validation, debounce, and publication payloads** - `90e3f0a` (fix/contract correction)

## Files Created/Modified

- `src/app/core/api.service.ts` - typed suggestion/lookup DTOs, lookup wrapper, and `{jobId?, title, hashtags}` commit body.
- `src/app/core/api.service.spec.ts` - DTO, lookup, and commit contract coverage.
- `src/app/pages/manage/manage.component.ts` - editor state, guarded polling merge, title validation, lookup lifecycle, and publication payload orchestration.
- `src/app/pages/manage/manage.component.spec.ts` - additive merge, Unicode validation, debounce, stale response, and metadata coverage.

## Decisions Made

- Kept generic `Episode.tags` untouched and introduced `EpisodeFormState.hashtags` as the separate authored field.
- Preserved manual hashtag token text during automatic additive merges while serializing API payloads canonically and capping at three.
- Sent the read-only title prefix separately from hashtags because the sibling API owns final assembly and validation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected duplicate hashtag suffix risk in publication payloads**
- **Found during:** Task 2 contract verification
- **Issue:** The initial implementation sent the fully assembled preview as `title` and also sent `hashtags`, which would make the API append the hashtags twice.
- **Fix:** Added a title-prefix helper; preview/validation remain assembled, while start and commit send the prefix plus separate canonical hashtags.
- **Files modified:** `src/app/pages/manage/manage.component.ts`, `src/app/core/api.service.spec.ts`, `src/app/pages/manage/manage.component.spec.ts`
- **Verification:** Spec TypeScript compilation and `npm run build` passed.
- **Committed in:** `90e3f0a`

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Required for exact sibling API contract correctness; no scope expansion.

## Issues Encountered

- The required focused Karma command reached bundle setup but could not start because the sandbox denied binding `0.0.0.0:9876` with `listen EPERM`. Spec TypeScript compilation and production build passed; no assertion result is claimed.
- `npm run build` retains existing Angular selector-parser and bundle/metrics budget warnings; no unrelated files were changed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 09-03 can bind the existing template to `formModel.hashtags`, read-only trailer title helpers, lookup feedback/dismissal methods, and suggestion-state guards without changing API or component business logic.

## Self-Check: PASSED

- Summary file exists at `.planning/phases/09-title-hashtag-authoring/09-02-SUMMARY.md`.
- Plan commits `22f0866`, `2eaaf14`, and `90e3f0a` exist in git history.
- The four plan-owned frontend files are the only application files changed.

---
*Phase: 09-title-hashtag-authoring*
*Completed: 2026-08-14*

## Self-Check: PASSED

- Summary file and all task commits verified on disk.
