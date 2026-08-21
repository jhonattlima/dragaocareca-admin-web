# Phase 7: Final Trailer Video Upload - Discussion Log

> **Audit trail only.** Decisions are captured in `07-CONTEXT.md`.

**Date:** 2026-08-03
**Phase:** 7-final-trailer-video-upload
**Areas discussed:** upload timing and lifecycle, replacement safety, cancellation/retry, File Management presentation

## Upload timing and lifecycle

| Option | Description | Selected |
|---|---|---|
| Upload with episode creation | Send the video during initial episode creation | |
| Upload after episode exists | Use the existing episode ID and media-upload flow | ✓ |

**User's choice:** Selecting the trailer file immediately starts the upload using the episode ID already present in the form, before the final Save episode action.
**Notes:** Phase 7 must reconcile this pre-save upload timing with the existing API route's episode lookup and preserve the staging/promotion flow.

## Replacement safety

| Option | Description | Selected |
|---|---|---|
| Replace immediately | Remove the existing trailer when selection starts | |
| Atomic replacement | Preserve the existing final file until the new upload succeeds | ✓ |

**User's choice:** Same flow as the other files.
**Notes:** The existing media pattern governs replacement and promotion.

## Cancellation and retry

| Option | Description | Selected |
|---|---|---|
| Cancel and discard selection | Require a new file selection after cancel | |
| Preserve selection | Keep the chosen file available for retry or replacement | ✓ |

**User's choice:** Cancellation should preserve the selected file and allow changing it if needed.
**Notes:** Browser cancellation is local request cancellation; the prior finalized trailer remains safe.

## File Management presentation

| Option | Description | Selected |
|---|---|---|
| Dedicated card beside existing media cards | Follow the established File Management upload-card layout | ✓ |
| Separate workflow screen | Move trailer-video upload to a new screen | |

**User's choice:** Sure — use the existing File Management card treatment.
**Notes:** YouTube actions are deferred to later phases.

## the agent's Discretion

- Exact copy, iconography, spacing, and helper text within existing patterns.
- Whether to generalize the upload helper or add a video-specific definition.

## Deferred Ideas

- YouTube upload/publishing workflow belongs to Phases 8–9.
- Episodes artifact download integration belongs to Phase 11.
