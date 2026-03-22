# LPoint — Chương trình tích điểm đổi quà

## What This Is

App tích điểm cho quán ăn/café — khách hàng tích điểm sau mỗi lần mua hàng và đổi quà theo 6 mốc. USER hệ thống (STAFF/ADMIN) đăng nhập qua Clerk để thao tác. Khách hàng (CUSTOMER) chỉ có record trong InstantDB, không đăng nhập app.

Tên: **LPoint** | Target: quán ăn/café nhỏ | Year: 2026

---

## Core Value

Khách hàng tích điểm dễ dàng mỗi lần mua, và luôn biết mình cần bao nhiêu điểm để đổi quà tiếp theo — tạo động lực quay lại.

---

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

- [ ] USER auth: STAFF/ADMIN sign in via Clerk username+password, no self-signup
- [ ] RBAC: UI/API enforces ADMIN vs STAFF permissions
- [ ] CUSTOMER management: create/read/update (soft delete ADMIN only) via InstantDB
- [ ] Loyalty lookup: search customer by phone → show info + redeemable gifts
- [ ] Point earning: 10,000 VND = 1 point, floor on odd amounts
- [ ] 6-tier reward program: ADMIN-configurable tiers, each with points threshold + gift
- [ ] Point redemption: customer exchanges points for gift, logged as transaction
- [ ] Point expiry: points expire after 60 days, zeroed + logged, cron job handles
- [ ] Bonus rules: 7-day return bonus, promotional item bonus, daily stock-clear bonus
- [ ] Stock-clear items: ADMIN marks items per day for bonus; STAFF sees promotion when earning
- [ ] ADMIN dashboard: overview stats (total points, gifts redeemed, new customers, recent transactions)
- [ ] ADMIN program management: edit tier thresholds/gifts, view expiry logs, view all transactions
- [ ] Clerk integration: InstantDB sync via Clerk webhooks, schema/push with app ID

### Out of Scope

- Customer self-signup / customer-facing app — customers have no login
- POS / inventory integration — stock-clear items manually marked by ADMIN
- Cash redemption — points not convertible to cash
- Real-time notifications to customers (no contact channel)
- Mobile app — web-first

---

## Context

**Existing codebase:** Fresh Next.js 16.2.1 scaffold with Clerk + Tailwind v4 + TypeScript. No business logic yet.

**Tech confirmed:**
- Next.js 16.2.1 (App Router, Server Components default)
- Clerk for auth (username/password, no signup, role in public_metadata)
- InstantDB for data (app ID in env)
- Tailwind v4 styling
- Vercel for hosting (cron jobs on API routes)
- No POS / inventory integration planned for v1

**Business logic from program.docx:**
- Thể lệ: 10k = 1 điểm, bỏ số lẻ (59k = 5đ, 60k = 6đ)
- 6 mốc đổi quà (điểm → quà, có thể ADMIN sửa trong v1)
- Điểm có hiệu lực 60 ngày
- Bonus: quay lại 7 ngày +1đ, mua món quảng cáo +1đ, clear tồn kho +1đ
- Không quy đổi tiền mặt

**InstantDB schema changes and perms push required** when modified (app ID in .env.local).

**ENV variables required:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_INSTANTDB_APP_ID
INSTANTDB_ADMIN_TOKEN
```

---

## Constraints

- **Auth**: Clerk-only, no third-party SSO, no customer self-signup
- **Database**: InstantDB — phone is primary key for CUSTOMER
- **Point expiry**: Vercel cron job (API route) runs daily to zero expired points + log
- **Redemption rule**: 1 redemption = 1 tier only (cannot redeem 2 tiers at once)
- **Variable names**: English throughout
- **UI/UX**: Use /ui-ux-pro-max skill for frontend phases
- **DB sync**: Clerk + InstantDB via webhooks (setup steps required for user)

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clerk username/password only | Control STAFF/ADMIN accounts strictly, no public signup | — Pending |
| InstantDB with phone as PK | Fast, simple, no separate ID needed | — Pending |
| Vercel cron for point expiry | No separate server needed | — Pending |
| 6 configurable tiers in DB | ADMIN adjusts rewards without deploy | — Pending |
| Customer no login | Keep system simple; staff handle all transactions | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-22 after initialization*
