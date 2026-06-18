# AGENTS.md - dragaocareca-admin-web

## Mandatory Context Loading
1. Read `docs/SDD.md` before any implementation.
2. Use SDD as source of truth for UI architecture and backend contract assumptions.

## High-Signal Rules
- Keep business logic in backend; frontend should orchestrate API calls.
- Preserve sectioned, legacy-inspired functional layout (not minimalist placeholder UI).
- Respect auth toggle: `authBypass` in environment files.
- Verify build with `npm run build` before finalizing.
