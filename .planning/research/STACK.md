# Research Stack Notes

**Analysis Date:** 2026-07-24

## Summary

The summary workflow does not require a new frontend dependency stack.

The current Angular app already has the needed primitives:

- `HttpClient` for episode/status polling
- mutable form state in `ManageComponent`
- progress rendering in `episode-form.component.html`
- transcript polling helpers and timestamp/progress state

## Implications

- Keep the feature inside the existing Angular 15 + TypeScript + Bootstrap stack.
- Reuse the existing `ApiService` and `ManageComponent` state machine instead of adding a new client library or global store.
- Any new progress fields should follow the existing episode/transcript naming style in `src/app/core/api.service.ts`.

