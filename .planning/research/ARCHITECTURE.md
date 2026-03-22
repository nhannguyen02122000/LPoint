# Architecture Research

**Domain:** Loyalty Points / Reward Program Systems
**Researched:** 2026-03-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Staff UI     │  │ Admin UI     │  │ Customer Lookup  │  │
│  │ (dashboard)  │  │ (program mgmt)│ │ (phone search)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
├─────────┴─────────────────┴───────────────────┴─────────────┤
│                     API LAYER (Next.js Routes)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ /api/auth   │  │ /api/points │  │ /api/admin/*       │  │
│  │ /api/customers│ │ /api/earn  │  │ /api/cron/expire   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬─────────┘  │
├─────────┴────────────────┴────────────────────┴──────────────┤
│                   BUSINESS LOGIC LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Points Engine│  │ Rule Engine  │  │ Reward Evaluator │  │
│  │ - earn()     │  │ - getBonus() │  │ - getEligible()  │  │
│  │ - redeem()   │  │ - 7-day ret  │  │ - getNextTier()  │  │
│  │ - expire()   │  │ - promo item │  │                  │  │
│  │ - calculate()│  │ - stock clear│  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────┘  │
├─────────┴─────────────────┴──────────────────────┴────────────┤
│                     DATA LAYER (InstantDB)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ CUSTOMER     │  │ TRANSACTION  │  │ TIER (config)    │  │
│  │ - phone (PK) │  │ - type       │  │ - threshold      │  │
│  │ - name       │  │ - points     │  │ - gift           │  │
│  │ - totalPoints│ │ - bonusType  │  │ - active         │  │
│  │ - expPtsDate │  │ - createdBy  │  │                  │  │
│  │ - createdAt  │  │ - createdAt  │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ EXPIRY_LOG   │  │ STOCK_CLEAR  │                        │
│  │ - customerId │  │ - date       │                        │
│  │ - expiredPts │  │ - itemIds[]  │                        │
│  │ - expiredAt  │  │ - active     │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation in LPoint |
|-----------|----------------|--------------------------|
| **Clerk Auth** | User identity, STAFF/ADMIN roles, session management | Handles STAFF/ADMIN login; roles in `public_metadata` |
| **Points Engine** | Core logic: earn, redeem, expire, calculate balance | `lib/points.ts` — pure functions, no side effects |
| **Rule Engine** | Evaluate bonus conditions (7-day return, promo item, stock-clear) | `lib/rules.ts` — predicate functions per bonus type |
| **Reward Evaluator** | Determine eligible tiers, next reward, redemption eligibility | `lib/rewards.ts` — tier lookup, threshold comparison |
| **Transaction Logger** | Immutable record of every points action | InstantDB TRANSACTION entity, append-only per session |
| **Expiry Cron** | Daily job to zero expired points | Vercel cron → `/api/cron/expire` → write EXPIRY_LOG |
| **Admin Dashboard** | Aggregate stats: totals, logs, program config | Server Components read InstantDB directly |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/              # Clerk auth routes (sign-in, middleware)
│   │   └── layout.tsx
│   ├── (dashboard)/         # STAFF/ADMIN shared layout
│   │   ├── layout.tsx       # RBAC guard, sidebar
│   │   ├── page.tsx         # Staff: customer lookup + actions
│   │   └── admin/           # ADMIN-only routes
│   │       ├── page.tsx     # Dashboard stats
│   │       ├── tiers/       # Tier management
│   │       ├── transactions/# All transaction logs
│   │       ├── expiry-logs/ # Expiry history
│   │       └── customers/   # Customer management
│   └── api/
│       ├── auth/            # Clerk webhook handler
│       ├── customers/       # CRUD on CUSTOMER
│       ├── points/          # earn / redeem endpoints
│       ├── tiers/           # ADMIN tier config
│       └── cron/
│           └── expire/      # Vercel cron: point expiry
├── lib/
│   ├── db.ts                # InstantDB client singleton
│   ├── auth.ts              # Clerk session helpers, role checks
│   ├── points.ts            # Points Engine: earn(), redeem(), getBalance()
│   ├── rules.ts             # Rule Engine: evaluateBonuses(), isPromoItem()
│   ├── rewards.ts           # Reward Evaluator: getEligibleTiers(), getNextTier()
│   ├── transactions.ts      # Transaction logger: logEarn(), logRedeem()
│   └── expiry.ts            # Expiry logic: getExpiredCustomers(), expirePoints()
├── components/
│   ├── ui/                  # Tailwind v4 base components
│   ├── customer-lookup.tsx  # Phone search + result display
│   ├── earn-form.tsx        # Point earning with bonus display
│   ├── redeem-form.tsx      # Reward redemption form
│   ├── tier-editor.tsx      # ADMIN: add/edit/delete tiers
│   └── stats-cards.tsx      # Dashboard aggregate cards
└── types/
    └── index.ts             # Shared TypeScript types: Customer, Transaction, Tier
```

### Structure Rationale

- **`(auth)/` and `(dashboard)/` route groups:** Clean separation of unauthenticated vs. authenticated routes without URL changes
- **`lib/` as pure business logic:** Points Engine, Rule Engine, Reward Evaluator have zero imports from Next.js or InstantDB — easy to test in isolation
- **`api/` routes are thin:** API handlers call `lib/` functions, never contain business logic themselves
- **`components/ui/`:** Shared primitives, isolated from domain logic
- **`types/index.ts`:** Single source of truth for entity shapes, shared between Server Components and API routes

## Architectural Patterns

### Pattern 1: Points Ledger (Append-Only Event Log)

**What:** Every points action (earn, redeem, expire) is recorded as an immutable TRANSACTION entry, never mutated. Current balance is derived by summing transactions.

**When to use:** Required for audit trails, reversibility, and compliance. Even at small scale, this prevents balance drift and simplifies debugging.

**Trade-offs:**
- ✅ Perfect audit trail, easy to debug discrepancies
- ✅ Reversals possible (add a negative transaction)
- ❌ Reads require aggregation (mitigated by caching current balance on CUSTOMER record)
- ❌ Slightly more writes per action

**Example:**
```typescript
// lib/transactions.ts
async function logEarn(ctx: InstantContext, opts: {
  customerId: string;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  bonusType: 'seven_day_return' | 'promo_item' | 'stock_clear' | null;
  staffId: string;
}) {
  await ctx.db.transactions().create({
    customer_id: opts.customerId,
    type: 'earn',
    base_points: opts.basePoints,
    bonus_points: opts.bonusPoints,
    total_points: opts.totalPoints,
    bonus_type: opts.bonusType,
    created_by: opts.staffId,
    created_at: Date.now(),
  });
}
```

### Pattern 2: Configurable Rule Engine

**What:** Bonus conditions and tier thresholds are data (stored in InstantDB), not code. Adding a new bonus type requires no deployment.

**When to use:** When business rules change frequently and non-technical admins need to configure them.

**Trade-offs:**
- ✅ Business can self-serve rule changes
- ❌ Runtime configuration adds complexity
- ❌ Must validate rule consistency (no circular thresholds, etc.)

**Example:**
```typescript
// lib/rules.ts
type BonusRule = {
  type: 'seven_day_return' | 'promo_item' | 'stock_clear';
  enabled: boolean;
  points: number; // bonus points awarded
};

async function evaluateBonuses(ctx: InstantContext, opts: {
  customerId: string;
  purchaseAmount: number;
  itemIds: string[];
  staffId: string;
}): Promise<BonusRule[]> {
  const bonuses: BonusRule[] = [];

  // 7-day return bonus
  const customer = await getCustomer(ctx, opts.customerId);
  if (customer && daysSinceLastVisit(customer) <= 7) {
    bonuses.push({ type: 'seven_day_return', enabled: true, points: 1 });
  }

  // Promo item bonus
  const promoItems = await getActivePromoItems(ctx);
  if (opts.itemIds.some(id => promoItems.includes(id))) {
    bonuses.push({ type: 'promo_item', enabled: true, points: 1 });
  }

  // Stock-clear bonus
  const stockClears = await getActiveStockClears(ctx);
  if (opts.itemIds.some(id => stockClears.includes(id))) {
    bonuses.push({ type: 'stock_clear', enabled: true, points: 1 });
  }

  return bonuses;
}
```

### Pattern 3: Tier-Based Reward Eligibility

**What:** Customers progress through discrete reward tiers. Each tier has a points threshold; upon reaching it, the customer is eligible to redeem the associated gift.

**When to use:** When rewards are fixed at each milestone, not continuously redeemable.

**Trade-offs:**
- ✅ Clear customer motivation (the "what do I get next?" loop)
- ❌ Customers must reach exact threshold (no partial redemption)
- ❌ 1 redemption = 1 tier (cannot combine tiers)

**Example:**
```typescript
// lib/rewards.ts
async function getEligibleTiers(ctx: InstantContext, customerId: string): Promise<Tier[]> {
  const customer = await getCustomer(ctx, customerId);
  const tiers = await ctx.db.tiers().query().sort('threshold').fetch();

  return tiers.filter(tier =>
    customer.totalPoints >= tier.threshold && tier.active
  );
}

async function getNextTier(ctx: InstantContext, customerId: string): Promise<Tier | null> {
  const customer = await getCustomer(ctx, customerId);
  const tiers = await ctx.db.tiers().query().sort('threshold').fetch();

  return tiers.find(tier => tier.threshold > customer.totalPoints && tier.active) ?? null;
}
```

## Data Flow

### Point Earning Flow

```
[Staff Action: enter phone + amount]
    ↓
/api/points/earn (POST)
    ↓
1. getCustomer(phone)          → InstantDB CUSTOMER lookup
    ↓
2. calculateBasePoints(amount) → Math.floor(amount / 10000)
    ↓
3. evaluateBonuses()           → lib/rules.ts (7-day, promo, stock-clear)
    ↓
4. logEarn()                   → Write TRANSACTION (immutable log)
    ↓
5. updateCustomer()            → Write CUSTOMER.totalPoints += earned
    ↓
6. Return { newBalance, bonusSummary, nextTier }
```

### Point Redemption Flow

```
[Staff Action: customer wants to redeem reward]
    ↓
/api/points/redeem (POST)
    ↓
1. getCustomer(phone)          → Load customer + current balance
    ↓
2. getEligibleTiers()           → lib/rewards.ts (which tiers can be redeemed)
    ↓ (user selects a tier)
3. assert customer.points >= tier.threshold
    ↓
4. logRedeem()                 → Write TRANSACTION (type: 'redeem')
    ↓
5. updateCustomer()            → CUSTOMER.totalPoints -= tier.threshold
    ↓
6. Return { remainingBalance, redeemedGift }
```

### Point Expiry Flow (Cron)

```
[Vercel Cron: daily at 00:00 UTC]
    ↓
GET /api/cron/expire (authenticated via cron secret)
    ↓
1. query CUSTOMER where exp_pts_date <= now
    ↓
2. For each expired customer:
    a. logExpiry()              → Write EXPIRY_LOG (preserves history)
    b. reset CUSTOMER.totalPoints = 0
    c. set exp_pts_date = null (or next expiry date)
    ↓
3. Return { expiredCount, totalPointsCleared }
```

### State Management

```
┌─────────────────────────────────────────────────────────┐
│                    InstantDB (Source of Truth)           │
│  CUSTOMER | TRANSACTION | TIER | EXPIRY_LOG | STOCK_CLEAR│
└────────────────────────────┬────────────────────────────┘
                             │ read on demand
                             ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Server Components                   │
│  - Admin dashboard (stats aggregation)                    │
│  - Customer lookup results                               │
└────────────────────────────┬────────────────────────────┘
                             │ props / Server Actions
                             ↓
┌─────────────────────────────────────────────────────────┐
│               Client Components (React)                  │
│  - Forms (earn, redeem)                                   │
│  - Interactive tier display                              │
│  - Real-time bonus preview                                │
└─────────────────────────────────────────────────────────┘
```

**Note:** For this scale, no separate state store (Redux/Zustand) is needed. Server Components + React props handle all state. InstantDB's reactive queries (`useQuery`) handle real-time UI updates for staff-facing screens.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–500 customers | **Current design is sufficient.** Single InstantDB app, no caching needed. |
| 500–5,000 customers | Add Redis cache for `CUSTOMER.totalPoints` reads. Denormalize `currentBalance` onto CUSTOMER for O(1) lookups instead of aggregating transactions. |
| 5,000–50,000 customers | Move transaction aggregation to a background job. Introduce read replicas or a reporting DB. Consider moving to PostgreSQL if InstantDB limits are hit. |

### Scaling Priorities

1. **First bottleneck: TRANSACTION aggregation** — As transactions grow, `getBalance()` summing all transactions per customer slows. **Fix:** Denormalize `totalPoints` onto CUSTOMER (already planned) and maintain it transactionally.
2. **Second bottleneck: Tier queries** — Tiers are small, rarely changed. **Fix:** Cache in module scope with a `revalidate` timer or ISR.

## Anti-Patterns

### Anti-Pattern 1: Mutating Balance Directly Without a Log

**What people do:** `customer.points += earned` and skip writing a TRANSACTION record.

**Why it's wrong:** No audit trail. Impossible to debug "where did my points go?" or handle disputes. Balance drift accumulates silently.

**Do this instead:** Always write a TRANSACTION first, then update derived balance. Treat the ledger as the source of truth.

### Anti-Pattern 2: Business Logic in API Routes

**What people do:** Writing `Math.floor(amount / 10000)` and bonus logic directly inside `app/api/points/earn/route.ts`.

**Why it's wrong:** Mixes I/O (request handling) with domain logic. Hard to unit test, hard to reuse, impossible to call from a cron job or future admin script.

**Do this instead:** Keep API routes thin. All business logic lives in `lib/` as pure or near-pure functions. API routes only handle auth verification, input validation, and calling `lib/` functions.

### Anti-Pattern 3: Storing Points as Floating-Point

**What people do:** Storing earned points as a decimal or using float arithmetic.

**Why it's wrong:** Floating-point rounding errors accumulate. Financial calculations require integer precision.

**Do this instead:** Store all points as integers. All arithmetic uses integer math. Display as integers. `Math.floor(amount / 10000)` — never `amount / 10000` as a float stored in DB.

### Anti-Pattern 4: Hardcoding Tier Thresholds

**What people do:** Writing tier thresholds as constants (`const TIER_1 = 60`) in application code.

**Why it's wrong:** Every tier change requires a code deploy. Business cannot experiment with reward programs independently.

**Do this instead:** Store tiers in InstantDB as a TIER entity. ADMIN UI allows editing. `lib/rewards.ts` reads tiers at runtime.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Clerk** | Webhooks → `/api/auth/webhook` | Sync user records to InstantDB. Role (`STAFF`/`ADMIN`) from `public_metadata`. No Clerk → InstantDB direct sync without webhooks. |
| **InstantDB** | Native JS SDK (`@instantdb/sdk`) | App ID in env. Admin token for server-side writes. Schema push via CLI (`npx instantdb schema push`). |
| **Vercel Cron** | `vercel.json` + API route | Runs `/api/cron/expire` daily. Authenticated via `CRON_SECRET` header. No external dependencies. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **API Route → lib/ (Points Engine)** | Direct function call | API route is the "I/O adapter" — calls pure lib functions. No dependency inversion needed at this scale. |
| **lib/rules.ts → InstantDB** | SDK calls | Rule Engine queries STOCK_CLEAR and promo items. Could be mocked for unit tests. |
| **Server Component → lib/** | Server-side function calls | Next.js Server Components can `await` lib functions directly. No network round-trip. |
| **Client Component → API Route** | HTTP POST | Forms submit to `/api/points/earn` and `/api/points/redeem`. Response is JSON. |

## Build Order Implications

The component dependency graph implies the following build sequence:

```
Phase 0: Foundation
  └─ InstantDB schema + Clerk webhook setup
     (CUSTOMER, TRANSACTION, TIER, EXPIRY_LOG, STOCK_CLEAR entities)

Phase 1: Core Engine (no UI)
  └─ lib/points.ts      → earn(), getBalance()
  └─ lib/rules.ts       → evaluateBonuses()
  └─ lib/rewards.ts      → getEligibleTiers(), getNextTier()
  └─ lib/transactions.ts → logEarn(), logRedeem()
  → Reason: Business logic is testable in isolation before any UI exists

Phase 2: API Routes (thin wrappers)
  └─ /api/customers/*   → CRUD on CUSTOMER
  └─ /api/points/earn   → calls lib/points.ts + lib/rules.ts
  └─ /api/points/redeem → calls lib/rewards.ts + lib/transactions.ts
  → Reason: API contracts are testable; UI can be built against them

Phase 3: Staff UI
  └─ Customer lookup (phone → info + balance)
  └─ Earn form (amount → preview points + bonuses)
  └─ Redeem form (tier selection → confirm → success)
  → Reason: Staff-facing flows are highest priority per Core Value

Phase 4: Admin UI
  └─ Dashboard stats (aggregates from TRANSACTION)
  └─ Tier editor (CRUD on TIER entity)
  └─ Expiry logs viewer (reads EXPIRY_LOG)
  └─ Stock-clear manager (CRUD on STOCK_CLEAR)
  → Reason: Admin tools are for operations, not customer-facing value

Phase 5: Automation
  └─ /api/cron/expire   → daily point expiry via Vercel cron
  └─ lib/expiry.ts      → getExpiredCustomers(), expirePoints()
  → Reason: Cron depends on Points Engine + Transaction Logger being stable
```

**Critical path:** Phase 1 (lib/) must be complete and tested before Phase 2 (APIs) and Phase 3 (UI) can meaningfully proceed. Skipping to UI first leads to business logic scattered across components.

## Sources

- [Microservices Architecture for Loyalty Programs — Microservices.io](https://microservices.io/patterns/microservices.html)
- [CQRS Pattern — Martin Fowler](https://martinfowler.com/cqrs/)
- [Event Sourcing — Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [InstantDB Documentation — Official](https://www.instantdb.com/docs)
- [Clerk Webhooks Guide — Official](https://clerk.com/docs/users/webhooks)
- [Vercel Cron Jobs — Official](https://vercel.com/docs/cron-jobs)

---

*Architecture research for: Loyalty Points System*
*Researched: 2026-03-22*
