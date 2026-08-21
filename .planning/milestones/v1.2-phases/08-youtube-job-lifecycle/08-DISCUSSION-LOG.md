# Phase 8 Discussion Log

**Date:** 2026-08-11

## Selection

The user accepted the recommended defaults for all four discussion areas:

1. Job trigger and operator status
2. Retry and cancellation
3. Restart and duplicate safety
4. Failure messaging

## Locked Decisions

- Use an explicit Upload to YouTube action for the finalized trailer.
- Show queued, uploading, processing, private-ready, failed, and canceled states.
- Show determinate transfer progress only where the provider supplies it; processing must be honest about indeterminate progress.
- Retry recoverable failures through reconciliation/idempotency; cancellation must explain accepted provider work and private leftovers.
- Persist and recover jobs across reload/restart, with one active job per episode/source identity and stale-source protection.
- Surface stable error categories and retry/reconciliation guidance while keeping provider secrets and raw failures API-only.

## Deferred

Publishing, title/hashtag authoring, artifact integration, and final workflow-wide compatibility remain in later roadmap phases.
