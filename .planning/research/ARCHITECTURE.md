# Research Architecture

**Analysis Date:** 2026-07-24

## Integration Points

The summary workflow fits into the existing manage-page architecture:

- `src/app/pages/manage/manage.component.ts`
  - owns episode form state
  - already handles transcript progress, polling, and audio upload state
- `src/app/pages/manage/episode-form.component.html`
  - already renders transcript progress bars and the summary textarea
- `src/app/core/api.service.ts`
  - should carry the expanded episode/transcription response shape

## Data Flow

1. Operator uploads a new episode audio file.
2. Backend starts transcript generation.
3. Frontend receives transcript progress updates and a summary-generation progress value from the API response or polling endpoint.
4. When the backend returns the final AI-generated summary, the UI writes it into `editor.formModel.summary`.
5. Operator can review/edit the populated summary before saving.

## Build Order

1. Extend the API response contract in `ApiService`.
2. Add state plumbing in `ManageComponent` for summary generation progress/value.
3. Surface the progress in the new episode form.
4. Verify the summary is not overwritten after it has been populated.

