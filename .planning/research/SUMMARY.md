# Project Research Summary

**Project:** LPoint — Loyalty Points / Reward Program System
**Domain:** B2B SaaS loyalty program for small Vietnamese F&B retail (cafés/restaurants)
**Researched:** 2026-03-22
**Confidence:** HIGH

---

## Executive Summary

LPoint is a staff-operated loyalty points system for small Vietnamese cafés and restaurants — no customer app, no login friction, just phone-number lookup at the point of sale. The system earns points (10k VND = 1pt, floored), applies bonus mechanics (7-day return, promo items, stock-clear), supports a 6-tier configurable reward system, and enforces 60-day point expiry via a daily Vercel cron job. The recommended stack is **Next.js 16 + Clerk 7 + InstantDB + Tailwind v4**, already partially scaffolded in the project. The core insight from research: competitive moat vs Starbucks/Toast is **simplicity for the customer** (no download, no login) combined with **operational intelligence for the owner** (stock-clear urgency mechanics, configurable tiers, expiry-driven repeat visits).

The two highest-stakes architectural decisions are: (1) **ledger-based accounting** — every point change (earn, redeem, expire, adjust) must create an immutable TRANSACTION entry; balance is a derived sum, not a mutable column — and (2) **server-side RBAC enforcement** — role checks must live in Route Handlers and Server Components, never in the UI. Skipping either leads to race conditions, audit failures, or security bypasses that destroy customer trust in a loyalty program.

The build sequence implied by dependencies and pitfalls is strict: Foundation (schema + auth sync) → Core Engine (lib/ with zero UI) → API Routes (thin wrappers) → Staff UI → Admin UI → Automation. Skipping phases or building UI before the engine is tested is the most reliable path to a broken system.

---

## Key Findings

### Recommended Stack

Next.js 16.2.1 + React 19.2.4 as the full-stack React framework (App Router, Server Components, API Routes) — already scaffolded. Clerk 7.0.6 for STAFF/ADMIN authentication with username/password, RBAC via `publicMetadata`, and webhook sync to InstantDB — already integrated. InstantDB `@instantdb/react@0.22.169` for customer records, point transactions, tier config, and expiry logs — phone-as-PK fits the lookup-by-phone requirement; React 19 compatibility confirmed. Tailwind CSS v4.2.2 for styling — already scaffolded, uses CSS-first config (no `tailwind.config.js`). Supporting libraries: Zod 4.3.6 + react-hook-form 7.72.0 for form validation, date-fns 4.1.0 for expiry math, lucide-react 0.577.0 for icons.

Key patterns: InstantDB's `instant.with()` for atomic multi-step mutations (earn + log in one transaction), Clerk's `auth()` at the top of every Server Component and Route Handler, `Math.floor(amount / 10000)` as the single integer-only point formula, and `date-fns` instead of native `Date` for timezone-safe expiry calculations.

### Expected Features

**Must have (table stakes):** Customer lookup by phone (phone as PK, <5 second search), point earning (10k VND = 1pt, floor, with bonus rules active), point redemption (6 tiers, 1 redemption = 1 tier, logged as transaction), transaction logging (earn/redeem/expiry, ADMIN viewable), staff auth with STAFF/ADMIN roles, RBAC enforcement on all protected actions.

**Should have (differentiators):** Three bonus types — return bonus (+1pt for 7-day revisit), promo item bonus, stock-clear bonus (owner marks items daily to drive urgency). 60-day point expiry via Vercel cron with log entries. Admin-configurable tiers in InstantDB — owner adjusts without code deploy. Staff customer card with tier progress bar and expiry warning (the "endowed progress effect" drives 35% higher redemption per HBR). No customer app — deliberate simplicity choice that eliminates onboarding friction.

**Defer (v2+):** Customer-facing mini-webpage, multi-location support, SMS expiry alerts, gamification (badges/streaks), birthday rewards, double-point promo days, referral mechanic. These require validated core-loop engagement before investment.

### Architecture Approach

Five-layer architecture: Presentation (Staff UI, Admin UI, Customer Lookup) → API Layer (Next.js Route Handlers) → Business Logic Layer (Points Engine, Rule Engine, Reward Evaluator) → Data Layer (InstantDB entities). The `lib/` directory is pure business logic with zero imports from Next.js or InstantDB — fully testable in isolation. The API layer is intentionally thin: auth verification + input validation + calling `lib/` functions, never business logic itself.

Three core architectural patterns: **(1) Points Ledger** — append-only TRANSACTION entries; balance derived by summing transactions; reversal via negative transaction. **(2) Configurable Rule Engine** — bonus conditions stored in InstantDB as data, not code; `lib/rules.ts` evaluates predicates per bonus type. **(3) Tier-Based Reward Eligibility** — discrete milestone tiers; eligibility computed against `totalPoints`; tier thresholds in InstantDB TIER entity.

State management: InstantDB is the source of truth. Server Components read directly. Client Components use `useQuery` for reactive real-time updates. No Redux/Zustand needed at this scale.

### Critical Pitfalls

1. **Race condition in redemption (double-spend)** — Two concurrent API calls read the same balance, both write back, one overwrites the other. Prevention: wrap read+write in `instant.with()` atomic transaction; validate balance inside the transaction; add idempotency keys on mutation.

2. **Points arithmetic with floating-point or wrong rounding** — `Math.round` or `parseFloat` causes silent precision errors that accumulate. Prevention: `Math.floor(amount / 10000)` only; integer math everywhere; unit test the formula with edge cases (0, 19999, 20000, 99999).

3. **Points expiry cron misfires (double-expiry or missed expiry)** — Vercel Cron guarantees at-least-once, not exactly-once. Prevention: idempotent job — mark records `processed_at` before expiring; skip already-processed records; query only `exp_pts_date <= now AND points > 0`; never scan all customers.

4. **Clerk → InstantDB sync break** — Staff exists in Clerk but not in InstantDB (or vice versa) after webhook misconfiguration. Prevention: handle all three webhook events (`user.created`, `user.updated`, `user.deleted`); verify `svix-signature` headers; run a reconciliation check on startup; never mutate InstantDB without verifying user exists there.

5. **RBAC bypass — STAFF accessing ADMIN-only actions** — Role checks implemented only in UI (hiding buttons) but not enforced server-side. Prevention: `auth()` at top of every Route Handler and Server Component; `requireRole(role)` helper that throws or redirects; never trust client-side role state for authorization.

6. **Demo mode bleeds into production** — Hardcoded test credentials, `test-` prefixed IDs, or `DEMO_MODE` code paths ship to production. Prevention: validate all required env vars on startup; throw hard crash with clear message if missing; never have a fallback to fake values.

7. **Phone number format drift** — "0912 345 678", "0912345678", "+84912345678" treated as different customers. Prevention: normalize on every input (strip spaces, enforce `+84XXXXXXXXX`); `normalizePhone()` utility at every entry and search point; DB-level uniqueness via InstantDB PK.

8. **Tier config changes apply retroactively** — ADMIN lowers a threshold, all existing customers become immediately eligible for gifts the shop can't afford. Prevention: store frozen tier snapshot on customer record at last transaction; display based on stored snapshot, not live config; ADMIN edit UI must warn "affects all current customers immediately."

9. **No audit trail for manual point adjustments** — ADMIN fixes a billing error but no record of who/why/what balance was. Prevention: always go through TRANSACTION entry with `type: 'adjustment'`; required `reason` field; log `adjusted_by`, `balance_before`, `balance_after`.

10. **InstantDB schema not pushed after changes** — Code has new field/entity, deploys, but InstantDB still has old schema. Prevention: automate `npx instantdb push` as a post-deploy step in CI/CD; pin schema version in committed `schema-version.txt`; verify via InstantDB debugger before every deploy.

---

## Implications for Roadmap

Based on research, the build sequence is strictly ordered by dependency and risk. Skipping phases leads to expensive rework.

### Phase 0: Foundation — InstantDB Schema + Clerk Webhook Sync
**Rationale:** Every subsequent phase depends on a correct schema and working auth. This phase has zero user-facing output but eliminates 4 critical pitfalls.
**Delivers:** InstantDB schema (CUSTOMER, TRANSACTION, TIER, EXPIRY_LOG, STOCK_CLEAR entities), Clerk webhook handler (`user.created/updated/deleted`), Clerk → InstantDB user sync, env var validation, schema push automation in CI.
**Addresses:** Pitfalls #4 (webhook sync), #6 (demo mode), #13 (rate limiting), #9 (schema not pushed).
**Research Flags:** Clerk webhook signature verification (`svix`) — needs specific library research during this phase.

### Phase 1: Core Engine — `lib/` Business Logic (No UI)
**Rationale:** Business logic must be testable in isolation before any UI exists. The engine has zero Next.js or InstantDB imports — pure functions. Skipping to UI first scatters business logic across components and makes testing impossible.
**Delivers:** `lib/points.ts` (earn, redeem, getBalance), `lib/rules.ts` (evaluateBonuses: 7-day return, promo item, stock-clear), `lib/rewards.ts` (getEligibleTiers, getNextTier), `lib/transactions.ts` (logEarn, logRedeem, logExpiry, logAdjustment), `lib/expiry.ts` (getExpiredCustomers, expirePoints), `lib/phone.ts` (normalizePhone), `lib/auth.ts` (requireRole, getSession).
**Addresses:** Pitfalls #2 (integer math), #1 (race conditions — engine designed for atomic transactions), #7 (phone normalization), #5 (idempotent cron design), #8 (tier snapshot design), #10 (adjustment audit trail).
**Research Flags:** None — well-documented patterns. Unit tests are the deliverable here.

### Phase 2: API Routes — Thin Wrappers Around `lib/`
**Rationale:** API contracts must be stable before UI can be built against them. All routes are thin: auth check + input validation + call `lib/`. No business logic lives here.
**Delivers:** `/api/customers/lookup` (phone → customer), `/api/customers/create` (ADMIN), `/api/points/earn` (STAFF/ADMIN), `/api/points/redeem` (STAFF/ADMIN), `/api/points/adjust` (ADMIN, requires reason), `/api/admin/tiers` (ADMIN CRUD), `/api/cron/expire` (Vercel cron, idempotent), `/api/auth/webhook` (Clerk sync).
**Addresses:** Pitfall #13 (auth on every route), Pitfall #1 (atomic transactions in API context), Pitfall #5 (cron idempotency verification).
**Research Flags:** Vercel Cron rate limiting and concurrent execution limits — verify during implementation.

### Phase 3: Staff UI
**Rationale:** Staff-facing flows are highest priority per core value — this is where customer trust is built or lost. Staff need customer lookup, earn form with bonus preview, and redeem form with tier selection confirmation.
**Delivers:** Staff layout with sidebar, customer lookup (phone → card with name/balance/progress/next tier/expiry warning), earn form (amount → base points + bonus preview + "earn" confirmation), redeem form (tier selection → two-step confirm → success state showing new balance).
**Addresses:** Pitfalls covered by lib/ phase: integer math, phone normalization, transaction logging, race conditions (UI must debounce rapid clicks).
**Research Flags:** None — standard patterns. Focus on UX: expiry warnings must be prominent, bonus announcements must be celebratory ("+1 bonus for clearing [item]!").

### Phase 4: Admin UI
**Rationale:** Admin tools are for operations, not customer-facing value — build after the core loop is validated. Owner needs tier management, expiry log viewer, stock-clear item marking, and aggregate stats.
**Delivers:** Admin dashboard (total points issued, gifts redeemed, new customers, recent transactions), tier editor (add/edit/delete tiers with retroactive-effect warning), stock-clear manager (mark items per day, auto-expiration), expiry log viewer, customer management (soft delete, point adjustment with reason field).
**Addresses:** Pitfall #8 (stock-clear daily reset enforcement in UI), Pitfall #10 (CI schema push verified).
**Research Flags:** None — established patterns.

### Phase 5: Automation — Expiry Cron + Monitoring
**Rationale:** Cron depends on Points Engine and Transaction Logger being stable. Only activate after Phase 1 + 2 + 3 are verified.
**Delivers:** Daily Vercel Cron pointing to `/api/cron/expire`, processing chunks of 100–500 customers with `processed_at` idempotency, writing EXPIRY_LOG entries, zeroing `totalPoints` in CUSTOMER, resetting `exp_pts_date` to next cycle.
**Addresses:** Pitfalls #3 (double-expiry), #11 (expiry-redemption race).
**Research Flags:** Cron monitoring — add alerting if job runs > 60 seconds or fails to fire.

### Phase Ordering Rationale

- **Phase 0 → 1 → 2 is strictly sequential**: Phase 0 gives the schema; Phase 1 builds logic against that schema without I/O; Phase 2 wraps Phase 1 in HTTP.
- **Phase 3 (Staff UI) before Phase 4 (Admin UI)**: Staff-facing flows are where the system earns trust. Admin is internal tooling — less urgent.
- **Phase 5 (Cron) last**: Cron must not be activated until the transaction ledger is proven stable. A misfiring cron on an untested ledger could corrupt balances.
- **lib/ is always first among equals**: If a phase slips and new requirements emerge, revalidate against `lib/`. If the engine changes, retest the engine first.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm registry (2026-03-22). Peer deps confirmed. Next.js 16 + Clerk 7 + InstantDB + Tailwind v4 all stable and compatible. |
| Features | HIGH | Core loop (earn/redeem/lookup) is well-understood. Bonus mechanics and expiry are documented with industry backing (HBR, Restaurant Dive). Differentiators confirmed against competitor analysis. |
| Architecture | HIGH | Ledger pattern, rule engine, tier eligibility are established patterns with strong sources (Martin Fowler, Microservices.io, InstantDB docs). Build order rationale is derived from pitfall analysis. |
| Pitfalls | HIGH | All 13 pitfalls have documented causes, prevention strategies, warning signs, phase mapping, and recovery costs. Sources include Vercel docs, InstantDB docs, Clerk docs, OWASP, and HN community post-mortems. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vercel Cron concurrent execution limits:** Specific limits on how many cron instances can run simultaneously not fully documented. Needs verification during Phase 5 planning — may require a distributed lock or queue.
- **InstantDB schema push CI integration:** `npx instantdb push` in a Vercel post-deploy hook is the recommended approach but hasn't been tested in this project. Needs a trial deploy to verify.
- **Clerk webhook reliability in development:** Webhook testing locally requires `ngrok` or Clerk's built-in dev server. Dev workflow for webhook iteration should be documented during Phase 0.
- **Gift inventory for physical rewards:** If the shop has limited physical stock, the system doesn't yet track gift inventory — potential over-redemption. Needs owner input during Phase 4 planning.

---

## Sources

### Primary (HIGH confidence)

- [npm registry — `next@16.2.1`, `@clerk/nextjs@7.0.6`, `@instantdb/react@0.22.169`, `tailwindcss@4.2.2`](https://npmjs.com) — verified 2026-03-22
- [InstantDB Documentation — Transactions, Schema, React hooks](https://www.instantdb.com/docs) — core SDK patterns
- [Clerk Documentation — Next.js overview, Webhooks, publicMetadata RBAC](https://clerk.com/docs) — auth + webhook patterns
- [Vercel Cron Jobs — at-least-once delivery guarantees](https://vercel.com/docs/cron-jobs) — cron design for idempotency
- [OWASP API Security Top 10 — BOLA/IDOR](https://owasp.org/API-Security/) — phone enumeration attack

### Secondary (MEDIUM confidence)

- [POSist — The Future of Restaurant Loyalty Programs: Trends for 2025–2030](https://www.posist.com/restaurant-resources/restaurant-software-trends-future-loyalty-programs) — feature landscape, F&B context
- [Harvard Business Review — Points Expiry Psychology & Retention](https://hbr.org) — expiry drives +10–15% repeat visits; endowed progress effect +35% redemption lift
- [Square Loyalty Tools](https://squareup.com/us/en/loyalty) — competitor feature matrix
- [Toast Rewards Program Features](https://pos.toasttab.com/loyalty) — competitor feature matrix
- [Loyalty Lion — F&B Loyalty Benchmark Report 2025](https://loyaltylion.com) — gamification data, engagement stats

### Tertiary (LOW confidence)

- [Points System Race Condition Post-mortems — HN](https://news.ycombinator.com/item?id=38924517) — community discussion, not a primary source; validate findings with load testing
- [Belly Technologies — Restaurant Loyalty Gamification Data](https://bellyup.com) — gamification ROI data; single source, needs cross-validation
- [Technomic 2025 Consumer Brand Tracker](https://technomic.com) — restaurant loyalty benchmarks; paywalled, summary used

---

## Appendix: Full Pitfall Register

See `.planning/research/PITFALLS.md` for the complete register of 13 critical pitfalls, technical debt patterns, integration gotchas, performance traps, security mistakes, UX pitfalls, "looks done but isn't" checklist, and recovery strategies.

---

*Research completed: 2026-03-22*
*Ready for roadmap: yes*
