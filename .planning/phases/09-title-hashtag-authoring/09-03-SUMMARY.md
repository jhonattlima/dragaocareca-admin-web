---
phase: 09-title-hashtag-authoring
plan: 03
subsystem: ui
tags: [angular, template-driven-forms, hashtags, accessibility, youtube]

requires:
  - phase: 09-title-hashtag-authoring
    provides: ManageComponent title, hashtag, lookup, and suggestion state/orchestration
provides:
  - sectioned episode-form hashtag authoring field beside Spotify ID
  - read-only Unicode-counted trailer title preview and validation feedback
  - accessible hashtag token lookup feedback with unavailable messaging
affects: [phase-09-verification, manage-form-ui]

tech-stack:
  added: []
  patterns: [template-only orchestration bindings, scoped accessible token feedback styling]

key-files:
  created: []
  modified:
    - src/app/pages/manage/episode-form.component.html
    - src/app/pages/manage/episode-form.component.scss

key-decisions:
  - "Keep title and hashtag business logic in ManageComponent; the template only binds existing state and handlers."
  - "Render normalized hashtag tokens as keyboard-focusable affordances so hover and focus expose the same transient lookup result."
  - "Use editor-derived IDs for form descriptions so add/edit forms remain accessible when both are rendered."

patterns-established:
  - "The legacy sectioned form places authored hashtags beside read-only Spotify ID and the computed title preview below the metadata row."

requirements-completed: [TITLE-01, TITLE-02, TITLE-03, TITLE-04]

coverage:
  - id: D1
    description: "Episode form exposes editable capped hashtag authoring beside Spotify ID and binds automatic-state disabling to existing suggestion state."
    requirement: TITLE-01
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Visual placement and interaction behavior require browser inspection; Karma could not bind its sandbox port."
  - id: D2
    description: "Episode form renders the computed read-only trailer title, Unicode count, and visible over-limit validation without title editing."
    requirement: TITLE-02
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "The compiler verifies bindings, while visible read-only behavior and layout require browser inspection."
  - id: D3
    description: "Hashtag tokens expose approximate count/retrieval feedback on hover and focus, dismiss on blur/outside click, and show non-blocking unavailable messaging."
    requirement: TITLE-03
    verification:
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Hover, focus, dismissal, and responsive popup placement require browser interaction verification."
  - id: D4
    description: "Existing Save, reset, upload, and YouTube lifecycle controls remain in the established sectioned template and are untouched outside the new presentation bindings."
    requirement: TITLE-04
    verification:
      - kind: other
        ref: "git diff --check"
        status: pass
      - kind: other
        ref: "npm run build"
        status: pass
    human_judgment: true
    rationale: "Lifecycle preservation and responsive visual regression require manual UI inspection."

duration: 8min
completed: 2026-08-14
status: complete
---

# Phase 09 Plan 03: Episode Form Authoring UI Summary

**Sectioned Angular episode form with editable hashtag authoring, read-only Unicode-validated trailer title preview, and accessible lookup feedback.**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-08-14T13:43:00Z
- **Completed:** 2026-08-14T13:51:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Added the editable hashtag field beside Spotify ID, capped through the existing serializer, disabled during automatic suggestion research, and wired to existing input/focus/blur/hover/outside-click orchestration.
- Added normalized, focusable hashtag tokens with approximate count/retrieved-at feedback and recoverable unavailable messaging.
- Added the computed read-only trailer title preview, live Unicode count, visible 100-character validation, and accessible focus styling while preserving the existing form sections and lifecycle controls.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sectioned hashtag and read-only title controls** - `bfd28a9` (feat)
2. **Task 2: Style accessible hashtag tokens, popup, and validation states** - `dff4824` (style)

## Files Created/Modified

- `src/app/pages/manage/episode-form.component.html` - Hashtag field, token feedback, automatic-state messaging, title preview, count, and validation bindings.
- `src/app/pages/manage/episode-form.component.scss` - Scoped disabled, focus, token popup, unavailable feedback, title preview, validation, and responsive rules.

## Decisions Made

- Kept all authoring, validation, lookup, and lifecycle behavior in the existing `ManageComponent`; no API or component source files were changed.
- Used editor-derived element IDs to avoid duplicate accessibility references when add and edit forms coexist.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The focused command `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` could generate the browser bundle but Karma could not bind `0.0.0.0:9876` in the sandbox (`listen EPERM`). This is an environment limitation also recorded by Plan 09-02; no assertion result is claimed.
- `npm run build` passed. Angular retained existing selector-parser warnings and metrics stylesheet/initial bundle budget warnings.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

The Manage form is wired to the completed Plan 09-02 state and ready for visual/browser verification at desktop and narrow widths, including hover/focus popup dismissal and lifecycle-control regression checks.

---
*Phase: 09-title-hashtag-authoring*
*Completed: 2026-08-14*

## Self-Check: PASSED

- Summary file exists on disk.
- Task commits `bfd28a9` and `dff4824` exist in git history.
- Only the two plan-owned application files were modified; placeholder matches are pre-existing form input hints.
