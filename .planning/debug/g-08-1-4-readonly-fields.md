---
status: resolved
trigger: "Diagnose UAT gap G-08.1-4 only; do not implement fixes. Investigate why Duration and Bytes are not visibly read-only despite the intended styling, and verify the requirement scope excludes Spotify ID. Read the UAT, phase context/research/summaries, episode form template/SCSS, browser/CSS conventions, and relevant generated/compiled styling behavior. Create a debug session under .planning/debug/ with evidence and return ## ROOT CAUSE FOUND (or ## INVESTIGATION INCONCLUSIVE), files involved, and a precise fix direction. Preserve unrelated changes."
created: 2026-08-14T00:00:00-03:00
updated: 2026-08-21T11:35:00-03:00
---

## Current Focus

hypothesis: Duration and Bytes are technically readonly and receive the compiled class, but the implementation's styling is too weak to communicate readonly status because it changes only low-contrast colors while Bootstrap preserves the normal editable control border/focus affordance; Spotify ID is outside G-08.1-4.
test: Verify source/template attributes, compiled selector, Bootstrap cascade, and color contrast; attempt browser/runtime inspection and record its availability.
expecting: The class will be present and win the background/color cascade, while the remaining visual affordance will explain why UAT still perceives the fields as editable.
next_action: Return the diagnosis with the exact files and minimal fix direction; do not modify application code.

## Symptoms

expected: Duration and Bytes should be visibly read-only using the intended light-gray styling; Spotify ID should be checked for scope but not assumed part of this gap.
actual: Duration and Bytes are not visibly read-only despite intended styling.
errors: None reported.
reproduction: Inspect the episode form fields in the browser and compare Duration/Bytes appearance and interaction affordance with the intended read-only styling.
started: Reported as UAT gap G-08.1-4.

## Evidence

- timestamp: 2026-08-14T00:00:00-03:00
  checked: Project documentation and debugger/common-pattern instructions
  found: The canonical contract states Duration, Bytes, and Spotify ID are native read-only fields with light-gray styling and no hint text; episode-audio metadata is API-confirmed.
  implication: The investigation must distinguish the styling defect from the broader read-only contract and verify the UAT gap's exact scope.

- timestamp: 2026-08-14T00:00:00-03:00
  checked: Phase UAT, context, research, validation, verification, and summaries
  found: G-08.1-4 explicitly asserts only Duration and Bytes; its reason says the reported fields are Duration and Bytes, not Spotify ID. FORM-05/D-12/D-13 at phase scope still includes Spotify ID, and G-08.1-2 separately covers the three-field truth.
  implication: Spotify ID is excluded from this diagnosis's gap acceptance criterion, but remains a separate phase requirement and separate G-08.1-2 concern.

- timestamp: 2026-08-14T00:00:00-03:00
  checked: Episode form template and component metadata
  found: Duration and Bytes each have native `readonly` and `readonly-field`; Bytes is a text input bound through `[value]` to formatted decimal MB. Spotify ID also has native `readonly` and `readonly-field`. `EpisodeFormComponent` owns the template and `episode-form.component.scss`.
  implication: The intended class and native read-only behavior are wired in source for all three fields; the defect is downstream of template wiring or is a perceptual/cascade issue.

- timestamp: 2026-08-14T00:00:00-03:00
  checked: Angular production artifacts and Bootstrap CSS
  found: The generated main bundle contains the three `readonly-field` class bindings and the component style `.readonly-field[_ngcontent-%COMP%]{background-color:#f1f3f5;color:#6c757d}`. Bootstrap's `.form-control` uses `background-color:var(--bs-body-bg)` and `color:var(--bs-body-color)` at lower selector specificity; the component selector should win when Angular injects the style.
  implication: The built artifact is not missing the rule or losing it to Bootstrap specificity; source inspection alone cannot reproduce the reported visual result.

- timestamp: 2026-08-14T11:52:47-03:00
  checked: `npm run build`
  found: Production build passed. Angular emitted only the existing selector-parser and bundle/style budget warnings; the generated bundle still contains the component-scoped readonly rule and all three class bindings.
  implication: The current source compiles successfully, so the UAT gap is not caused by a TypeScript/template compilation failure.

- timestamp: 2026-08-14T11:52:47-03:00
  checked: Bootstrap 5.3.8 form-control conventions and available browser runtime
  found: Bootstrap defines normal `.form-control` background, border, transition, and `:focus` affordances, but no `.form-control[readonly]` visual rule; only disabled controls receive Bootstrap's muted background/opacity treatment. The custom `#f1f3f5` background has only 1.112:1 contrast against white, so it is an extremely subtle tint. Angular dev-server binding and Playwright's cached Chromium executable were unavailable in this sandbox, so live computed-style capture could not run.
  implication: Native readonly semantics prevent editing, but the custom visual treatment leaves the control structurally/editably styled and changes color by an imperceptibly small amount. This directly explains the UAT perception while identifying the runtime-browser check as an evidence limitation, not a source/build failure.

## Eliminated

- hypothesis: The `readonly-field` class or native `readonly` attribute is absent from Duration and Bytes.
  evidence: Both controls have the class and native attribute in the template; the compiled Angular template contains both bindings.
  timestamp: 2026-08-14T11:52:47-03:00

- hypothesis: Bootstrap overrides the custom readonly colors because of selector specificity or stylesheet order.
  evidence: Bootstrap's relevant rules target `.form-control`, `:focus`, and `:disabled`, while Angular emits `.readonly-field[_ngcontent-%COMP%]`, which has higher specificity and is included in the built main bundle.
  timestamp: 2026-08-14T11:52:47-03:00

## Resolution

root_cause: "The Duration and Bytes controls are wired as native readonly and the `.readonly-field` rule is present in the compiled Angular bundle, but the visual implementation only changes background to #f1f3f5 and text to #6c757d. Bootstrap continues to supply the normal form-control border/focus affordance, and the background tint has only 1.112:1 contrast against white. Native readonly has no browser-default disabled appearance, so the fields remain visually indistinguishable enough from editable controls to fail G-08.1-4's human visual check."
fix: "Strengthen the readonly presentation at the EpisodeForm field boundary: target the readonly controls explicitly (for example `.form-control.readonly-field[readonly]` or an equivalent `:read-only` selector) and define a clearly perceptible readonly treatment that preserves accessibility, including a stronger background/border/text distinction and suppressing editable-only focus/cursor affordances as appropriate. Do not change metadata binding or API behavior."
verification:
  status: resolved_by_phase_uat
  evidence: "08.1-UAT.md retest 5 passed; production build passed; current readonly template and styling remain present."
files_changed:
  - src/app/pages/manage/episode-form.component.html
  - src/app/pages/manage/episode-form.component.scss
