---
status: complete
phase: 09-title-hashtag-authoring
source: [09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md]
started: 2026-08-14T14:12:00Z
updated: 2026-08-21T11:35:00-03:00
---

## Current Test

number: 1
name: Author hashtags and preview trailer title
expected: |
  In the New Episode form, the editable Hashtags field appears beside Spotify ID. Automatic suggestions append without erasing manual hashtags, and the read-only Trailer title preview updates to `Trailer - episode name #hashtag1 #hashtag2 #hashtag3`.
awaiting: none

## Tests

### 1. Author hashtags and preview trailer title
expected: The Hashtags field is editable beside Spotify ID; automatic suggestions append additively; the read-only Trailer title preview updates from the episode name and hashtags.
result: pass
notes: "The local configuration issue was corrected; API lookup and authoring verifiers passed, and the user accepted the resulting workflow."

### 2. Enforce the 100-character trailer title limit
expected: A title at 100 Unicode characters is accepted; a title over 100 shows a visible validation error and blocks Save/start without changing the authored episode name or hashtags.
result: pass

### 3. Check hashtag relevance feedback
expected: After about one second of typing, or when hovering/focusing a hashtag token, a transient popup shows approximate relevance and retrieval information. It dismisses on blur, tab, further typing, or outside click; lookup failures remain non-blocking.
result: pass

### 4. Preserve the YouTube publication flow
expected: Uploading a trailer starts the private YouTube job, fills the private link, and saving the episode commits the authored title, summary, and hashtags through the existing publication flow without a second browser-side YouTube flow.
result: pass

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
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

The earlier local 503 was resolved by environment configuration. The API authoring verifier and recorded user validation now cover the lookup, title-limit, and publication scenarios.
