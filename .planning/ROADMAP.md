# LPoint v1 Roadmap

**Created:** 2026-03-22
**Phases:** 10 | **Requirements:** 17 | **Granularity:** Fine

---

## Phase Summary Table

| # | Name | Goal | REQ-IDs | SC Count |
|---|------|------|---------|----------|
| 1 | Foundation | Clerk auth configured, InstantDB schema pushed | AUTH-01, AUTH-02 | 6 |
| 2 | RBAC Enforcement | Server-side role checks on all routes and pages | RBAC-01, RBAC-02 | 5 |
| 3 | Points Engine | Pure-lib earn/redeem/bonus/expiry logic, unit tested | POIN-01, POIN-05 | 6 |
| 4 | Core API Routes | Thin HTTP wrappers for earn/redeem + clerk webhook | POIN-01, POIN-05 | 5 |
| 5 | Staff Customer Ops | Lookup/create/edit customers (staff-facing UI) | CUST-01, CUST-02, CUST-03, CUST-04 | 6 |
| 6 | Staff Earn & Redeem | Earn and redeem forms with bonus preview | POIN-01, POIN-03, POIN-05 | 6 |
| 7 | Menu Management | MENU_ITEM CRUD for admin | MENU-01, MENU-02 | 5 |
| 8 | Tier Config | Admin-configurable 6-tier program setup | POIN-02 | 5 |
| 9 | Expiry Cron | Daily Vercel cron zeroes expired points + logs | POIN-04 | 5 |
| 10 | Admin Dashboard & Program Mgmt | Dashboard overview + expiry logs + transaction history | DASH-01, PROG-01 | 6 |

---

## Phase Details

---

### Phase 1 — Foundation

**Goal:** Clerk auth working with username/password (no signup), role in `public_metadata`, InstantDB schema defined and pushed.

**Mapped REQ-IDs:** `AUTH-01`, `AUTH-02`

**Success Criteria:**

1. Staff can sign in at `/sign-in` using Clerk username/password; sign-up page returns 404 or redirect
2. `public_metadata.role` is set to `"ADMIN"` or `"STAFF"` on all Clerk users
3. InstantDB `schema.ts` defines all v1 entities: `CUSTOMER`, `TRANSACTION`, `TIER`, `EXPIRY_LOG`, `MENU_ITEM`
4. `npx instantdb push` succeeds with zero errors; schema version pinned in `schema-version.txt`
5. Clerk webhook handler at `/api/auth/webhook` receives and verifies `svix-signature` headers
6. `lib/auth.ts` exports `getSession()` and `requireRole()` helpers that work in both Server Components and Route Handlers

---

### Phase 2 — RBAC Enforcement

**Goal:** Every protected page and API route enforces role checks server-side. UI buttons are cosmetic only — server is authoritative.

**Mapped REQ-IDs:** `RBAC-01`, `RBAC-02`

**Success Criteria:**

1. `/admin/*` routes render a 403 page when accessed by a STAFF session; ADMIN sessions render the actual page
2. `/staff/*` routes render normally for both ADMIN and STAFF sessions
3. All ADMIN-only API routes (`/api/admin/*`, `/api/points/adjust`) return 403 when called by STAFF
4. All STAFF-accessible API routes (`/api/points/earn`, `/api/points/redeem`) return 403 when called by unauthenticated requests
5. `requireRole('ADMIN')` throws a typed `403` response (not an unhandled exception) in Route Handlers

---

### Phase 3 — Points Engine

**Goal:** Pure business-logic library (`lib/`) with zero framework imports. Unit tests verify all edge cases. This is the hardest phase to get right — do not build UI before this passes.

**Mapped REQ-IDs:** `POIN-01`, `POIN-05`

**Success Criteria:**

1. `lib/points.ts` `earnPoints(amount: number)` returns correct integer points for all edge cases: 0, 9,999, 10,000, 19,999, 20,000, 99,999 VND
2. `lib/rules.ts` `evaluateBonuses(customerId)` correctly returns `{ returnBonus: 0|1, promoBonus: N }` based on `lastEarnedAt` — bonus applied when elapsed < 7 days, not applied when ≥ 7 days or null
3. `lib/points.ts` `redeemPoints(customerId, tierIndex)` throws if `currentBalance < tier.threshold`
4. `lib/transactions.ts` append-only log entries include `type`, `amount`, `points`, `balance_before`, `balance_after`, `created_by`, `reason` (for adjustments)
5. All `lib/` functions are pure (no side effects, no I/O) — mock-able for testing
6. Unit test suite passes 100% with edge-case coverage for floor rounding, 7-day boundary, and tier boundary (customer at exactly threshold)

**Model Notes:** Backend-heavy. No UI. Zero Next.js or InstantDB imports. Depends only on TypeScript types.

---

### Phase 4 — Core API Routes

**Goal:** Thin HTTP wrappers over `lib/`. Auth check → Zod validation → call `lib/` → return JSON. No business logic.

**Mapped REQ-IDs:** `POIN-01`, `POIN-05`, `SYNC-01`

**Success Criteria:**

1. `POST /api/points/earn` accepts `{ customerId, amount }`, returns `{ pointsEarned, bonuses, newBalance }`; returns 400 for amounts ≤ 0
2. `POST /api/points/redeem` accepts `{ customerId, tierIndex }`, returns `{ tier, newBalance }`; returns 400 for ineligible tier; returns 409 for insufficient balance
3. `POST /api/auth/webhook` handles `user.created`, `user.updated`, `user.deleted` events; creates/updates/deletes corresponding user in InstantDB `users` entity
4. All endpoints verify Clerk session via `auth()` before processing — unauthenticated requests return 401
5. All endpoints validate input via Zod schemas — invalid input returns 422 with field-level errors

**Model Notes:** Backend-heavy. Thin wrappers only. Depends on Phase 3 (`lib/`) and Phase 1 (auth helpers).

---

### Phase 5 — Staff Customer Ops UI

**Goal:** Staff can perform all customer-facing operations: lookup, create, view, edit. This is the first user-facing UI phase.

**Mapped REQ-IDs:** `CUST-01`, `CUST-02`, `CUST-03`, `CUST-04`

**Success Criteria:**

1. Staff types a phone number → normalized to `+84XXXXXXXXX` → customer record appears in < 3 seconds; if not found, show "not found" with create button
2. Staff fills create form (name, phone, gender required; dob, address optional) → saves → customer card appears
3. Duplicate phone on create returns inline error "Số điện thoại đã tồn tại" — no duplicate record created
4. Customer card displays: name, phone, current balance, tier progress bar (current tier → next tier threshold), days until expiry warning if < 14 days
5. Staff can edit customer name, dob, address; save persists to InstantDB; edit does not affect points
6. ADMIN can soft-delete customer; soft-deleted customers no longer appear in search results but remain in transaction history

**Model Notes:** UI-heavy. Staff-facing. Depends on Phase 4 (`/api/points/earn` not needed yet — this phase is read/create only).

---

### Phase 6 — Staff Earn & Redeem UI

**Goal:** Staff earn and redeem flows. Earn form shows bonus preview before confirming. Redeem shows eligible tiers only with two-step confirmation.

**Mapped REQ-IDs:** `POIN-01`, `POIN-03`, `POIN-05`

**Success Criteria:**

1. On earn screen, staff enters VND amount → preview shows base points + 7-day return bonus (+1 if eligible) in real time before submission
2. After earning, customer card updates with new balance and updated progress bar without page refresh
3. Redeem screen shows only tiers where `currentBalance >= threshold`; ineligible tiers are hidden, not greyed out
4. Redemption is one tier at a time — selecting a tier pre-fills that tier's gift name; two-step confirm (step 1: confirm gift, step 2: confirm points deduction)
5. After redemption, success state shows new balance = previous balance - threshold, transaction ID, and next eligible tier
6. Staff cannot earn or redeem for a soft-deleted customer — API returns 404

**Model Notes:** UI-heavy. Depends on Phase 4 (earn/redeem API routes) and Phase 5 (customer card component).

---

### Phase 7 — Menu Management UI

**Goal:** Admin can add, edit, and delete menu items that map to the `MENU_ITEM` entity.

**Mapped REQ-IDs:** `MENU-01`, `MENU-02`

**Success Criteria:**

1. Admin sees list of all menu items with name and price; sorted by name
2. Admin can add a new menu item (name required, price required, must be > 0); item appears in list immediately
3. Admin can edit any menu item's name or price; changes persist
4. Admin can delete a menu item; item removed from list; deletion is blocked if item is referenced in a bonus rule (v2 check)
5. `MENU_ITEM` entity stores `name`, `price`, `createdAt`, `updatedAt`

**Model Notes:** UI-heavy (Admin-facing). Depends on Phase 4 (admin CRUD API routes not yet built — but this phase adds the menu API route in parallel with Phase 4).

---

### Phase 8 — Tier Configuration UI

**Goal:** Admin can configure the 6 reward tiers — points threshold, gift name, gift description. Tiers drive all redemption eligibility.

**Mapped REQ-IDs:** `POIN-02`

**Success Criteria:**

1. Admin sees a tier list: 6 rows, each with threshold (points), gift name, description
2. Admin can edit any tier's fields inline; changes save to InstantDB `TIER` entity
3. Tier editor shows a prominent warning: "Thay đổi ngưỡng điểm sẽ áp dụng cho tất cả khách hàng ngay lập tức"
4. Tier thresholds are strictly ascending — saving a non-ascending order shows validation error
5. Initial seed: 6 default tiers are created on first run if `TIER` entity is empty

**Model Notes:** UI-heavy (Admin-facing). Tier data is read by Phase 6 (redeem UI) via InstantDB queries.

---

### Phase 9 — Expiry Cron & Logs

**Goal:** Daily Vercel cron job identifies customers with `exp_pts_date <= now`, zeroes their `totalPoints`, creates `EXPIRY_LOG` entries. Idempotent — safe to run multiple times.

**Mapped REQ-IDs:** `POIN-04`

**Success Criteria:**

1. `GET /api/cron/expire` is protected by `CRON_SECRET` env var — direct browser access returns 401
2. Cron job queries only customers where `exp_pts_date <= now AND totalPoints > 0`; processes in chunks of 100
3. Each expiry creates an `EXPIRY_LOG` entry with `customerId`, `pointsExpired`, `expiredAt`, `cronRunId` — `cronRunId` prevents double-expiry across retries
4. Customer's `totalPoints` set to 0 and `exp_pts_date` reset to `null` after expiry
5. Cron completes in < 60 seconds even with 1,000+ customers; logs job duration to Vercel

**Model Notes:** Backend-heavy. Vercel Cron configuration (`vercel.json`) must be added in this phase. Depends on Phase 3 (`lib/expiry.ts`).

---

### Phase 10 — Admin Dashboard & Program Management

**Goal:** Admin gets a real-time overview of program health. Can drill into expiry logs and full transaction history.

**Mapped REQ-IDs:** `DASH-01`, `PROG-01`

**Success Criteria:**

1. Dashboard shows: total points earned (sum of all earn transactions), total points spent (sum of all redemption transactions), total customers, customers with points expiring in next 14 days
2. Recent transactions table: last 20 transactions with type, customer name, points, amount, timestamp
3. Expiry logs viewer: paginated list of `EXPIRY_LOG` entries with customer name, points expired, date
4. All transactions viewer: filterable by customer, type, date range; shows full audit trail
5. Point adjustment: ADMIN can add/subtract points for a customer with required `reason` field; adjustment creates a `TRANSACTION` with `type: 'adjustment'`
6. All dashboard numbers update in real time when new transactions occur (InstantDB reactive)

**Model Notes:** UI-heavy (Admin-facing). Depends on Phase 9 (expiry logs exist) and Phase 4 (transaction history API).

---

## Build Order & Dependencies

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6
                        │             ▲
                        │             │
                     Phase 7 (parallel with Phase 4)
                                             │
                                             ▼
Phase 8 (after Phase 7, before Phase 6 redeem)   Phase 9
                                             │         │
                                             ▼         │
                                      Phase 10 ◄───────┘
```

### Dependency Notes

- **Phase 1 → Phase 2**: RBAC helpers in `lib/auth.ts` depend on Clerk being configured
- **Phase 2 → Phase 3**: Points engine needs `requireRole()` from Phase 2 to be safe to import, but the lib itself has no runtime dependency
- **Phase 3 → Phase 4**: API routes are thin wrappers; unit tests must pass Phase 3 before Phase 4 starts
- **Phase 4 + Phase 7**: Can be built in parallel — both are backend API routes with no mutual dependency
- **Phase 5 → Phase 6**: Phase 6 (earn/redeem) reuses Phase 5 customer card component
- **Phase 7 → Phase 8**: Tier config builds on menu-item entity; both need admin CRUD (Phase 4)
- **Phase 9 → Phase 10**: Dashboard needs expiry logs from Phase 9; can be built in parallel with Phase 6
- **Phase 4 → Phase 10**: Transaction history API routes needed for dashboard

### Parallelization Guidance

| Group | Phases | Can Run In Parallel Because |
|-------|--------|----------------------------|
| A | Phase 1, Phase 2 | Independent — Phase 2 is pure middleware |
| B | Phase 3 | Must complete before Phase 4 starts |
| C | Phase 4, Phase 7 | Both are API route groups, no mutual dependency |
| D | Phase 8, Phase 9 | Tier editor (Phase 8) independent of cron (Phase 9) |
| E | Phase 5, Phase 6 | Phase 6 depends on Phase 5 customer card component |
| F | Phase 6, Phase 10 | Both depend on Phase 4 API routes; no mutual dependency |

### Model Distribution Summary

| Type | Phases |
|------|--------|
| **Backend-heavy** | Phase 3 (lib/), Phase 4 (API routes), Phase 9 (cron) |
| **UI-heavy** | Phase 5 (Staff Customer UI), Phase 6 (Staff Earn/Redeem UI), Phase 7 (Menu UI), Phase 8 (Tier Config UI), Phase 10 (Admin Dashboard) |
| **Mixed** | Phase 2 (middleware + route guards), Phase 1 (config + schema) |

---

## Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Promo/stock-clear bonus (POIN-05b, STCK-01, STCK-02) | Deferred to v2 |
| Customer self-signup | Staff creates all records |
| POS integration | Manual bonus entry only in v1 |
| Cash redemption | Points not convertible to cash |
| Customer notifications | No contact channel |
| Mobile app | Web-first only |
| Gift stock tracking | No inventory for gifts in v1 |

---

*Roadmap created: 2026-03-22*
*Phases: 10 | Requirements mapped: 17/17*

---

## Execution Status

| # | Phase | Status | Plans Done |
|---|-------|--------|------------|
| 1 | Foundation | 🟡 In Progress | 03/05 |
| 2 | RBAC Enforcement | ⬜ Not Started | — |
| 3 | Points Engine | ⬜ Not Started | — |
| 4 | Core API Routes | ⬜ Not Started | — |
| 5 | Staff Customer Ops | ⬜ Not Started | — |
| 6 | Staff Earn & Redeem | ⬜ Not Started | — |
| 7 | Menu Management | ⬜ Not Started | — |
| 8 | Tier Config | ⬜ Not Started | — |
| 9 | Expiry Cron | ⬜ Not Started | — |
| 10 | Admin Dashboard | ⬜ Not Started | — |

*Roadmap updated: 2026-03-22*
