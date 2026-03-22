---
wave: 1
depends_on: []
files_modified: []
autonomous: true
---

# Plan 03: InstantDB Schema

**Goal:** Create `src/lib/schema.ts` with all 6 entities, create `src/lib/instantdb.ts` with the InstantDB client instance, and push the schema to InstantDB. Also create `schema-version.txt`.

**REQ-IDs:** SYNC-01 (schema foundation)

---

## Tasks

### Task 1 — Create `src/lib/schema.ts`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q3 contains the complete schema definition with all 6 entities and exact field types
</read_first>

<action>
Create the directory `/Users/nhannguyenthanh/Developer/lpoint/src/lib/` and write the file `/Users/nhannguyenthanh/Developer/lpoint/src/lib/schema.ts` with the following exact content (copied verbatim from research):

```typescript
import { i } from '@instantdb/react'

const schema = i.schema({
  version: 1,
  entities: {
    // Mirrors Clerk user record for webhook sync
    USERS: i.entity({
      clerk_user_id: i.string().unique().indexed(),
      username: i.string(),
      first_name: i.string().optional(),
      last_name: i.string().optional(),
      image_url: i.string().optional(),
      role: i.string().optional(), // 'ADMIN' | 'STAFF' — mirrors public_metadata.role
      last_sign_in_at: i.number().optional(),
      created_at: i.number(),
      updated_at: i.number(),
    }),

    // Customer record — phone is the primary lookup key
    CUSTOMER: i.entity({
      phone: i.string().unique().indexed(),  // normalized to +84XXXXXXXXX
      name: i.string(),
      gender: i.string(),                     // 'male' | 'female' | 'other'
      dob: i.string().optional(),             // ISO date string 'YYYY-MM-DD'
      address: i.string().optional(),
      total_points: i.number().default(0),    // Current available point balance
      last_earned_at: i.number().optional(), // Unix ms timestamp — drives 7-day bonus
      created_at: i.number(),
      updated_at: i.number(),
      created_by: i.string().optional(),     // clerk_user_id of STAFF who created
      deleted_at: i.number().optional(),      // Soft delete: non-null = deleted
    }),

    // Immutable transaction ledger — balance derived from summing entries
    TRANSACTION: i.entity({
      customer_id: i.string().indexed(),    // CUSTOMER.id
      clerk_user_id: i.string().indexed(),  // USERS.clerk_user_id — who performed the action
      type: i.string().indexed(),           // 'earn' | 'redeem' | 'expire' | 'adjust'
      points: i.number(),                   // positive = credit, negative = debit
      amount_spent: i.number().optional(), // VND amount for earn transactions
      tier_id: i.string().optional(),       // TIER.id for redeem transactions
      gift_name: i.string().optional(),     // Denormalized gift name at time of redeem
      bonus_type: i.string().optional(),    // 'return_7day' | 'stock_clear' | null
      reason: i.string().optional(),        // For adjustment type
      balance_before: i.number(),          // Snapshot before this transaction
      balance_after: i.number(),            // Snapshot after this transaction
      created_at: i.number(),
    }),

    // 6-tier reward program — Admin-configurable
    TIER: i.entity({
      name: i.string(),                       // e.g., 'Bronze', 'Silver', 'Gold'
      points_threshold: i.number().indexed(), // e.g., 100, 300, 600, 1000, 2000, 5000
      gift_name: i.string(),
      gift_description: i.string().optional(),
      sort_order: i.number(),               // For consistent ordering: 0–5
      active: i.boolean().default(true),
      created_at: i.number(),
      updated_at: i.number(),
    }),

    // Expiry audit log — created by cron job (Phase 9)
    EXPIRY_LOG: i.entity({
      customer_id: i.string().indexed(),  // CUSTOMER.id
      clerk_user_id: i.string().optional(), // 'CRON' for automated expiry
      expired_points: i.number(),          // Points that were zeroed
      balance_before: i.number(),
      balance_after: i.number(),           // Should be 0 after expiry
      reason: i.string(),                  // 'cron_60day_expiry'
      created_at: i.number(),
    }),

    // Menu items — Admin-configurable, used in earning flow
    MENU_ITEM: i.entity({
      name: i.string(),
      price: i.number(),                  // Price in VND (integer)
      active: i.boolean().default(true),
      created_at: i.number(),
      updated_at: i.number(),
    }),
  },
})

export default schema
```

The import is `from '@instantdb/react'` — this package exports the `i` schema builder.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/lib/schema.ts` exists
- File imports `i` from `@instantdb/react`
- Schema has `version: 1`
- Schema has exactly 6 entities: `USERS`, `CUSTOMER`, `TRANSACTION`, `TIER`, `EXPIRY_LOG`, `MENU_ITEM`
- `USERS` entity has `clerk_user_id: i.string().unique().indexed()`
- `CUSTOMER` entity has `phone: i.string().unique().indexed()`
- `CUSTOMER` entity has `total_points: i.number().default(0)`
- `CUSTOMER` entity has `last_earned_at: i.number().optional()`
- `CUSTOMER` entity has `deleted_at: i.number().optional()` for soft delete
- `TRANSACTION` entity has `type: i.string().indexed()` with values 'earn'|'redeem'|'expire'|'adjust'
- `TIER` entity has `points_threshold: i.number().indexed()`
- Schema has `export default schema`
</acceptance_criteria>

---

### Task 2 — Create `src/lib/instantdb.ts`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Summary table confirms this file must be created
- InstantDB documentation on `init_schema` pattern
</read_first>

<action>
Write the file `/Users/nhannguyenthanh/Developer/lpoint/src/lib/instantdb.ts` with the following exact content:

```typescript
import { init_schema, i } from '@instantdb/react'
import schema from './schema'

// Initialize InstantDB with the schema.
// Use the app ID from environment variables.
// This client is used server-side (Route Handlers, Server Components).
//
// On the client side, wrap your component tree with <InstantProvider> instead
// (imported from '@instantdb/react' and instantiated with the same appId).

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ?? ''

if (!APP_ID) {
  throw new Error(
    'NEXT_PUBLIC_INSTANTDB_APP_ID is not set. ' +
    'Add it to your .env.local file.'
  )
}

const db = init_schema({ appId: APP_ID, schema })

export default db
```

Note: For client-side usage (React components), use `<InstantProvider>` from `@instantdb/react` with `appId={APP_ID}` and `schema={schema}` props. The `db` instance exported here is for server-side operations (Route Handlers, Server Actions).
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/lib/instantdb.ts` exists
- File imports `init_schema` and `i` from `@instantdb/react`
- File imports `schema` from `./schema` (relative path to schema.ts)
- File initializes InstantDB with `init_schema({ appId, schema })`
- File exports `db` as default
- File throws if `NEXT_PUBLIC_INSTANTDB_APP_ID` is not set
</acceptance_criteria>

---

### Task 3 — Push schema to InstantDB

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q3 confirms `npx instantdb push` must succeed
- `/Users/nhannguyenthanh/Developer/lpoint/.env.local` — must contain `INSTANTDB_ADMIN_TOKEN` before pushing
</read_first>

<action>
**Prerequisite:** `INSTANTDB_ADMIN_TOKEN` must be set in `.env.local` before running this command. See the Phase 1 Setup Guide for how to obtain this token.

From the project root `/Users/nhannguyenthanh/Developer/lpoint/`, run:

```bash
npx instantdb push --env=local
```

If the CLI prompts for the app ID, use the value of `NEXT_PUBLIC_INSTANTDB_APP_ID` from `.env.local`.

The command must exit with code 0 and show "Schema pushed successfully" or equivalent.

If it fails, check:
1. `INSTANTDB_ADMIN_TOKEN` is correctly set in `.env.local`
2. `NEXT_PUBLIC_INSTANTDB_APP_ID` is correctly set in `.env.local`
3. The token has admin permissions on that app ID
</action>

<acceptance_criteria>
- `npx instantdb push --env=local` exits with code 0
- Output contains no error messages (warnings about existing data are OK if the schema is correct)
- No schema validation errors are reported
</acceptance_criteria>

---

### Task 4 — Create `schema-version.txt`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q3 confirms schema version is pinned to this file
</read_first>

<action>
Write the file `/Users/nhannguyenthanh/Developer/lpoint/schema-version.txt` with the following exact content:

```
1
```

This file tracks the InstantDB schema version number. Increment this file whenever the schema is changed and `npx instantdb push` is re-run. The version number must match the `version` field in `src/lib/schema.ts`.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/schema-version.txt` exists
- File contains exactly the string `1` and nothing else (no trailing newline, no spaces)
- The version number matches `version: 1` in `src/lib/schema.ts`
</acceptance_criteria>

---

## Verification

```bash
# Verify schema file
grep "version:" /Users/nhannguyenthanh/Developer/lpoint/src/lib/schema.ts
# Must show: version: 1,

# Verify instantdb client
grep "init_schema\|export default" /Users/nhannguyenthanh/Developer/lpoint/src/lib/instantdb.ts

# Verify version file
cat /Users/nhannguyenthanh/Developer/lpoint/schema-version.txt
# Must output: 1

# Verify InstantDB push succeeded (after running push command)
# Check exit code of last push command
```

---

## must_haves

- [ ] `src/lib/schema.ts` defines all 6 entities with correct field types
- [ ] `src/lib/instantdb.ts` creates and exports the InstantDB client
- [ ] `npx instantdb push --env=local` succeeds with zero errors
- [ ] `schema-version.txt` contains `1` matching the schema version
- [ ] Both `src/lib/schema.ts` and `src/lib/instantdb.ts` compile without TypeScript errors
