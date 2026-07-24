# AGENTS.md - dragaocareca-admin-web

## Mandatory Context Loading
1. Read `docs/README.md` before any implementation.
2. Then read `docs/ARCHITECTURE.md` and `docs/CONFIGURATION.md` for the detailed UI architecture and backend contract assumptions.
3. Use the docs set as source of truth for UI architecture and backend contract assumptions.

## High-Signal Rules
- Keep business logic in backend; frontend should orchestrate API calls.
- Preserve sectioned, legacy-inspired functional layout (not minimalist placeholder UI).
- Respect auth toggle: `authBypass` in environment files.
- Verify build with `npm run build` before finalizing.
