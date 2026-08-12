# Deferred Items

## Downstream Phase 8 Manage RED specs

The focused Angular Karma command cannot compile because `src/app/pages/manage/manage.component.spec.ts` contains RED expectations for the downstream 08-04 Manage integration (`restoreCurrentYoutubeTrailerJob`, polling helpers, and related lifecycle state). Those files are outside 08-03 scope and were not modified. Plan 08-04 owns resolving these expectations.
