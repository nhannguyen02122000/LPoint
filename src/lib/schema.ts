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
      total_points: i.number(),    // Current available point balance (default 0 set in app code)
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
      active: i.boolean(),
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
      active: i.boolean(),
      created_at: i.number(),
      updated_at: i.number(),
    }),
  },
})

export default schema
