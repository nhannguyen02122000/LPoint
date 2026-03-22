---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: 01 (Foundation)
current_plan: 03
status: executing
last_updated: "2026-03-22T08:43:08Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 0
  completed_plans: 4
---

# LPoint v1 — State

**Updated:** 2026-03-22
**Model:** GSD (Getting Stuff Done)
**Granularity:** Fine (10 phases)
**Mode:** Interactive

---

## Current Phase

```
Current Phase: 01 (Foundation)
Current Plan:  04
Status:        In Progress
```

---

## Phase Inventory

| # | Phase Name | Status | Start | Complete | Blockers |
|---|------------|--------|-------|----------|----------|
| 1 | Foundation | 🟡 In Progress | 2026-03-22 | — | None |
| 2 | RBAC Enforcement | ⬜ Not Started | — | — | Phase 1 |
| 3 | Points Engine | ⬜ Not Started | — | — | Phase 1, Phase 2 |
| 4 | Core API Routes | ⬜ Not Started | — | — | Phase 3 |
| 5 | Staff Customer Ops UI | ⬜ Not Started | — | — | Phase 4 |
| 6 | Staff Earn & Redeem UI | ⬜ Not Started | — | — | Phase 5 |
| 7 | Menu Management UI | ⬜ Not Started | — | — | Phase 4 |
| 8 | Tier Configuration UI | ⬜ Not Started | — | — | Phase 7 |
| 9 | Expiry Cron & Logs | ⬜ Not Started | — | — | Phase 3 |
| 10 | Admin Dashboard & Program Mgmt | ⬜ Not Started | — | — | Phase 4, Phase 9 |

---

## Blocker Log

No active blockers. Phase 1 has no external dependencies.

---

## Completion Criteria

All 10 phases must reach `⬜ Done` status.

| Phase | Criterion |
|-------|-----------|
| Phase 1 | Clerk auth works (username/password, no signup); `public_metadata.role` set; InstantDB schema pushed; `lib/auth.ts` helpers exported |
| Phase 2 | All `/admin/*` routes 403 for STAFF; all ADMIN-only API routes 403 for STAFF; unauthenticated requests return 401 |
| Phase 3 | `lib/points.ts`, `lib/rules.ts`, `lib/transactions.ts` pass 100% unit test coverage on edge cases |
| Phase 4 | All API routes return correct response shapes; Zod validation rejects bad input; Clerk session verified on every route |
| Phase 5 | Customer CRUD (lookup/create/edit) works; duplicate phone blocked; soft-delete works for ADMIN |
| Phase 6 | Earn shows bonus preview; redeem shows eligible tiers only; two-step confirm; real-time card update |
| Phase 7 | Menu item CRUD works; name + price stored; deletion blocked if referenced |
| Phase 8 | 6 tiers editable; ascending validation; retroactive warning shown |
| Phase 9 | Cron idempotent; `EXPIRY_LOG` entries created; `totalPoints` zeroed; completes < 60s |
| Phase 10 | Dashboard stats correct; recent transactions shown; expiry logs viewer works; point adjustment creates audit trail |

---

## Last Completed

```
Plan 01-PLAN-01 (packages-config) — 2026-03-22 | Plan 02-PLAN-clerk-auth (Clerk auth) — 2026-03-22 | Plan 03-PLAN-instantdb-schema (InstantDB Schema) — 2026-03-22
```

---

## Key Decisions

- "CLERK_WEBHOOK_SIGNING_SECRET deferred — placeholder in .env.example until webhook is configured in Clerk Dashboard"
- "CRON_SECRET added upfront in .env.example — Phase 9 cron will use it without additional env var work later"
- "middleware.ts at project root (not src/) — required by Next.js convention for edge middleware"
- ".env.example force-added to git — intentionally tracked despite .gitignore `.env*` pattern"
- "InstantDB CLI is `instant-cli` (npm package), not `instantdb` or `@instantdb/cli`"
- "InstantDB v0.22.169 does not support `.default()` on attributes; defaults handled in application code"
- "instant-cli requires `--yes` for non-interactive push; requires `instant.schema.ts` at project root"

## Notes

- Parallelization: Phases 4 and 7 can be built concurrently after Phase 3. Phases 5 and 9 can be built concurrently after Phase 4. Phase 10 can be built alongside Phase 6 after Phase 4.
- No phase should skip Phase 3 (Points Engine). Building UI before the engine is tested leads to business logic scattered in components.
- Cron (Phase 9) must not be activated in Vercel until Phase 10 is verified — a misfiring cron on an unproven ledger is dangerous.

---

*State last updated: 2026-03-22*
