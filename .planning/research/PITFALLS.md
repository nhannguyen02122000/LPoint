# Pitfalls Research

**Domain:** Loyalty points app (LPoint — Vietnamese café/restaurant rewards program)
**Researched:** 2026-03-22
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: Race Condition in Point Redemption (Double-Spend)

**What goes wrong:**
A staff member taps "Earn Points" or "Redeem Gift" twice rapidly (or two concurrent API calls process the same customer), and the system processes the action twice. The customer's balance goes negative, or inventory is over-redeemed. The user may receive points or gifts they didn't pay for.

**Why it happens:**
InstantDB mutations are not atomic by default across multiple operations. Earning points requires reading current balance → adding points → writing back. If two requests interleave, both read the same balance and both write back — one overwrites the other, resulting in only one deduction instead of two, or a negative balance.

**How to avoid:**
- Use InstantDB's **transactional mutations** with `instant.with` to batch read + write atomically.
- Add an **idempotency key** (session ID or request ID) to each mutation and deduplicate on the server.
- For redemption: validate `current_balance >= points_to_redeem` inside the transaction, not before it.
- Never do `fetch → compute → write` as separate steps.

**Warning signs:**
- "Earn Points" button has no debounce or loading state — users can double-click.
- Redemption endpoint returns success before DB write is confirmed.
- No error thrown when balance goes negative on redemption.

**Phase to address:**
**Phase 2 — Core Features** (redemption + earning must be transactionally safe before going live)

---

### Pitfall 2: Points Arithmetic with Floating-Point or Wrong Rounding

**What goes wrong:**
Points are calculated using `Math.round` or floating-point math instead of `Math.floor`. A 59,000 VND purchase gives 5 points (correct: floor) but a 61,000 VND purchase gives 7 points due to rounding errors instead of 6. Over hundreds of transactions, this silently leaks or overcharges points.

**Why it happens:**
JavaScript `+` and `*` on floating-point numbers produce precision errors. Developers use `parseFloat` or `/` instead of integer math. The rule "floor odd amounts" is implemented inconsistently — sometimes `Math.round`, sometimes `toFixed`, sometimes just truncation.

**How to avoid:**
- Always store and compute points as **integers** (never floats).
- Formula: `Math.floor(amount / 10000)` — pure integer division, no floating point.
- Test the formula with edge cases: 0, 10000, 19999, 20000, 99999.
- Extract point calculation into a single, tested utility function reused everywhere.

**Warning signs:**
- Point amounts contain decimals anywhere in the UI or DB.
- `* 0.1` or `/ 10000` appears in point calculation code.
- No unit test for point arithmetic.

**Phase to address:**
**Phase 2 — Core Features** (point calculation utility must be unit-tested before any earning logic)

---

### Pitfall 3: Points Expiry Cron Misfires (Double-Expiry or Missed Expiry)

**What goes wrong:**
The Vercel cron job fires twice due to provider retry, expiring a customer's points twice. Or it fails to fire for a day due to infrastructure maintenance, and points don't expire on schedule. Both violate the "60-day expiry" contract with customers.

**Why it happens:**
Vercel Cron gives **at-least-once** guarantees, not exactly-once. A cron run can fire multiple times in quick succession during redeployments or infrastructure events. There's also no distributed lock preventing concurrent execution.

**How to avoid:**
- **Idempotency**: The expiry job must be safe to run twice. Mark records as "processed at [timestamp]" before expiring. Skip records where `last_expiry_check >= today`.
- **Due-date query pattern**: Only query customers where `latest_point_expiry_date <= NOW()` AND points > 0, not all customers.
- **Batch processing**: Process in chunks of 100–500 to avoid timeouts and allow resumable runs.
- Add a `processed_at` timestamp on each expiry ledger entry so reconciliation can detect gaps.

**Warning signs:**
- Cron job has no logging of which records were processed.
- Expiry job mutates balance without writing a ledger entry first.
- No monitoring alert if cron fails or runs for > 60 seconds.

**Phase to address:**
**Phase 2 — Core Features** (expiry cron must be idempotent and monitored before launch)

---

### Pitfall 4: Clerk → InstantDB Sync Break (Webhook Misconfiguration)

**What goes wrong:**
Staff accounts exist in Clerk but never get created in InstantDB (or vice versa), causing auth errors or orphaned records. A user is deleted in Clerk but their InstantDB record persists. Roles in Clerk `public_metadata` don't match InstantDB permissions.

**Why it happens:**
Clerk webhooks are not guaranteed to fire in order or immediately. Webhook delivery can fail silently. Developers test the happy path but don't handle `user.deleted` or `user.updated` events, or forget to configure webhooks at all during setup.

**How to avoid:**
- Implement **all three Clerk webhook events**: `user.created`, `user.updated`, `user.deleted`.
- Verify webhook signatures in the handler (`svix` or Clerk's SDK).
- On startup, run a **reconciliation check**: compare Clerk users against InstantDB records and log mismatches.
- Never allow InstantDB mutations based solely on Clerk session data without verifying the user exists in InstantDB.

**Warning signs:**
- Staff can log into Clerk but gets "Access Denied" in the app — missing InstantDB sync.
- InstantDB user records have no `clerk_user_id` field for linking.
- Webhook endpoint returns 200 but does no actual DB write.

**Phase to address:**
**Phase 1 — Auth + Infrastructure** (Clerk-InstantDB sync must be tested and verified before Phase 2)

---

### Pitfall 5: Tier Configuration Changes Apply Retroactively

**What goes wrong:**
An ADMIN edits tier thresholds mid-program (e.g., lowers the 500-point threshold to 300). Existing customers who already accumulated 400 points are immediately eligible for a tier they shouldn't have qualified for yet — customers redeem gifts the shop can't afford, or staff disputes arise.

**Why it happens:**
Tier eligibility is computed dynamically from the current tier config table at display-time, not stored on the customer record. When config changes, all existing customers are re-evaluated immediately.

**How to avoid:**
- Store **frozen tier snapshots** on each customer at the time of last transaction (e.g., `tier_config_at_last_transaction`).
- Display "Your current tier threshold: X points → Y points" based on *stored* snapshot, not live config.
- Alternatively: clearly document that tier thresholds are for *new* earning transactions, with a migration script to retroactively apply if business wants.
- ADMIN tier edit UI must warn: "This affects all current customers immediately."

**Warning signs:**
- No `tier_snapshot` or `tier_config_version` field on customer records.
- Tier threshold is read live from the config table on every lookup.
- ADMIN can edit tiers without any confirmation dialog about retroactive effects.

**Phase to address:**
**Phase 2 — Core Features** (tier logic must be designed with mutability in mind before building ADMIN tier management)

---

### Pitfall 6: RBAC Bypass — STAFF Accessing ADMIN-Only Actions

**What goes wrong:**
A STAFF user accesses an ADMIN-only API route (e.g., deleting a customer, adjusting point balances, editing tiers) by directly calling the endpoint or manipulating the UI (devtools). Sensitive operations are not enforced server-side.

**Why it happens:**
Role checks are implemented only in the UI (hiding buttons) but not in API routes. Clerk `public_metadata.role` is read client-side but not verified server-side in Route Handlers. Next.js Server Components skip client-side auth checks entirely.

**How to avoid:**
- **Always verify `role` in the Server Component or Route Handler**, not just in the UI.
- Create a shared `requireRole(role)` helper that throws or redirects if the current user's role doesn't match.
- Use Clerk's `auth()` in Server Components to get the user and check `publicMetadata.role`.
- Add a **middleware-level check** for protected routes: redirect if role is insufficient.
- Never trust client-side role state for authorization.

**Warning signs:**
- ADMIN-only buttons are hidden with CSS but not removed from the DOM.
- API routes accept `POST` without checking `process.auth()` first.
- Role comparison uses loose equality (`==`) or string manipulation.

**Phase to address:**
**Phase 1 — Auth + Infrastructure** (RBAC must be enforced server-side before building any features)

---

### Pitfall 7: Phone Number as Primary Key — Format Drift

**What goes wrong:**
Customers are registered with phone "0912 345 678" (spaces), "0912345678" (no country code), "+84912345678" (E.164), and "84912345678" (prefixed). Searching for a customer fails because the exact format doesn't match. Or: staff accidentally create duplicate customer records under different formats.

**Why it happens:**
No normalized phone format enforced at entry. InstantDB uses phone as the PK, so format matters. Staff type phones manually without validation. The country code prefix (+84) may or may not be included.

**How to avoid:**
- **Normalize on input**: Strip spaces, ensure consistent format (e.g., `+84XXXXXXXXX` for Vietnam) before writing to InstantDB.
- Validate with a regex: `^\+84[0-9]{9,10}$`.
- Create a `normalizePhone(phone)` utility used at every entry point (create, search, earn, redeem).
- Add a DB-level constraint or unique index (InstantDB handles this via PK uniqueness) and surface a friendly error on duplicates.

**Warning signs:**
- Customer lookup by phone sometimes works and sometimes doesn't.
- Staff manually add "+84" in search but not during creation.
- No phone validation regex in the customer creation form.

**Phase to address:**
**Phase 2 — Core Features** (phone normalization must be in place before customer creation goes live)

---

### Pitfall 8: Stock-Clear Items Not Reset Daily

**What goes wrong:**
A stock-clear item is marked for bonus on Monday. Tuesday, the item is sold out, but the bonus still shows for STAFF and customers, creating a bad experience when the bonus is claimed but the item is unavailable.

**Why it happens:**
Stock-clear items have a `date` field but the bonus rule checks `date == today` lazily (or not at all), so yesterday's items still qualify.

**How to avoid:**
- In the earning flow, filter stock-clear items by `date == today` explicitly.
- Add a daily cron job (or run at midnight) to auto-expire yesterday's stock-clear items.
- Show expiry status in ADMIN stock-clear management UI (e.g., "Active today" vs "Expired").
- When stock runs out, STAFF should be able to manually deactivate a stock-clear item.

**Warning signs:**
- Stock-clear items have no `date` field — just a boolean `is_stock_clear`.
- No automatic expiration of old stock-clear items.
- STAFF has no way to deactivate a stock-clear item mid-day.

**Phase to address:**
**Phase 2 — Core Features** (stock-clear logic must include daily expiration before this feature goes live)

---

### Pitfall 9: InstantDB Schema Not Pushed After Changes

**What goes wrong:**
The developer adds a new field (e.g., `last_expiry_check`) or entity (e.g., `expiry_log`) to the schema locally, commits the code, deploys — but InstantDB still has the old schema. Mutations fail silently or throw type errors at runtime. The app breaks for users.

**Why it happens:**
InstantDB requires an explicit **schema push** via the CLI (`npx instantdb push`) after every schema change. This is a manual step outside the normal code deploy flow. In team environments, another developer may push a different schema. No CI check enforces schema parity.

**How to avoid:**
- Add `npx instantdb push` as a **post-deploy step** in the CI/CD pipeline (Vercel build hook or GitHub Actions).
- Document schema push steps clearly in the README/setup guide.
- Before every deploy, run a schema diff check: `npx instantdb schema diff` (if available) or verify via the InstantDB debugger.
- Pin the schema version in a `schema-version.txt` file committed alongside the code.

**Warning signs:**
- Schema changes are made in code but never pushed to InstantDB.
- No CI step for schema validation.
- InstantDB debugger shows a different schema than the codebase.

**Phase to address:**
**Phase 1 — Auth + Infrastructure** (schema push process must be automated before any feature development)

---

### Pitfall 10: No Audit Trail for Manual Point Adjustments

**What goes wrong:**
An ADMIN manually adjusts a customer's points to fix a billing error, but there's no record of *who* did it, *why*, or *what the before/after balance was*. Customer disputes arise with no way to verify the adjustment. In a loyalty program where trust is everything, this destroys credibility.

**Why it happens:**
Manual adjustments bypass the normal earning/redemption flow and write directly to the balance field. There's no `adjustment_reason`, `adjusted_by`, or `adjustment_type` field on the transaction log.

**How to avoid:**
- **Never write directly to `balance`** — always go through a transaction log entry (`transactions` entity with `type: 'adjustment'`).
- Record `adjusted_by` (Clerk user ID), `reason`, `amount` (positive or negative), and `balance_before` / `balance_after`.
- ADMIN point adjustment UI must require a reason field (no blank adjustments).
- Display adjustment entries in the customer transaction history with a distinct icon/color.

**Warning signs:**
- `balance` is updated directly via `instantdb.mutate()` without a corresponding transaction entry.
- No `reason` field on any point mutation.
- Transaction history shows gaps or jumps in balance with no explanation.

**Phase to address:**
**Phase 2 — Core Features** (all point changes must go through the transaction log before ADMIN features ship)

---

### Pitfall 11: Expiry Ledger Entries Missing — Balance Goes Negative on Concurrent Redemption

**What goes wrong:**
While the expiry cron is processing a customer, a STAFF simultaneously earns or redeems points for that same customer. The expiry job reads the old balance, deducts expired points, writes back. The STAFF's transaction completes after — and overwrites the expiry, restoring a balance that should have been reduced. Or worse: the STAFF redemption reads the pre-expiry balance and approves a redemption that leaves the balance negative after expiry runs.

**Why it happens:**
No row-level locking between the expiry cron and the live transaction flow. Both read the same balance without coordination.

**How to avoid:**
- **Ledger-based accounting**: every point change (earn, redeem, expire, adjust) creates an immutable ledger entry. Balance is a **sum view** over the ledger, not a mutable column.
- If using a mutable balance column, use InstantDB transactions with optimistic locking: include `balance: current_balance` in the mutation's `where` clause, and retry if zero rows updated.
- Expiry job and live transactions must be mutually exclusive per customer (either serialize via a queue, or use conditional mutations).

**Warning signs:**
- `balance` is a plain field updated with `+amount` or `-amount`.
- No `version` or `last_modified` field on the customer record for optimistic locking.
- Expiry job runs without any conflict detection with live transactions.

**Phase to address:**
**Phase 2 — Core Features** (ledger architecture must be designed upfront — retrofitting is painful)

---

### Pitfall 12: Demo Mode Bleeds Into Production

**What goes wrong:**
The app works in development/demo with hardcoded test values: test Clerk credentials, `test-` prefixed InstantDB app ID, fake tier thresholds (10 points per tier), demo customer phone numbers. These values ship to production and either cause errors or create a non-functional system.

**Why it happens:**
Environment variable validation is absent. The app silently falls back to hardcoded demo values when env vars are missing. No build-time check fails if required env vars are absent.

**How to avoid:**
- Validate all required env vars on app startup (in a `lib/env.ts` or `middleware.ts`).
- Throw a build error or hard crash with a clear message if `NEXT_PUBLIC_INSTANTDB_APP_ID`, `CLERK_SECRET_KEY`, etc. are missing.
- Never have a "demo mode" that bypasses real credentials — if env vars are missing, the app must fail visibly, not silently.
- Add a `CHECK_ENV` build step in CI that verifies all required env vars are set in production.

**Warning signs:**
- `.env.example` or `.env.local` has placeholder values that look real.
- App functions without throwing when `INSTANTDB_ADMIN_TOKEN` is missing.
- Any feature has a `DEMO_MODE` or `if (!process.env.X) useFake()` code path.

**Phase to address:**
**Phase 1 — Auth + Infrastructure** (env validation must be the first thing built, before any feature code)

---

### Pitfall 13: No Rate Limiting on Customer Lookup (Phone Enumeration)

**What goes wrong:**
An attacker scripts rapid phone number lookups against the `/api/lookup` endpoint, enumerating all registered customer phones in the system. Combined with no auth requirement (customer lookup is designed for STAFF use but the endpoint has no auth guard), this exposes customer data to unauthenticated callers.

**Why it happens:**
The lookup endpoint was assumed to be behind the STAFF login UI, but the API route itself has no `auth()` check. Any caller with the API URL can hit it.

**How to avoid:**
- **Every API route must call `auth()`** from Clerk — no exceptions, even "internal-only" routes.
- Add rate limiting to all public-facing API routes (use Vercel's built-in rate limiting or a middleware rate limiter).
- Log all customer lookup requests with the requesting STAFF's ID for audit purposes.
- Consider adding a CAPTCHA or suspicious-activity flag if > N lookups per minute from the same session.

**Warning signs:**
- API routes have no `auth()` call at the top.
- Customer data is returned from an endpoint that isn't behind a Clerk session check.
- No logging of who looked up which customer and when.

**Phase to address:**
**Phase 1 — Auth + Infrastructure** (all API routes must be auth-guarded before Phase 2 starts)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing mutable `balance` instead of ledger entries | Simpler schema, faster reads | Race conditions on concurrent updates; retroactive fixes impossible | Never for a production loyalty system |
| Hiding ADMIN-only buttons client-side only | Faster to ship | RBAC bypass via devtools or direct API calls | Never — UI is not a security boundary |
| Skipping InstantDB schema push in CI | Saves 1 step | Schema drift between envs causes silent failures | Never |
| Using `parseFloat` for point amounts | Quick math | Precision errors on large transaction volumes | Never — use integer math only |
| Not writing expiry ledger entries | Less data to manage | Cannot reconcile or audit expiry events | Never |
| Hardcoded tier thresholds | No DB needed | Config changes require redeploy | Only in v0/MVP, with a deadline to move to DB |
| Allowing blank adjustment reasons | Faster ADMIN flow | Zero accountability for point changes | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Clerk → InstantDB** | Only handling `user.created`, ignoring `user.updated` and `user.deleted` | Handle all three webhook events; add a reconciliation script for drift |
| **Clerk webhooks** | Not verifying webhook signatures | Use Clerk's `svix` library to verify `svix-id`, `svix-timestamp`, `svix-signature` headers |
| **InstantDB** | Mutations without transactions for multi-step operations | Wrap read+write in `instant.with()` for atomicity |
| **Vercel Cron** | Non-idempotent expiry job that double-expires | Mark records `processed_at: timestamp` before expiring; skip if already processed |
| **Clerk RBAC** | Reading `role` client-side only | Always re-verify `publicMetadata.role` server-side in Route Handlers and Server Components |
| **InstantDB permissions** | Forgetting to push schema + perms after changes | Automate `npx instantdb push` in CI pipeline post-deploy |
| **Clerk auth in Server Components** | Using `getAuth()` from `@clerk/nextjs/server` inside `useEffect` | Use `auth()` at the top of Server Components; never client-side auth checks for protection |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full-table scan on customer lookup | Lookup by phone takes > 500ms at 10k+ customers | InstantDB indexes phone as PK by default — verify this is configured; avoid filtering on unindexed fields | > 5,000 customers |
| Expiry cron processing all customers | Cron times out or throttles at high customer count | Query only customers where `expiry_due <= now`; never scan all records | > 2,000 customers |
| Too many InstantDB subscriptions on dashboard | Real-time updates cause UI lag on ADMIN dashboard | Paginate dashboard queries; use `live: false` for ADMIN stats that don't need real-time | > 1,000 active customers |
| Large transaction history per customer | Loading customer info fetches all 500+ transactions | Pagination on transaction history; fetch only last 20 by default | > 200 transactions per customer |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| API routes without `auth()` check | Unauthenticated callers access customer data or trigger mutations | Every Route Handler must call `auth()` at the top |
| Role checked client-side only | STAFF elevates to ADMIN via devtools | Server-side role verification in every protected action |
| Phone number not normalized before lookup | Duplicate customer records, inconsistent data | `normalizePhone()` utility at every input + search point |
| Adjustment without reason field | Zero accountability; no audit trail | Required `reason` field on all point adjustments; log `adjusted_by` |
| Clerk webhook handler without signature verification | Attackers forge webhook events to create fake users or elevate roles | Always verify `svix-signature` header before processing events |
| No rate limiting on STAFF-facing API routes | Brute-force phone enumeration to harvest customer data | Rate limit all API routes; log lookup activity |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Customer doesn't know their current point balance after earning | Confusion, distrust, lost loyalty motivation | Show balance prominently immediately after earning: "+X points! You now have Y points. Z more to your next reward!" |
| No visible tier progress indicator | Customer doesn't know how close they are to the next reward | Show a progress bar: "2 more visits to unlock Tier 3!" |
| Gift redemption shows tier gift without confirming points cost | Customer confused when points are deducted unexpectedly | Two-step confirmation: "Redeem [Gift]? This costs [X] points. You have [Y]. Continue?" |
| Points expiry shown as a generic deduction | Customer upset: "I lost 300 points!" with no explanation | Show expiry details: "300 points from your purchase on Jan 15 expired (60-day policy)" |
| Stock-clear bonus not announced at earning time | Staff misses the promotion; customer doesn't know why they got bonus points | On earning flow, show: "🎉 Bonus! +1 extra point for clearing [item]" |
| Error messages leak internal details | "Invalid InstantDB query" or "Clerk token expired" confuses staff | Wrap all errors; show staff-friendly messages; log full errors server-side |

---

## "Looks Done But Isn't" Checklist

- [ ] **Point earning:** Missing floor rounding validation — verify `Math.floor(amount/10000)` is used, not `Math.round` or `parseFloat`
- [ ] **Point redemption:** No idempotency key — verify double-submitting the same redemption request doesn't double-deduct points
- [ ] **Points expiry:** Non-idempotent cron — verify running the expiry job twice doesn't double-expire
- [ ] **RBAC:** Role checked client-side — verify ADMIN routes work when Clerk role is manipulated in devtools
- [ ] **Auth on API routes:** No `auth()` call — verify all Route Handlers reject unauthenticated requests
- [ ] **InstantDB schema sync:** Schema push not in CI — verify a deploy without `instantdb push` still works (it shouldn't)
- [ ] **Phone normalization:** Format drift — verify "0912 345 678" and "0912345678" and "+84912345678" all return the same customer
- [ ] **Existence of transaction log:** Every balance change has a corresponding ledger entry — verify expiry, adjustment, earn, and redeem all create entries
- [ ] **Webhook sync:** `user.deleted` event handled — verify deleting a Clerk user also removes InstantDB access
- [ ] **Env vars:** App fails visibly without required env vars — verify removing `INSTANTDB_ADMIN_TOKEN` causes an immediate hard error

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-spend / double-redemption | HIGH | Identify affected customers via transaction log; calculate over-deducted amounts; create compensating positive adjustment entries with audit notes |
| Double-expiry from cron misfire | MEDIUM | Query `expiry_logs` for duplicate `expiry_job_run_id`; reverse duplicate entries; fund affected balances manually with adjustment log |
| Schema drift (code has field not in DB) | MEDIUM | Run `npx instantdb push` immediately; identify any transactions that failed during drift window; replay or void them |
| Clerk-InstantDB sync break | MEDIUM | Run reconciliation script; identify orphaned InstantDB users; remove or re-link as appropriate |
| Role escalation (STAFF accessed ADMIN) | HIGH | Revoke the affected Clerk session; audit all mutations from that user; review and tighten middleware checks |
| Points going negative | HIGH | Freeze affected customer accounts; audit transaction log; restore to last known good balance via compensating entries |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RBAC bypass (Phase 1 critical) | Phase 1 — Auth + Infrastructure | Manually test STAFF accessing ADMIN route via direct API call |
| Auth missing on API routes | Phase 1 — Auth + Infrastructure | Call API routes without Clerk session — expect 401 |
| Env var validation missing | Phase 1 — Auth + Infrastructure | Temporarily unset env vars — expect hard crash on startup |
| Clerk webhook sync broken | Phase 1 — Auth + Infrastructure | Delete a Clerk user via dashboard; verify InstantDB is updated |
| Schema not pushed in CI | Phase 1 — Auth + Infrastructure | Add schema change, deploy without push step — expect errors |
| Race condition in redemption | Phase 2 — Core Features | Load test with 10 concurrent redemption requests — balance must be correct |
| Points arithmetic wrong rounding | Phase 2 — Core Features | Unit test: `Math.floor(59000/10000) === 5`, `Math.floor(60000/10000) === 6` |
| Non-idempotent expiry cron | Phase 2 — Core Features | Run expiry twice in a row — verify no double-expiry |
| Tier config retroactively applied | Phase 2 — Core Features | Change tier thresholds; verify existing customers' tier snapshot is unchanged |
| Phone format drift | Phase 2 — Core Features | Register "0912 345 678", search "+84912345678" — expect same customer |
| Stock-clear not reset daily | Phase 2 — Core Features | Set stock-clear for yesterday; verify no bonus shown today |
| No audit trail for adjustments | Phase 2 — Core Features | Attempt adjustment without reason — expect form validation error |
| Negative balance from expiry-redemption race | Phase 2 — Core Features | Trigger expiry while redemption is in flight — verify no negative balance |
| Demo values in production | Phase 1 — Auth + Infrastructure | Verify all tier thresholds, IDs, and credentials are real env vars |
| Phone enumeration attack | Phase 1 — Auth + Infrastructure | Rapid-fire lookup requests — expect 429 or auth challenge |

---

## Sources

- [Vercel Cron: at-least-once delivery guarantees](https://vercel.com/docs/cron-jobs) — Cron can fire multiple times; design for idempotency
- [InstantDB Transactions](https://www.instantdb.com/docs/queries) — `instant.with()` for atomic multi-step mutations
- [Clerk Webhooks — Handling all events](https://clerk.com/docs/users/sync-data) — `user.created`, `user.updated`, `user.deleted` must all be handled
- [OWASP API Security Top 10 — BOLA/IDOR](https://owasp.org/API-Security/) — Broken Object Level Authorization; phone enumeration is a variant
- [Points System Race Condition Post-mortems](https://news.ycombinator.com/item?id=38924517) — Community discussion on double-spend bugs in loyalty systems
- [Ledger-based accounting for points](https://martinfowler.com/articles/patterns-of-distributed-systems/latency.html) — Balance as a sum view over immutable entries
- [Clerk RBAC — publicMetadata](https://clerk.com/docs/users/metadata) — Role enforcement must be server-side, not client-side

---
*Pitfalls research for: LPoint loyalty points app (Next.js + InstantDB + Clerk)*
*Researched: 2026-03-22*
