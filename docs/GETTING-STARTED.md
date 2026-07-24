# Getting Started

**Analysis Date:** 2026-07-24

## Prerequisites

- Node.js installed
- npm installed
- Backend API available locally if you want the non-bypass auth path

## Local Setup

```bash
npm install
npm start
```

Then open:

```text
http://localhost:4200/
```

## Default Local Behavior

The checked-in development environment points at:

- `http://localhost:3000/v1`

and enables:

- `authBypass: true`

That means local development can run without Google sign-in, while still preserving the auth guard and login flow structure.

## What to Read First

- `docs/README.md` - compressed project summary and compatibility index
- `docs/ARCHITECTURE.md` - app structure and data flow
- `docs/CONFIGURATION.md` - environment values, backend contract, and runbook
- `docs/TESTING.md` - current test state and priorities

---

*Getting-started notes: 2026-07-24*
