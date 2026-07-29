# Project Research Summary

## Key Findings

- The existing manage screen already has the right shape for this milestone: upload state, transcript polling, progress bars, and a summary textarea are all present.
- The new feature should extend the existing transcript workflow instead of introducing a parallel AI workflow.
- The frontend does not need a new dependency stack for this milestone.
- The most important implementation risk is overwriting the summary after the backend returns it or mixing upload progress with generation progress.

## Implications for Roadmap

- Phase 1 should focus on API contract and state plumbing for summary generation status/value.
- Phase 2 should wire the progress indicator and auto-fill behavior into the new episode tab.
- Phase 3 should verify failure handling and ensure the generated summary remains editable.

## Sources

- `src/app/pages/manage/manage.component.ts`
- `src/app/pages/manage/episode-form.component.html`
- `src/app/core/api.service.ts`
- `docs/README.md`
- `docs/ARCHITECTURE.md`
- `docs/CONFIGURATION.md`

