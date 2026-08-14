---
status: partial
phase: 09-title-hashtag-authoring
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md]
started: 2026-08-14T14:12:00Z
updated: 2026-08-14T14:18:00Z
---

## Current Test

number: 1
name: Author hashtags and preview trailer title
expected: |
  In the New Episode form, the editable Hashtags field appears beside Spotify ID. Automatic suggestions append without erasing manual hashtags, and the read-only Trailer title preview updates to `Trailer - episode name #hashtag1 #hashtag2 #hashtag3`.
awaiting: user response

## Tests

### 1. Author hashtags and preview trailer title
expected: The Hashtags field is editable beside Spotify ID; automatic suggestions append additively; the read-only Trailer title preview updates from the episode name and hashtags.
result: issue
reported: "Please update the label Hashtags to Youtube Trailer Hashtags. Hashtag lookup returned HTTP 503 from the local API, so testing could not proceed."
severity: major

### 2. Enforce the 100-character trailer title limit
expected: A title at 100 Unicode characters is accepted; a title over 100 shows a visible validation error and blocks Save/start without changing the authored episode name or hashtags.
result: pending

### 3. Check hashtag relevance feedback
expected: After about one second of typing, or when hovering/focusing a hashtag token, a transient popup shows approximate relevance and retrieval information. It dismisses on blur, tab, further typing, or outside click; lookup failures remain non-blocking.
result: pending

### 4. Preserve the YouTube publication flow
expected: Uploading a trailer starts the private YouTube job, fills the private link, and saving the episode commits the authored title, summary, and hashtags through the existing publication flow without a second browser-side YouTube flow.
result: pending

### 5. Authored metadata survives API lifecycle and cache checks
expected: Automated API lifecycle, Unicode boundary, normalized lookup/cache, quota/error, retry, and OpenAPI checks pass.
result: pass
source: automated

### 6. Frontend build and complete browser suite
expected: `npm run build` succeeds and the complete ChromeHeadless Angular suite passes.
result: pass
source: automated

## Summary

total: 6
passed: 2
issues: 1
pending: 3
skipped: 0
blocked: 0

## Gaps

- truth: "Hashtag lookup returns a usable relevance response in local development"
  status: failed
  reason: "User reported: POST /v1/episodes/356/hashtag-lookup returned HTTP 503 repeatedly, blocking UAT."
  severity: major
  test: 1
  root_cause: "YOUTUBE_HASHTAG_AUTHORING_ENABLED was absent from .env.dev, so API configuration defaulted hashtag lookup to disabled."
  artifacts:
    - path: "../dragaocareca-admin-api/src/config/env.ts"
      issue: "Missing flag defaults the feature to disabled."
    - path: "../dragaocareca-admin-api/.env.dev"
      issue: "Development environment lacked hashtag-authoring settings."
  missing:
    - "Restart the local API after enabling hashtag authoring and verify the YouTube OAuth credentials can perform search.list."
  debug_session: ""
