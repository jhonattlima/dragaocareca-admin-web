# Phase 9: Title & Hashtag Authoring - Research

**Researched:** 2026-08-14  
**Domain:** Angular 15 episode authoring, asynchronous summary/hashtag generation, YouTube Data API hashtag search, and Phase 8 publication metadata  
**Confidence:** HIGH for repository/API behavior; MEDIUM for external YouTube/Angular semantics

## Summary

The sibling API already implements the backend foundation for this phase. After a summary reaches `done`, it creates a versioned suggested-tag work item grounded in the transcript and summary, processes it through a single automatic lookup lane, persists up to three suggestions, and exposes that state through `GET /v1/episodes/:episodeId/episodes-generated-summary`. The same API exposes authenticated `POST /v1/episodes/:episodeId/hashtag-lookup`, normalizes input to NFKC/lower-case `#tag`, returns an explicitly approximate count and retrieval timestamp, and persists cache/quota state in SQLite. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts]

The frontend is not yet consuming that contract. `ManageComponent` has the correct local mutable-editor and 2-second transcript/summary polling pattern, including a manual-summary guard against late generated text, but its DTO/state has no `suggestedTags`, no hashtag lookup wrapper, no separate hashtag field, and no assembled trailer-title validation. Its current `tags` list is an older generic episode-tag UI; YouTube start/commit already serializes up to three tags, but Save-time API commit currently derives title and tags from the persisted episode and ignores the start request's final title. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: src/app/core/api.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

**Primary recommendation:** extend the existing API DTO and summary poll path for automatic suggestions, add a separate API-authoritative hashtag lookup wrapper with cancellable ~1-second client debounce, preserve manual text while appending generated values, and make the API’s Save-time publication metadata consume the authored hashtag/title contract before wiring the read-only preview and validation into the existing sectioned form.

## User Constraints (from CONTEXT.md)

### Locked Decisions

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
- **D-13:** The API should cache normalized hashtag relevance results for approximately one hour, including results reused across repeated typing/hover lookups, to avoid unnecessary YouTube API calls.

### the agent's Discretion
- Exact tooltip/popover positioning and accessible hover/focus equivalent.
- Exact normalization, duplicate handling, and visual tokenization used to represent the space-separated hashtag field, provided manual text is preserved and the API contract remains authoritative.
- Whether automatic suggestions are exposed through the existing summary/status polling response or a dedicated typed API wrapper, based on the sibling API contract.
- Exact cache storage/eviction mechanics, provided the normalized hashtag key has an approximately one-hour freshness window and the API remains the authority.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within Phase 9 scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TITLE-01 | UI suggests a trailer title using `Trailer - {episode name}` and selected hashtag values while allowing editing before upload or publish. | Context D-01/D-02 make the preview read-only; this conflicts with the requirement wording and must be reconciled before implementation. Existing Phase 8 start accepts title, but Save commit currently recomputes it. |
| TITLE-02 | API/UI enforce 100 Unicode characters and explain invalid title characters without overwriting edits. | API has `max(100)` title validation and Unicode hashtag regex, but does not yet validate the assembled `Trailer - ... #tags` string in the Save path. |
| TITLE-03 | User can enter hashtag and request an approximate matching public YouTube result count with retrieval time. | Existing authenticated `POST /:episodeId/hashtag-lookup` and `HashtagLookupResponse` already provide normalized tag, approximate count, retrievedAt, source, cache status, and error state. |
| TITLE-04 | Lookup is normalized, debounced/triggered, cached/rate-limited by API, and exposes recovery. | API normalizes and caches in SQLite with admission quotas; frontend still needs debounce/cancellation, hover/focus display, typed DTO, and non-blocking error handling. |

## Project Constraints (from AGENTS.md)

- Read `docs/README.md`, then `docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md`; those documents are the UI architecture and backend-contract source of truth. [VERIFIED: AGENTS.md]
- Keep business logic in the backend; the frontend orchestrates API calls. [VERIFIED: AGENTS.md]
- Preserve the sectioned, legacy-inspired functional layout; do not replace it with a minimalist placeholder. [VERIFIED: AGENTS.md]
- Respect the `authBypass` environment toggle. [VERIFIED: AGENTS.md]
- Verify the frontend with `npm run build` before finalizing. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Automatic hashtag generation from transcript/summary | API / Backend | Frontend Server — | Transcript trust boundaries, Gemini calls, YouTube calls, retries, quota, persistence, and sanitized DTOs already belong to the API. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts] |
| Summary/transcript status and suggestion polling | Frontend Server | API / Backend | ManageComponent owns editor polling and stale-editor guards; API owns durable status. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts] |
| Hashtag normalization/count lookup | API / Backend | Browser / Client | API normalization/cache/quota is authoritative; browser only debounces, renders, and cancels stale requests. [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] |
| Hashtag field/token display and title preview | Browser / Client | API / Backend | The form owns transient authoring/display state; API revalidates metadata at job/publication boundaries. [VERIFIED: src/app/pages/manage/episode-form.component.html] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] |
| Final title/hashtag publication metadata | API / Backend | Browser / Client | Save/commit must be the durable authority and must not rely on browser-side YouTube calls. [VERIFIED: docs/ARCHITECTURE.md] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 15.x in project lockfile | Component/template orchestration and change detection | Existing application framework; do not migrate for this phase. [VERIFIED: package.json] |
| Angular `FormsModule` / `ngModel` | Angular 15.x | Template-driven episode form binding and validation | Existing Manage form uses mutable `[(ngModel)]`; Angular documents `NgModel` as the bridge between view and model. [VERIFIED: src/app/pages/manage/episode-form.component.html] [CITED: https://angular.dev/guide/forms/template-driven-forms] |
| RxJS | project lockfile version | HTTP Observables, cancellation, and lifecycle cleanup | Existing `ApiService` and Manage polling use Observables/subscriptions. [VERIFIED: package.json] [VERIFIED: src/app/pages/manage/manage.component.ts] |
| Bootstrap | project lockfile version | Sectioned form layout, validation messaging, and popover-adjacent styling | Existing visual language is Bootstrap 5 sectioned cards/forms. [VERIFIED: docs/README.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@angular/common/http` | Angular 15.x | Typed authenticated lookup request through `ApiService` | Use for the one new manual lookup route; never call YouTube from the browser. [VERIFIED: src/app/core/api.service.ts] [VERIFIED: docs/ARCHITECTURE.md] |
| Browser timer/subscription cleanup | platform + RxJS | ~1-second debounce and stale request suppression | Match the existing timer/`Subscription` patterns; cancel on input, blur/tab, editor reset, and destroy. [VERIFIED: src/app/pages/manage/manage.component.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Existing template-driven editor state | Migrate the whole form to reactive forms | Angular documents reactive forms as more scalable/testable, but a migration would expand Phase 9 and risk unrelated form regressions; add narrowly scoped state/helpers instead. [CITED: https://angular.dev/guide/forms] [VERIFIED: docs/ARCHITECTURE.md] |
| Existing summary polling response | Add a dedicated suggestions endpoint | The API already returns `suggestedTags` in the summary snapshot; a new endpoint duplicates polling and creates a second source of truth. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] |
| Server-side normalized cache | Browser-only cache | Browser cache cannot enforce shared one-hour freshness, quota admission, or cross-operator reuse; API cache is already persisted and keyed by normalized tag/region/language/search shape. [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts] |

**Installation:** No new package installation is recommended for this phase. [VERIFIED: package.json]

## Architecture Patterns

### System Architecture Diagram

```text
Audio upload
   -> API transcript worker
   -> API summary worker
   -> API suggested-tag authoring (transcript + summary)
      -> normalize candidates -> SQLite/API YouTube lookup cache -> up to 3 suggestions
   -> GET summary snapshot poll
      -> Angular stale-editor guard -> append suggestions to separate hashtag field

Operator types/hover-focus hashtag
   -> Angular ~1s debounce / stale-request cancellation
   -> authenticated ApiService POST hashtag-lookup
      -> API normalize NFKC/lower-case
      -> fresh SQLite cache hit OR quota admission -> YouTube search.list
      -> approximate count + retrievedAt OR recoverable unavailable response
   -> transient popup; dismiss on input, blur/tab, outside click

Episode name + authored hashtags
   -> Angular computed read-only `Trailer - {episode name} #tag1 #tag2 #tag3`
   -> assembled Unicode-length / forbidden-character early validation
   -> existing save/start/commit metadata boundary
   -> API authoritative validation and YouTube publication
```

### Recommended Project Structure

```text
src/app/core/api.service.ts                 # typed SuggestedTags + HashtagLookup DTOs/wrapper
src/app/pages/manage/manage.component.ts   # editor state, title/hashtag derivation, debounce, polling merge
src/app/pages/manage/episode-form.component.html # field beside Spotify, read-only preview, transient feedback
src/app/pages/manage/manage.component.scss # token/popup/validation styling in existing layout
src/app/pages/manage/*.spec.ts              # DTO, merge, validation, debounce/stale-response tests
../dragaocareca-admin-api/src/routes/episodes.routes.ts
../dragaocareca-admin-api/src/services/*hashtag*
../dragaocareca-admin-api/src/services/episode-summary.service.ts
```

### Pattern 1: Version-guarded additive polling merge

**What:** Extend the existing summary poll response with `suggestedTags`; when status is `done`, append only normalized suggestion values that are not already represented in the operator’s field. Do not assign the complete generated string to the field. Keep a per-editor/version guard so a late response cannot update a reset or newer editor. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts]

**When to use:** Whenever automatic summary/tag work can finish after manual edits or after the active episode changes. [VERIFIED: src/app/pages/manage/manage.component.ts]

### Pattern 2: Debounced lookup with stale-response protection

**What:** On manual input, clear the previous timer and popup, wait approximately 1 second after the last input, then request only the current normalized token. Cancel/unsubscribe the previous request or ignore it using a monotonically increasing lookup token; update feedback only if the token, editor, and current tag still match. [ASSUMED]

**When to use:** Manual typing and hover/focus lookup of a token. The API’s single lookup lane and quota admission make duplicate browser requests materially costly. [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts]

### Pattern 3: One canonical serializer at all Phase 8 boundaries

**What:** Normalize the authored space-separated field into zero to three canonical `#tag` values once, use that serializer for title preview and start payload, and ensure Save/commit uses the same persisted values. Keep the API as final validator. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

**When to use:** Preview recomputation, YouTube start, episode create/update payload, and commit/publication. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

### Anti-Patterns to Avoid

- **Treating generated suggestions as authoritative replacement text:** violates D-07/D-09 and destroys operator edits; merge additively. [VERIFIED: 09-CONTEXT.md]
- **Calling YouTube from Angular:** violates the thin-client/security boundary and would expose provider concerns; call only the authenticated API lookup route. [VERIFIED: docs/ARCHITECTURE.md]
- **Counting JavaScript UTF-16 code units as the sole title limit:** the requirement is Unicode characters; the client check must use the agreed Unicode counting semantics and the API must independently validate the assembled value. [ASSUMED]
- **Using the current generic `tags` list without a migration decision:** it is rendered as a list-entry field and currently contains defaults; silently treating it as the new hashtag string risks publishing unrelated episode tags. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: src/app/pages/manage/episode-form.component.html]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YouTube result counting | Browser scraping, DOM parsing, or direct provider calls | API `youtube-hashtag-search.service` and `search.list` | Existing service handles OAuth, approximate count bounds, timeout/error mapping, cache, and quota. [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] |
| Shared cache/quota | `Map` in Angular or per-tab localStorage as authority | API SQLite cache repository and quota admissions | Shared persistence and atomic admission already exist; fresh hits do not consume provider quota. [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts] |
| AI hashtag generation | Browser prompt/provider integration | API authoring service/worker | Transcript and summary are untrusted inputs to a server-side generation boundary; API validates exactly 50 unique candidates before lookup. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts] |
| Publication metadata | Second browser-side YouTube flow | Existing Phase 8 start/commit API boundary, after contract correction | Provider credentials/publication remain API-owned. [VERIFIED: docs/ARCHITECTURE.md] |

**Key insight:** the browser should own only presentation, transient authoring, debounce, and early validation. The API already owns all expensive, security-sensitive, quota-sensitive, and durable work; duplicating any of it would create conflicting truth.

## Common Pitfalls

### Pitfall 1: Summary poll stops before suggested tags finish

**What goes wrong:** Current Angular polling clears when `summary.status === 'done'`; automatic tag authoring can still be `pending`/`processing`/`done` after the summary is complete. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts]

**Why it happens:** The API deliberately starts tag authoring after writing the completed summary and exposes both states in one snapshot. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts]

**How to avoid:** Keep summary text update semantics, but continue a separate suggestion-status poll until `suggestedTags.status` is `done` or `unavailable`; do not hold the summary field hostage to suggestion failure.

**Warning signs:** UI says “Summary saved and ready” while no generated hashtags appear, or an unavailable tag authoring state is invisible.

### Pitfall 2: Existing API commit discards the authored title/hashtags

**What goes wrong:** `POST .../commit` currently constructs `Trailer - ${episode.title}` and tags from `episode.tags`; the start route accepts `title`/`hashtags`, but commit does not accept or recover those values from the browser request. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

**Why it happens:** Phase 8’s contract was written around saved episode metadata and generic tags, while Phase 9 introduces a separate authoring field and an assembled preview. [VERIFIED: docs/CONFIGURATION.md] [VERIFIED: 09-CONTEXT.md]

**How to avoid:** Lock the contract before planning: either persist the authored hashtags in the episode write model and have commit consume them, or extend the authenticated commit request with the final title/hashtags and validate the assembled title server-side. Do not rely on a transient Angular-only value.

**Warning signs:** start request contains the intended tags but the published provider metadata lacks them; title preview differs from published title.

### Pitfall 3: “One hour” is not the checked-in API default

**What goes wrong:** `.env.example` sets successful-result TTL to 24 hours and zero-result TTL to 6 hours; the phase decision asks for approximately one hour. [VERIFIED: ../dragaocareca-admin-api/.env.example]

**Why it happens:** Cache TTL is configurable and the repository stores explicit `expires_at`, so feasibility exists but default policy does not match D-13. [VERIFIED: ../dragaocareca-admin-api/src/config/env.ts] [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts]

**How to avoid:** Plan an API configuration/schema decision for one-hour success freshness (and an explicit zero-result/error policy), then test hit/expiry boundaries with injected time. Avoid claiming D-13 is satisfied until the deployed environment is checked.

**Warning signs:** repeated hover lookups within one hour return `cacheStatus: miss`, or a stale 24-hour count is presented as current.

### Pitfall 4: Automatic append duplicates or exceeds three hashtags

**What goes wrong:** Generated suggestions can overlap manual text or add more than three tokens, while API start/publication schemas accept at most three. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

**How to avoid:** Normalize on token boundaries, deduplicate case-insensitively, preserve operator order/text, append only available slots, and surface a non-destructive message when suggestions are skipped.

### Pitfall 5: Tooltip works only for mouse hover

**What goes wrong:** D-11/D-12 require hover but operators also need keyboard/focus and dismissal behavior; a mouse-only popup is inaccessible and can remain stale. [VERIFIED: 09-CONTEXT.md]

**How to avoid:** Give each token a focusable interactive affordance or equivalent focus event; close on blur/tab, new input, and outside click; keep count/retrieval time text explicit and mark it approximate. [CITED: https://angular.dev/guide/forms/form-validation]

## Code Examples

### Existing summary polling seam

```typescript
this.apiService.getEpisodeGeneratedSummaryStatus(episodeId).subscribe({
  next: (status) => {
    if (editor.formModel.episodeId !== episodeId) {
      this.clearEpisodeGenerationPolling();
      return;
    }
    editor.formModel.summaryStatus = status.status;
    if (typeof status.summaryText === 'string' && !editor.formModel.summaryManuallyEdited) {
      editor.formModel.summary = status.summaryText.trim();
    }
    if (status.status === 'done' || status.status === 'error') {
      this.clearSummaryStatusPolling();
    }
  },
});
```

This is the existing guard to extend with `suggestedTags` state; generated hashtags need their own completion condition. [VERIFIED: src/app/pages/manage/manage.component.ts]

### Existing API lookup contract

```typescript
POST /v1/episodes/:episodeId/hashtag-lookup
{ "tag": "#RPG" }

// success
{
  "displayTag": "#rpg",
  "normalizedTag": "#rpg",
  "approximateCount": 12345,
  "retrievedAt": "2026-08-14T...Z",
  "cacheStatus": "hit|miss",
  "state": "available",
  "source": "cache|youtube-search-list|..."
}
```

The route also returns `state: unavailable`, `errorCategory`, and `retryAt` for recoverable provider/config/quota failures; invalid tags return 400 and quota exhaustion returns 429. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] [VERIFIED: ../dragaocareca-admin-api/src/docs/openapi.ts]

### Existing normalization and cache key

```typescript
const input = value.normalize('NFKC').trim();
const withoutHash = input.startsWith('#') ? input.slice(1) : input;
const canonical = withoutHash.toLocaleLowerCase('en-US');
const normalizedTag = `#${canonical}`;
```

The real API additionally rejects whitespace, control characters, empty values, and embedded `#`; its cache key includes normalized tag, region (`BR`), relevance language (`pt`), and search-shape version (`v1`). [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts]

### Provider count semantics

YouTube documents `search.list` `pageInfo.totalResults` as approximate, with a maximum of 1,000,000; the method has quota impact. [CITED: https://developers.google.com/youtube/v3/docs/search/list] [CITED: https://developers.google.com/youtube/v3/getting-started]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Frontend generic `tags` list passed opportunistically to YouTube start | Phase 9 separate authored hashtag field with canonical serializer | Phase 9 context, 2026-08-14 | Avoids mixing episode taxonomy tags with trailer metadata. [VERIFIED: src/app/pages/manage/episode-form.component.html] [VERIFIED: 09-CONTEXT.md] |
| Summary polling only models summary text/status | API snapshot includes summary plus versioned `suggestedTags` work/status | Existing sibling API implementation | Frontend can consume one durable poll response, but must extend DTO/state. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-summary.service.ts] |
| Provider count treated as a definitive total | UI/API labels `approximateCount` and records `retrievedAt` | Existing API contract | Prevents false precision and supports freshness display. [CITED: https://developers.google.com/youtube/v3/docs/search/list] [VERIFIED: ../dragaocareca-admin-api/src/docs/openapi.ts] |

**Deprecated/outdated:**

- Treating `episode.tags` as the complete trailer hashtag authoring model is outdated for this phase; retain compatibility deliberately or migrate the mapping explicitly. [VERIFIED: src/app/pages/manage/manage.component.ts] [VERIFIED: 09-CONTEXT.md]
- Treating the Phase 8 `commit` implementation as already accepting the Phase 9 authored title/hashtags is incorrect; the route currently derives both from the episode row. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A client-side Unicode title check should count user-perceived Unicode characters rather than UTF-16 code units. [ASSUMED] | Anti-Patterns / TITLE-02 | Emoji/combined characters may pass client validation but fail API validation, or vice versa; define and test one server/client rule. |
| A2 | A monotonically increasing lookup token plus unsubscribe is sufficient stale-response protection for the Angular lookup flow. [ASSUMED] | Pattern 2 | A late response could show the wrong count if the guard is incomplete. |
| A3 | The new separate hashtag field should replace or coexist with existing generic `tags` persistence without a data migration. [ASSUMED] | Pitfall 2 / State of the Art | Existing episode tags may be lost or unrelated tags may publish; planner needs a locked mapping decision. |

## Open Questions

1. **D-01/D-02 versus TITLE-01: is the trailer title strictly read-only or directly editable?**
   - What we know: context explicitly locks a separate editable hashtag field and read-only computed trailer-name field; REQUIREMENTS.md says “while allowing the user to edit it.” [VERIFIED: 09-CONTEXT.md] [VERIFIED: .planning/REQUIREMENTS.md]
   - What's unclear: which wording governs the implementation and API payload.
   - Recommendation: resolve in planning/discussion before tasks; do not implement an editable title control while D-01/D-02 remain locked.

2. **Where is authored hashtag state persisted for Save/commit?**
   - What we know: current episode DTO has `tags`; current commit reads `episode.tags`, while start accepts transient hashtags. [VERIFIED: src/app/core/api.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts]
   - What's unclear: whether `tags` becomes the canonical trailer hashtag field or a new API/database property is required.
   - Recommendation: use one canonical API-owned representation and update create/update/commit DTOs together; add contract tests for start, save, commit, and reload.

3. **What exact TTL should deployed API use?**
   - What we know: code supports configurable TTL and `.env.example` defaults are 24h success/6h zero, not approximately one hour. [VERIFIED: ../dragaocareca-admin-api/src/config/env.ts] [VERIFIED: ../dragaocareca-admin-api/.env.example]
   - What's unclear: whether deployment env overrides those defaults.
   - Recommendation: inspect deployment configuration and set/test the intended one-hour freshness explicitly.

4. **Should automatic authoring be enabled in the target environment?**
   - What we know: `.env.example` sets `YOUTUBE_HASHTAG_AUTHORING_ENABLED=false`; missing Gemini/YouTube credentials yield recoverable unavailable states. [VERIFIED: ../dragaocareca-admin-api/.env.example] [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts]
   - What's unclear: whether Phase 9 is expected to validate only disabled/unavailable UI or live generated suggestions.
   - Recommendation: test both; do not block manual authoring when automatic work is unavailable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Angular build/tests and API inspection | ✓ | `v22.14.0` observed | — |
| npm | Frontend package scripts | ✓ | `11.2.0` observed | — |
| Angular CLI build | Required release gate | Not run during research | project script `npm run build` | Planner/executor must run it |
| Sibling API source | Contract and route research | ✓ | local checkout | — |
| YouTube/Gemini credentials | Live automatic authoring/counts | Unknown/not inspected | — | Use API unavailable states and mocked/verification scripts |
| SQLite database | API cache/quota persistence | API-owned; local runtime not launched | — | API verification script with temporary SQLite path |

**Missing dependencies with no fallback:** None for repository planning; live provider validation remains environment-dependent.

**Missing dependencies with fallback:** YouTube/Gemini credentials can be covered by unavailable/error fixtures and the sibling API verification script, but live count freshness cannot be proven without deployment configuration and credentials.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Angular CLI/Karma + Jasmine, project Angular 15 toolchain. [VERIFIED: .planning/codebase/STACK.md] |
| Config file | `angular.json`, `tsconfig.spec.json`. [VERIFIED: repository files] |
| Quick run command | `npm test -- --watch=false --include='src/app/pages/manage/**/*.spec.ts'` (confirm Angular CLI include behavior in execution) |
| Full suite command | `npm test -- --watch=false` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TITLE-01 | Preview recomputes from episode name/hashtags; additive async suggestions do not overwrite manual text; contract mapping reaches start/commit | unit + API contract | `npm test -- --watch=false --include='src/app/pages/manage/**/*.spec.ts'`; sibling API `npm run verify:episode-hashtag-authoring` | ❌ Wave 0 |
| TITLE-02 | 100-Unicode assembled-title validation and forbidden hashtag/title character recovery | unit + API contract | focused Angular spec plus sibling API verification | ❌ Wave 0 |
| TITLE-03 | normalized lookup returns approximate count/retrievedAt and displays cache state | service/HTTP unit + API script | focused `ApiService` spec plus API verification | ❌ Wave 0 |
| TITLE-04 | one-second debounce, cancellation/stale guard, cache hit/expiry, quota/unavailable recovery | unit + API service | focused Manage/API specs plus sibling API verification | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** focused Manage/API Jasmine specs.
- **Per wave merge:** full Angular suite plus sibling API hashtag verification/build.
- **Phase gate:** `npm run build` and full required API verification green before `$gsd-verify-work`. [VERIFIED: AGENTS.md]

### Wave 0 Gaps

- [ ] Add typed DTO/API-service tests for `suggestedTags` and `hashtag-lookup`.
- [ ] Add ManageComponent tests for additive suggestion merge, duplicate/max-three behavior, preview length, and stale lookup responses.
- [ ] Add template/accessibility tests or manual UAT for focus/hover popup dismissal and disabled automatic-authoring state.
- [ ] Add sibling API contract coverage for assembled title, authored hashtag persistence, and one-hour TTL boundaries; existing `verify:episode-hashtag-authoring` covers much of the backend but must be inspected/extended for Phase 9’s final mapping.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Keep lookup and summary routes behind existing `requireAuth`; preserve `authBypass` only as configured local mode. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] [VERIFIED: docs/CONFIGURATION.md] |
| V3 Session Management | yes | Continue centralized bearer injection; do not add provider credentials/tokens to Angular DTOs or local state. [VERIFIED: src/app/core/auth.interceptor.ts] [VERIFIED: docs/ARCHITECTURE.md] |
| V4 Access Control | yes | API remains authority for episode/job ownership and publication metadata; browser validation is advisory/early only. [VERIFIED: docs/ARCHITECTURE.md] [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] |
| V5 Input Validation | yes | API Zod schemas reject malformed hashtag tokens, cap three hashtags, cap title input, and normalize lookup input; client mirrors errors without destructive rewriting. [VERIFIED: ../dragaocareca-admin-api/src/routes/episodes.routes.ts] |
| V6 Cryptography | no direct new crypto | Reuse existing auth/provider boundary; no browser-side YouTube OAuth or cryptographic implementation. [VERIFIED: .planning/REQUIREMENTS.md] |

### Known Threat Patterns for Angular + Express/SQLite + YouTube API

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Provider credential leakage through browser lookup | Information disclosure | Browser calls only authenticated API; API returns sanitized count/error DTO, never access token/provider IDs. [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] |
| Untrusted transcript/summary prompt injection | Tampering / information disclosure | Server marks transcript/summary as untrusted prompt sections, validates model output, and keeps provider call server-side. [VERIFIED: ../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts] |
| Stale lookup overwrites current hashtag feedback | Tampering | Cancel/guard client requests by editor/token and clear on reset/input; API remains stateless authority for each lookup. [ASSUMED] |
| Excessive lookup/quota exhaustion | Denial of service | One server lane, normalized cache, atomic daily admissions, bounded timeout/retry, and non-blocking UI error. [VERIFIED: ../dragaocareca-admin-api/src/services/youtube-hashtag-search.service.ts] [VERIFIED: ../dragaocareca-admin-api/src/database/repositories/youtube-hashtag-cache.repository.ts] |

## Sources

### Primary (HIGH confidence)

- `09-CONTEXT.md`, `ROADMAP.md`, `REQUIREMENTS.md` — locked scope, requirements, and Phase 8 handoff. [VERIFIED: repository files]
- `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `AGENTS.md` — frontend boundary, form/polling conventions, auth, and build constraints. [VERIFIED: repository files]
- `../dragaocareca-admin-api/src/routes/episodes.routes.ts` — route schemas, summary snapshot route, manual lookup route, YouTube start/commit behavior. [VERIFIED: repository source]
- `../dragaocareca-admin-api/src/services/episode-summary.service.ts` — automatic suggestion lifecycle and snapshot shape. [VERIFIED: repository source]
- `../dragaocareca-admin-api/src/services/episode-hashtag-authoring.service.ts`, `youtube-hashtag-search.service.ts`, and cache repository — candidate validation, normalization, provider lookup, cache, quotas. [VERIFIED: repository source]
- `../dragaocareca-admin-api/src/docs/openapi.ts` — DTO descriptions and error states. [VERIFIED: repository source]

### Secondary (MEDIUM confidence)

- [Angular template-driven forms](https://angular.dev/guide/forms/template-driven-forms) — `ngModel` and template-driven validation patterns. [CITED: https://angular.dev/guide/forms/template-driven-forms]
- [Angular forms overview](https://angular.dev/guide/forms) — template-driven versus reactive tradeoffs. [CITED: https://angular.dev/guide/forms]
- [YouTube Search: list](https://developers.google.com/youtube/v3/docs/search/list) — approximate `pageInfo.totalResults`, cap, and quota impact. [CITED: https://developers.google.com/youtube/v3/docs/search/list]
- [YouTube Data API getting started](https://developers.google.com/youtube/v3/getting-started) — daily quota context. [CITED: https://developers.google.com/youtube/v3/getting-started]

### Tertiary (LOW confidence)

- No material LOW-confidence external recommendation was used; assumptions are isolated in the Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing repository stack and docs; no new packages recommended. [VERIFIED: package.json] [VERIFIED: .planning/codebase/STACK.md]
- Architecture: HIGH — direct inspection of both web and sibling API implementations. [VERIFIED: repository source]
- Pitfalls: HIGH for current contract mismatches and cache defaults; MEDIUM for Unicode counting semantics and client cancellation implementation details. [VERIFIED: repository source] [ASSUMED]

**Research date:** 2026-08-14  
**Valid until:** 2026-09-13 for repository architecture; 2026-08-21 for YouTube/provider quota and deployment configuration assumptions
