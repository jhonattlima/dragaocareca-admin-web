# Research Features

**Analysis Date:** 2026-07-24

## Feature Category: Transcript-Driven Summary

### Table Stakes

- After audio upload, the UI shows a summary-generation progress indicator in the new episode tab.
- When the backend finishes generating the summary, the UI fills the summary textarea automatically.
- The operator can still review and save the generated summary with the episode.

### Differentiators

- The summary workflow mirrors the transcript progress pattern already used in the manage screen.
- The summary field remains part of the normal new-episode editing flow rather than a separate wizard.

### Anti-Features

- Do not add a separate modal or side workflow for summary generation.
- Do not move summary generation logic into the browser.
- Do not block the rest of the episode form while summary generation is pending.

