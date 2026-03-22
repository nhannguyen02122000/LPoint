---
phase: 01-foundation
plan: 03
subsystem: database
tags: [instantdb, schema, database, typescript]

# Dependency graph
requires: []
provides:
  - InstantDB schema with 6 entities (USERS, CUSTOMER, TRANSACTION, TIER, EXPIRY_LOG, MENU_ITEM)
  - InstantDB client instance (`src/lib/instantdb.ts`)
  - Schema pushed to InstantDB (app: f843f303-5ab1-48aa-bddb-9f9ea9a2fdb6)
  - `instant.schema.ts` root re-export for CLI compatibility
affects: [02-clerk-auth, 03-points-engine, 04-core-api, 05-staff-customer-ops, 06-staff-earn-redeem, 07-menu-management, 08-tier-config, 09-expiry-cron, 10-admin-dashboard]

# Tech tracking
tech-stack:
  added: [instant-cli@0.22.169]
  patterns: [InstantDB schema definition, InstantDB init_schema client pattern, root-level schema re-export for CLI]

key-files:
  created:
    - src/lib/schema.ts — 6-entity InstantDB schema
    - src/lib/instantdb.ts — InstantDB client instance
    - instant.schema.ts — Root re-export for instant-cli compatibility
    - schema-version.txt — Schema version pin (1)
  modified:
    - package.json — Added instant-cli@0.22.169 dev dependency
    - package-lock.json — Updated with instant-cli

key-decisions:
  - "InstantDB CLI is `instant-cli` (npm package name), not `instantdb` or `@instantdb/cli`"
  - "InstantDB v0.22.169 does not support .default() on attribute types; defaults set in application code"
  - "instant-cli requires `--yes` flag for non-interactive push (no TTY available)"
  - "instant-cli requires `instant.schema.ts` at project root (or INSTANT_SCHEMA_FILE_PATH env var)"
  - "InstantDB client from @instantdb/react uses `init_schema` (not `init`), exported as `db` default"

patterns-established:
  - "Schema: Use `i.schema({ version: N, entities: { ... } })` with named entities"
  - "Client: `init_schema({ appId, schema })` for server-side, `InstantProvider` for client-side"
  - "CLI: `npx instant-cli push --app=<id> --env=local --yes` for non-interactive push"

requirements-completed: [SYNC-01]

# Phase 1 Plan 3: InstantDB Schema Summary

**InstantDB schema with 6 entities (USERS, CUSTOMER, TRANSACTION, TIER, EXPIRY_LOG, MENU_ITEM), pushed to InstantDB via instant-cli**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-22T08:37:04Z
- **Completed:** 2026-03-22T08:43:08Z
- **Tasks:** 4
- **Files modified:** 6

## Accomplishments
- 6-entity InstantDB schema defined with all field types and indexes
- InstantDB client (`init_schema`) initialized and exported from `src/lib/instantdb.ts`
- Schema pushed successfully to InstantDB (app: f843f303-5ab1-48aa-bddb-9f9ea9a2fdb6)
- Schema version pinned in `schema-version.txt` (version 1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/lib/schema.ts** - `056bffb` (feat)
2. **Task 2: Create src/lib/instantdb.ts** - `095ab22` (feat)
3. **Task 3: Push schema to InstantDB** - `8cff7e8` (feat)
4. **Task 4: Create schema-version.txt** - `74a8be2` (feat)

**Plan metadata:** `74a8be2` (docs: complete plan)

## Files Created/Modified
- `src/lib/schema.ts` — 6-entity InstantDB schema definition
- `src/lib/instantdb.ts` — InstantDB client initialized with appId and schema
- `instant.schema.ts` — Root re-export for instant-cli compatibility
- `schema-version.txt` — Schema version pin (contains "1")
- `package.json` — Added instant-cli@0.22.169 as dev dependency
- `package-lock.json` — Updated with instant-cli and dependencies

## Decisions Made

- InstantDB CLI is `instant-cli` (npm package name), not `instantdb` or `@instantdb/cli`
- InstantDB v0.22.169 does not support `.default()` on attribute types; defaults set in application code
- instant-cli requires `--yes` flag for non-interactive push (no TTY available)
- instant-cli requires `instant.schema.ts` at project root (or `INSTANT_SCHEMA_FILE_PATH` env var)
- InstantDB client from `@instantdb/react` uses `init_schema`, exported as `db` default

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] InstantDB CLI not installed**
- **Found during:** Task 3 (Push schema to InstantDB)
- **Issue:** `npx instantdb` failed — package name was wrong. Correct package is `instant-cli`.
- **Fix:** Installed `instant-cli@0.22.169` as dev dependency
- **Files modified:** package.json, package-lock.json
- **Verification:** `npx instant-cli --help` works
- **Committed in:** `8cff7e8` (Task 3 commit)

**2. [Rule 3 - Blocking] CLI needed `instant.schema.ts` at project root**
- **Found during:** Task 3 (Push schema to InstantDB)
- **Issue:** instant-cli couldn't find schema — it looks for `instant.schema.ts` at root by default
- **Fix:** Created `instant.schema.ts` as a re-export of `src/lib/schema.ts`
- **Files modified:** instant.schema.ts (new)
- **Verification:** `instant-cli push` proceeds past schema discovery
- **Committed in:** `8cff7e8` (Task 3 commit)

**3. [Rule 1 - Bug] `.default()` not supported in installed InstantDB version**
- **Found during:** Task 3 (Push schema to InstantDB)
- **Issue:** `i.number().default(0)` and `i.boolean().default(true)` threw TypeError — method doesn't exist in v0.22.169
- **Fix:** Removed all `.default()` calls; defaults (0 for total_points, true for active) set in application code instead
- **Files modified:** src/lib/schema.ts
- **Verification:** `instant-cli push` succeeded with all 6 namespaces
- **Committed in:** `056bffb` (Task 1 commit, amended)

**4. [Rule 3 - Blocking] CLI required interactive confirmation**
- **Found during:** Task 3 (Push schema to InstantDB)
- **Issue:** instant-cli showed TUI confirmation dialog — fails in non-interactive environments
- **Fix:** Used `--yes` flag to auto-confirm
- **Files modified:** (none — command flag only)
- **Verification:** `instant-cli push --yes` completes without user input
- **Committed in:** `8cff7e8` (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (4 blocking)
**Impact on plan:** All 4 deviations were blocking (could not complete task 3 without fixes). No scope creep — all fixes were prerequisites for completing the plan as written.

## Issues Encountered
None beyond the auto-fixed deviations above.

## Next Phase Readiness
- InstantDB schema and client ready for all subsequent phases
- All phases that read/write data (02–10) can now use `src/lib/instantdb.ts` and `src/lib/schema.ts`
- `instant-cli` installed for future schema pushes (re-run after any schema changes)

---
*Phase: 01-foundation*
*Completed: 2026-03-22*
