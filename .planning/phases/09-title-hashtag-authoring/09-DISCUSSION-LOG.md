# Phase 9: Title & Hashtag Authoring - Discussion Log

> **Audit trail only.** Decisions are captured in CONTEXT.md.

**Date:** 2026-08-14
**Phase:** 9-Title & Hashtag Authoring
**Areas discussed:** Trailer title preview, automatic hashtag authoring, hashtag relevance feedback

---

## Trailer title preview

**User's choice:** Keep hashtags in a separate editable field and show a read-only trailer-name field below.
**Notes:** The preview must update automatically whenever the episode name or hashtags change. Its exact format is `Trailer - (episode name) #hashtag1 #hashtag2 #hashtag3`; fewer than three hashtags are allowed. Show an error below it when the assembled title exceeds 100 characters.

## Automatic hashtag authoring

**User's choice:** Disable the hashtag field while automatic hashtag research/upload is in progress; append generated hashtags to existing text separated by spaces.
**Notes:** Transcript, summary, and hashtag research may run asynchronously. Automatic results must not replace existing operator text, and the field becomes editable afterward.

## Hashtag relevance feedback

**User's choice:** Show approximate relevance counts after manual typing settles and on hover for both automatic and manual hashtags.
**Notes:** Use approximately a one-second typing pause. The temporary popup dismisses on tab, further typing, or clicking elsewhere. Lookup failure does not block manual hashtag use. Cache normalized relevance results in the API for approximately one hour to avoid unnecessary YouTube API calls.

## the agent's Discretion

- Exact accessible tooltip/popover mechanics and positioning.
- Normalization, deduplication, and token presentation details that preserve the requested space-separated editing behavior.
- Whether generated hashtags are delivered through existing summary polling or a dedicated API wrapper.

## Deferred Ideas

None.
