# Research Pitfalls

**Analysis Date:** 2026-07-24

## Pitfall 1: Overwriting operator edits

- Risk: The generated summary could clobber manual changes if it is written into the form after the operator starts editing.
- Prevention: Only auto-fill on completion and preserve the field once the operator has edited it.

## Pitfall 2: Coupling summary to upload progress

- Risk: Treating summary generation as the same thing as upload transfer progress will make the UI misleading.
- Prevention: Keep upload progress and summary-generation progress as separate state values.

## Pitfall 3: Blocking the episode workflow

- Risk: If summary generation is treated as a hard gate, operators may not be able to finish the episode flow.
- Prevention: Make summary generation a visible background step, not a modal or wizard.

## Pitfall 4: Stale polling state

- Risk: Transcript/summary polling can continue after the active episode changes.
- Prevention: Reuse the current polling lifecycle guards in `ManageComponent` and reset the summary state when switching episodes or tabs.

