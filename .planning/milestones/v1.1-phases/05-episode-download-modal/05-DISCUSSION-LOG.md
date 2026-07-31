# Phase 5: Episode Download Modal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 5-Episode Download Modal
**Areas discussed:** Artifact availability, Modal lifecycle, Progress presentation, Row action and accessibility, Partial-result messaging

## Artifact availability

The user selected existing episode-row filename metadata rather than a new preflight request. All five canonical options remain visible in fixed catalog order; available files start checked, while unavailable options are disabled and labeled “Unavailable — file not uploaded.” Human-readable labels and secondary stored filenames are preferred. Availability is based on trimmed non-empty filenames, and the backend remains authoritative for races and partial results. Reopening resets selections from current row metadata.

## Modal lifecycle

The user selected dismissible modal behavior while jobs continue in the backend, with reopening resuming the current page-session job. Completion leaves the modal open with “Archive ready” and the backend URL. Failure preserves selections and offers Retry/Close. Browser delivery is explicitly deferred to Phase 6.

## Progress presentation

The user chose a distinct determinate progress bar inside the modal, below the artifact list and above the buttons. It polls the status endpoint, shows user-facing stages and percentage, falls back to indeterminate progress when needed, and treats temporary polling failures as recoverable.

## Row action and accessibility

The user chose a dedicated Downloads table column, containing an icon-only native button with tooltip, accessible label, visible focus, and normal keyboard behavior. Modal focus moves to the heading or first checkbox and returns to the row button on close.

## Partial-result messaging

The user chose in-modal neutral warnings near progress, listing human-readable unavailable files. A partial completed job remains “Archive ready” with the warning. If all selected files disappear, the modal refreshes availability and offers retry/close without repeatedly submitting an invalid job.

## the agent's Discretion

- Concrete icon asset.
- Component extraction boundary.
- Polling interval.
- Exact TypeScript response type names.
- Page-session active-job state implementation.

## Deferred Ideas

- Native browser ZIP delivery and object URL cleanup — Phase 6.
- Job cancellation, batch downloads, and download history — future download-management scope.
