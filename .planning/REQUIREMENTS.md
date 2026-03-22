# Requirements: LPoint

**Defined:** 2026-03-22
**Core Value:** Khách hàng tích điểm dễ dàng mỗi lần mua, và luôn biết mình cần bao nhiêu điểm để đổi quà tiếp theo — tạo động lực quay lại.

---

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign in with username and password via Clerk (sign-up disabled on Clerk)
- [ ] **AUTH-02**: Clerk user has role stored in `public_metadata.role` — either "ADMIN" or "STAFF"
- [ ] **SYNC-01**: Clerk webhooks sync users to InstantDB on create/update/delete

### RBAC

- [ ] **RBAC-01**: UI routes protected — STAFF cannot access admin-only pages
- [ ] **RBAC-02**: API actions protected — STAFF cannot call admin-only endpoints

### Customer

- [ ] **CUST-01**: Staff can create customer record (phone is PK; required: name, phone, gender; optional: dob, address)
- [ ] **CUST-02**: Staff can search customer by phone number
- [ ] **CUST-03**: Staff can view customer info and list of eligible (reachable) reward tiers
- [ ] **CUST-04**: Staff can edit customer; Admin can soft-delete customer; duplicate phone → error

### Menu

- [ ] **MENU-01**: `MENU_ITEM` entity in InstantDB with name and price fields
- [ ] **MENU-02**: Admin can add, edit, and delete menu items

### Points

- [ ] **POIN-01**: Staff can earn points for customer (10,000 VND = 1 point, floor on odd amounts)
- [ ] **POIN-02**: 6-tier reward program with Admin-configurable tiers (points threshold + gift name + description)
- [ ] **POIN-03**: Staff can redeem a tier for customer: show eligible tiers only → preview confirm → log transaction
- [ ] **POIN-04**: Points expire 60 days after last earn date; cron job zeros expired points daily and logs each expiry
- [ ] **POIN-05**: 7-day return bonus: system auto-checks `lastEarnedAt`; if < 7 days → +1 bonus point; log bonus type

### Dashboard

- [ ] **DASH-01**: Admin sees overview: total points earned/spent, total customers, recent transactions, points expiring soon

### Program Management

- [ ] **PROG-01**: Admin can edit tier thresholds and gift details; view per-customer expiry logs; view all transactions

---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Points

- **POIN-05b**: Promo/stock-clear bonus: Admin marks items as "bonus eligible" per day; Staff sees bonus items at earn screen and can select them (+1 point each, logged)

### Stock Clear

- **STCK-01**: Admin marks items per day for stock-clear bonus (with UI showing current list; manual reset, not auto-clear)
- **STCK-02**: Staff sees marked items at earn screen and can optionally select to apply +1 bonus point

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Customer self-signup | Staff creates customer records; keeps system simple |
| POS / inventory integration | No POS in v1; stock-clear manually managed |
| Cash redemption | Points not convertible to cash |
| Mobile app | Web-first only |
| Real-time customer notifications | No contact channel for customers |
| Gift stock tracking | Admin configures tiers, no inventory for gifts in v1 |
| Tier images | Text + description sufficient for v1 |
| STAFF undoing transactions | Transactions are append-only; corrections done via reverse transaction |

---

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 — Foundation | ⬜ Not Started |
| AUTH-02 | Phase 1 — Foundation | ⬜ Not Started |
| SYNC-01 | Phase 4 — Core API Routes | ⬜ Not Started |
| RBAC-01 | Phase 2 — RBAC Enforcement | ⬜ Not Started |
| RBAC-02 | Phase 2 — RBAC Enforcement | ⬜ Not Started |
| CUST-01 | Phase 5 — Staff Customer Ops UI | ⬜ Not Started |
| CUST-02 | Phase 5 — Staff Customer Ops UI | ⬜ Not Started |
| CUST-03 | Phase 5 — Staff Customer Ops UI | ⬜ Not Started |
| CUST-04 | Phase 5 — Staff Customer Ops UI | ⬜ Not Started |
| MENU-01 | Phase 7 — Menu Management UI | ⬜ Not Started |
| MENU-02 | Phase 7 — Menu Management UI | ⬜ Not Started |
| POIN-01 | Phase 3 — Points Engine + Phase 4 — Core API Routes + Phase 6 — Staff Earn & Redeem UI | ⬜ Not Started |
| POIN-02 | Phase 8 — Tier Configuration UI | ⬜ Not Started |
| POIN-03 | Phase 6 — Staff Earn & Redeem UI | ⬜ Not Started |
| POIN-04 | Phase 9 — Expiry Cron & Logs | ⬜ Not Started |
| POIN-05 | Phase 3 — Points Engine + Phase 4 — Core API Routes + Phase 6 — Staff Earn & Redeem UI | ⬜ Not Started |
| DASH-01 | Phase 10 — Admin Dashboard & Program Mgmt | ⬜ Not Started |
| PROG-01 | Phase 10 — Admin Dashboard & Program Mgmt | ⬜ Not Started |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17/17 ✅
- Unmapped: 0 ✅

---

## Phase Map

```
Phase 1  ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5 ──► Phase 6
                            │
                     Phase 7 (parallel with Phase 4)
                                             │
Phase 8, Phase 9                          Phase 10 ◄── Phase 9
(independent)                                    │
                                                  │
                                           Phase 6 (parallel)
```

---

*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after roadmap creation — traceability added*
