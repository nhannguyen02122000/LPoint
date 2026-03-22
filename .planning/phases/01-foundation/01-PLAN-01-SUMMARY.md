---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [clerk, instantdb, middleware, env-config]

# Dependency graph
requires: []
provides:
  - "@clerk/nextjs installed"
  - "@instantdb/react and @instantdb/core installed"
  - "svix and zod installed"
  - ".env.example with all 7 env vars documented"
  - "Clerk middleware protecting all routes except /api/auth/webhook"
affects: [02-rbac, 03-points-engine, 04-core-api-routes, 09-expiry-cron]

# Tech tracking
tech-stack:
  added: [@clerk/nextjs, @instantdb/react, @instantdb/core, svix, zod]
  patterns: [Clerk auth middleware, public route exclusion via createRouteMatcher]

key-files:
  created: [middleware.ts, .env.example]
  modified: [package.json, package-lock.json]

key-decisions:
  - "CLERK_WEBHOOK_SIGNING_SECRET deferred — user adds after webhook setup (per D-11)"
  - "CRON_SECRET added upfront — Phase 9 will use it without requiring additional env var work"
  - ".env.example force-added to git — intentionally tracked as a template despite .gitignore"
  - "middleware.ts at project root (not src/) — required by Next.js convention"

patterns-established:
  - "Pattern: Clerk middleware with public route exclusion using createRouteMatcher"
  - "Pattern: .env.example as committed template (force-added despite .gitignore)"

requirements-completed: [AUTH-01, AUTH-02]

# Metrics
duration: 2 min
completed: 2026-03-22
---

# Phase 01 Plan 01: Packages & Config Summary

**Clerk and InstantDB dependencies installed, all 7 env vars documented in .env.example, and auth middleware protecting all routes except the Clerk webhook endpoint.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T08:36:59Z
- **Completed:** 2026-03-22T08:38:59Z
- **Tasks:** 3
- **Files modified:** 4 (2 new, 2 updated)

## Accomplishments

- Installed `@clerk/nextjs`, `@instantdb/react`, `@instantdb/core`, `svix`, and `zod` with zero vulnerabilities
- Created `.env.example` with all 7 environment variables and explanatory comments
- Created `middleware.ts` at project root protecting all routes except `/api/auth/webhook`

## Task Commits

Each task was committed atomically:

1. **Task 1: Install npm dependencies** - `c8619a4` (chore)
2. **Task 2: Create .env.example** - `d3fc745` (feat)
3. **Task 3: Create middleware.ts** - `3555410` (feat)

**Plan metadata:** (to be committed after SUMMARY)

## Files Created/Modified

- `middleware.ts` - Clerk middleware protecting all routes except `/api/auth/webhook`
- `.env.example` - All 7 env vars documented: Clerk keys, webhook secret, InstantDB, CRON_SECRET
- `package.json` - Added `@clerk/nextjs`, `@instantdb/react`, `@instantdb/core`, `svix`, `zod`
- `package-lock.json` - Updated with new dependencies

## Decisions Made

- **CLERK_WEBHOOK_SIGNING_SECRET deferred** — value only known after user configures webhook in Clerk Dashboard; included as placeholder in `.env.example`
- **CRON_SECRET added upfront** — Phase 9 cron job will need it; avoids extra env var work later
- **`.env.example` force-added to git** — `.gitignore` pattern `.env*` would exclude it, but it's an intentional template committed with `-f`
- **`middleware.ts` at project root** — Next.js convention requires it at same level as `package.json`, not inside `src/`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required at this stage. The `.env.example` documents what values will be needed; actual values are added by the developer during Phase 1 setup.

## Next Phase Readiness

- Clerk middleware is wired — Phase 1 remaining tasks can proceed (lib/auth.ts, lib/schema.ts, lib/instantdb.ts, webhook handler, ClerkProvider in layout, sign-in/sign-up pages)
- All dependencies are available for subsequent phases
- `.env.example` provides a checklist for the developer to fill in real values before testing

---
*Phase: 01-foundation / Plan: 01*
*Completed: 2026-03-22*
