# Phase 9: Title & Hashtag Authoring - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add the operator-facing trailer metadata authoring experience to the existing New Episode flow: a separately editable hashtag field with asynchronous API-generated suggestions and approximate relevance counts, plus a read-only preview of the final YouTube trailer title. This phase consumes the existing Phase 8 private-transfer and Save-time publication contract; it does not add a second YouTube publication flow.

</domain>

<decisions>
## Implementation Decisions

### Trailer title preview
- **D-01:** Keep hashtags in a separate editable field; do not make the trailer title itself directly editable in this phase.
- **D-02:** Show a read-only trailer-name field below the existing form fields. Compose it dynamically as `Trailer - {episode name} #hashtag1 #hashtag2 #hashtag3`.
- **D-03:** Recompute the read-only preview whenever the episode name or hashtags change, whether the value was typed manually or inserted asynchronously.
- **D-04:** Display a clear validation error below the preview when the assembled title exceeds 100 Unicode characters. The existing Save/start flow must treat this as invalid.

### Hashtag authoring and automatic suggestions
- **D-05:** Place the hashtag field beside the read-only Spotify ID field, matching the existing sectioned episode-form layout.
- **D-06:** Permit up to three hashtags, while allowing fewer when the operator prefers or the 100-character title limit requires it.
- **D-07:** During the API's automatic hashtag-research/upload state, disable the hashtag field like the read-only metadata fields. When generated hashtags arrive, append them to any existing field contents separated by spaces rather than replacing operator text.
- **D-08:** Automatic hashtag suggestions may arrive asynchronously alongside transcript/summary generation and should populate the form when available.
- **D-09:** Preserve manual editing. An operator can add, remove, or alter hashtags after the automatic state is complete; automatic results must not erase existing text.

### Hashtag relevance feedback
- **D-10:** For manual input, wait until the operator stops typing for approximately one second, then request/display the hashtag's approximate public YouTube-result relevance count.
- **D-11:** The same approximate count must be discoverable by hovering a hashtag, regardless of whether it was generated automatically or entered manually.
- **D-12:** The temporary count popup should dismiss when the operator tabs away, types again, or clicks elsewhere. Lookup failures are non-blocking because the operator can continue with manually entered hashtags.

### the agent's Discretion
- Exact tooltip/popover positioning and accessible hover/focus equivalent.
- Exact normalization, duplicate handling, and visual tokenization used to represent the space-separated hashtag field, provided manual text is preserved and the API contract remains authoritative.
- Whether automatic suggestions are exposed through the existing summary/status polling response or a dedicated typed API wrapper, based on the sibling API contract.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and requirements
- `.planning/ROADMAP.md` — Phase 9 boundary, requirements, and success criteria.
- `.planning/REQUIREMENTS.md` — TITLE-01 through TITLE-04 and the completed Phase 8 YouTube requirements.
- `.planning/PROJECT.md` — frontend architecture, thin-client constraint, and milestone goals.

### Frontend architecture and contracts
- `docs/README.md` — feature map and backend contract assumptions.
- `docs/ARCHITECTURE.md` — ManageComponent/API boundary, summary polling, and YouTube lifecycle ownership.
- `docs/CONFIGURATION.md` — environment and episode-form contract assumptions.
- `.planning/codebase/CONVENTIONS.md` — Angular/template-driven form and styling conventions.
- `.planning/codebase/STRUCTURE.md` — source locations and integration points.
- `.planning/codebase/STACK.md` — Angular, Bootstrap, RxJS, and test/build constraints.

### Sibling API contract
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — existing hashtag lookup, episode summary, and YouTube lifecycle routes.
- `../dragaocareca-admin-api/src/docs/openapi.ts` — hashtag lookup DTO, publication metadata limits, normalization, approximate count, and error-state contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/pages/manage/manage.component.ts` — owns mutable episode editor state, summary/transcript polling, YouTube job state, and form validation helpers.
- `src/app/pages/manage/episode-form.component.html` — sectioned template-driven form where Spotify ID, summary, YouTube link, and trailer lifecycle controls are rendered.
- `src/app/core/api.service.ts` — typed HTTP boundary for episode generation and YouTube lifecycle requests.

### Established Patterns
- ManageComponent stores form values locally and polls backend-owned asynchronous states; late responses are guarded against stale editor/source state.
- Business rules remain API-owned; Angular performs presentation/orchestration and user-facing early validation.
- Bootstrap 5 sectioned cards and page-level messages are the established visual language.

### Integration Points
- Generated summary status polling already updates the Summary field after transcript completion; the hashtag integration should extend that asynchronous editor update without overwriting manual summary or hashtag changes.
- `startYoutubeTrailerJob` and `commitYoutubeTrailerJob` already send title/summary/hashtags through the Phase 8 API boundary; Phase 9 should feed the authored hashtag values into that existing contract.
- `episode-form.component.html` and its Manage stylesheet are the primary UI placement points; `ApiService` is the only browser/API integration point.

</code_context>

<specifics>
## Specific Ideas

- The visual arrangement requested is: hashtags beside Spotify ID, and the read-only trailer-name preview below.
- The title format is exactly `Trailer - (episode name) #hashtag1 #hashtag2 #hashtag3`.
- Hashtag relevance should feel immediate: show it after roughly one second of typing and on mouse hover, with the transient popup disappearing on typing, tabbing, or clicking elsewhere.
- Automatic hashtag results should be additive when the field already contains text, not destructive.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 9 scope.

</deferred>

---

*Phase: 9-Title & Hashtag Authoring*
*Context gathered: 2026-08-14*
