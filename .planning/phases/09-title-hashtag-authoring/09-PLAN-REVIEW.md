# Phase 9 Plan Review

**Status:** ISSUES FOUND

**Phase:** Title & Hashtag Authoring  
**Plans checked:** 09-01, 09-02, 09-03  
**Issues:** 0 blockers, 1 warning

## Previous blockers rechecked

- `09-VALIDATION.md` exists and defines the requirement-to-test map, wave sampling, release gate, and manual UAT checkpoint.
- `09-RESEARCH.md` has `## Open Questions (RESOLVED)`, including the read-only title decision, Save-time persistence contract, one-hour cache policy, and automatic-authoring availability behavior.
- The durable Save-time contract is explicit: commit accepts `{ title, hashtags }`, and the API persists the final metadata through the existing YouTube job `metadata_snapshot_json`/`requestPublication` path for reload/retry-safe publication.
- The API plan names the sibling-repository execution ownership and the relevant route, job, publication, configuration, OpenAPI, and verifier files.
- The shared assembled-title validator is located in `youtube-trailer-publication.service.ts`; the plan explicitly requires reuse at start, commit, and publication, with code-point 100/101 boundary coverage.
- Phase-wide verification is explicit in `09-VALIDATION.md`: frontend tests/build, sibling API build, lifecycle and lookup verifier focuses, and the required manual UAT checkpoint.
- The plans consistently honor the locked read-only computed title and approximately one-hour normalized lookup cache. They do not introduce a second publication flow or browser-side YouTube calls.
- Requirement coverage, task structure, dependency order (`09-01 -> 09-02 -> 09-03`), must-haves, key links, and scope are otherwise complete.

## Remaining issue

**1. [task_completeness] Plan 09-01 Task 1 omits files that its action explicitly modifies — WARNING**

- **Plan:** `09-01`
- **Task:** 1
- **Description:** The task action says to place and reuse the shared validator in `youtube-trailer-publication.service.ts` and update the job/publication services, while its task-level `<files>` lists only `episodes.routes.ts`, `openapi.ts`, and the verifier. Those service files are present in `files_modified` frontmatter, but not in the executable task file list, weakening executor traceability for the critical start/commit/publication wiring.
- **Fix:** Add `../dragaocareca-admin-api/src/services/youtube-trailer-job.service.ts` and `../dragaocareca-admin-api/src/services/youtube-trailer-publication.service.ts` to Task 1’s `<files>` element (and keep the existing frontmatter entries).

## Structured Issues

```yaml
issues:
  - dimension: task_completeness
    severity: warning
    plan: "09-01"
    task: 1
    description: "Task action modifies the sibling YouTube job/publication services, including the shared validator location, but its task-level files list omits both service paths."
    fix_hint: "Add youtube-trailer-job.service.ts and youtube-trailer-publication.service.ts to Task 1 <files>."
```

## Recommendation

The phase goal is otherwise covered and all previous blockers are resolved. Add the two omitted task-level file paths before execution; no application source or other plan changes are required for this review.
