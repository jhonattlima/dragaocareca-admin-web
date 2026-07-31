# Phase 5 Validation Architecture

## Automated Checks

| Plan | Task | Requirement evidence | Automated command |
|------|------|----------------------|-------------------|
| 05-01 | 1 | Typed selector and job contract exists | `test -f src/app/core/api.service.ts && rg -n "EpisodeArtifactSelector|EpisodeArtifactJobSnapshot|startEpisodeArtifactJob|getEpisodeArtifactJobStatus|artifacts/jobs" src/app/core/api.service.ts` |
| 05-01 | 2 | Exact start/status HTTP boundary and snapshot handling | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/core/api.service.spec.ts'` |
| 05-02 | 1 | Five ordered options, availability, defaults, and retained state | `rg -n "EpisodeArtifact|fileName|coverLowFileName|transcriptFileName|open.*Artifact|close.*Artifact|selected.*Artifact" src/app/pages/manage/manage.component.ts` |
| 05-02 | 2 | Start guard, polling, terminal states, and focus lifecycle | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` |
| 05-03 | 1 | Episodes-table action and accessible dialog markup | `rg -n "Downloads|Download episode artifacts|role=\"dialog\"|aria-modal|type=\"checkbox\"|Archive ready|Retry" src/app/pages/manage/manage.component.html` |
| 05-03 | 2 | Modal styling is present and build remains valid | `rg -n "artifact|download|modal|focus|progress" src/styles.scss && npm run build` |
| 05-03 | 3 | UI-01 through UI-06 component and keyboard coverage | `npm test -- --watch=false --browsers=ChromeHeadless --include='src/app/pages/manage/manage.component.spec.ts'` |

## Sampling Rules

- Every implementation task has an automated verification command.
- No command uses watch mode; all focused test commands terminate with `--watch=false`.
- Wave 1: 2/2 implementation tasks automated.
- Wave 2: 2/2 implementation tasks automated.
- Wave 3: 3/3 implementation tasks automated.
- Full build is required in the plan-level verification for 05-02 and 05-03.

## Manual Boundary Checks

- Keyboard-only Episodes-tab flow: open the row action, verify modal focus entry, Tab/Shift+Tab containment, Escape close, and invoker focus restoration.
- Verify the Add episode tab and its existing upload/transcript/summary progress are unchanged.
- Verify Phase 5 displays `downloadUrl` as state data only and does not trigger native ZIP delivery; browser delivery and object URL cleanup remain Phase 6.
