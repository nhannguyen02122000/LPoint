# Feature Research

**Domain:** Loyalty/Points App for F&B (Restaurants & Cafés)
**Researched:** 2026-03-22
**Confidence:** HIGH

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features staff/admins assume exist. Missing these = product feels broken or incomplete for a Vietnamese F&B context.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Customer lookup by phone** | Staff need to find customer in <5 seconds at register; no login, no app for customer | LOW | Phone = primary key in InstantDB; already in PROJECT.md |
| **Point earning (per VND spent)** | Core mechanic — 10k VND = 1 point, floor odd amounts | LOW | Already specified in PROJECT.md; table-stakes requirement |
| **Point redemption for gifts** | Reason customers care about the program; must work reliably | LOW | 6-tier system per PROJECT.md |
| **Visible tier/gift info** | Customer should know how close they are to the next reward | LOW | Staff can show screen; "endowed progress effect" drives 35% higher redemption (HBR) |
| **Transaction logging** | Audit trail; prevents disputes; required for expiry | LOW | Log every earn + redeem; ADMIN can view all transactions |
| **Per-visit receipt / confirmation** | Customer trust — "did my points register?" | LOW | Even a staff confirmation is sufficient |
| **Staff auth (STAFF/ADMIN)** | Only staff should operate the system; ADMIN needs higher privileges | LOW | Clerk username/password per PROJECT.md |
| **RBAC enforcement** | ADMIN-only actions (delete customer, edit tiers) must be protected | LOW | Role in Clerk public_metadata |

---

### Differentiators (Competitive Advantage)

Features that set LPoint apart for a small Vietnamese café/restaurant. These align with the Core Value: *"khách hàng luôn biết mình cần bao nhiêu điểm để đổi quà tiếp theo — tạo động lực quay lại."*

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Bonus point mechanics** | 3 distinct bonus types (return bonus, promo item, stock-clear) create urgency loops and drive repeat visits | MEDIUM | Already in PROJECT.md: +1đ return bonus (7-day), promo item bonus, daily stock-clear bonus |
| **Stock-clear bonus display** | Staff see active promotions at point-of-sale — no extra training needed | LOW | ADMIN marks items; STAFF auto-sees when earning |
| **60-day point expiry with urgency** | Creates time pressure to return; industry research shows expiry drives +10–15% repeat visits | MEDIUM | Cron job on Vercel; log every expiry event; consider 7-day/3-day warning in staff UI |
| **Admin-configurable tiers** | Owner adjusts rewards without code deploy — respond to costs or seasons instantly | LOW | 6 tiers stored in InstantDB; ADMIN edits via UI |
| **Admin dashboard (stats overview)** | Owner sees total points issued, gifts redeemed, new customers, recent transactions — at a glance | MEDIUM | Charts not required; numbers + tables sufficient for v1 |
| **Tier expiry warnings in staff UI** | Show customer "your points expire in X days" — proven to lift redemption 35% | LOW | Small callout next to customer card; no customer contact needed |
| **"Progress bar" to next tier** | Endowed progress effect — customer sees exactly how close they are to next gift | LOW | Show current points, next tier threshold, points needed |
| **No customer app / no download** | Staff handle everything — customer just gives phone number; zero friction for customer | LOW | This is a deliberate simplicity choice (see Anti-Features); actually a differentiator vs Starbucks/Toast who push consumer apps |
| **Referral-style re-engagement** | 7-day return bonus already does this — doubling down on "come back soon" loop | LOW | Built into bonus rules; no separate referral system needed for v1 |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem obviously good but create problems for LPoint's context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Customer-facing mobile app** | "Every loyalty app has one" | Requires customer onboarding, push notification infrastructure, maintenance. Small café customers won't download an app just for points. Breaks the "no-login" simplicity model. | Staff-facing screen only; customer sees results on receipt |
| **Customer self-signup via phone/OTP** | "Customers should register themselves" | Self-signup requires OTP infrastructure, fraud risk, and creates support burden. Staff can create customer record in 5 seconds. | STAFF creates customer record when first visit occurs |
| **POS / inventory integration** | "Automate bonus item selection" | Adds complex third-party dependency; requires POS vendor partnership; small F&B shops often use basic cash registers | ADMIN manually marks promo/stock-clear items per day |
| **Cash / money redemption** | "Let customers convert points to cash" | Restaurant margin is thin; creates fraud risk; violates program integrity; Vietnamese F&B operators explicitly want non-cash rewards | Points → physical/digital gift only |
| **Real-time customer notifications (SMS/Push)** | "Alert customers when points expire" | No customer contact channel in scope (no email/phone for marketing); adds compliance complexity (GDPR/NĐ27); operational overhead | Staff tells customer verbally at point of sale; expiry warnings in staff UI |
| **Gamification (badges, streaks, mini-games)** | "Make it fun like Starbucks" | High implementation cost; small Vietnamese café audience doesn't expect this; distracts from core value prop | Focus on clarity of progress + bonus urgency instead |
| **AI personalization / recommendations** | "Like Netflix for food" | Requires large data set + ML infrastructure; overkill for single-location small F&B | Admin-configured bonus items cover 80% of personalization value |
| **Multi-location / franchise support** | "Scale across chain" | Scope explosion; LPoint is for small, single-location shops | Single-location design; consider multi-location only in v2+ |
| **Point transfer between customers** | "Let families share points" | Fraud risk; accounting complexity; no meaningful F&B use case | Not needed |
| **No point expiry** | "It's friendlier / more trust-building" | Industry trend (Chipotle no-expiry) but reduces urgency loops; expiry is proven to drive repeat visits | 60-day expiry with clear staff communication; can offer "freeze" on expiry if customer returns within 7 days of expiry notice |

---

## Feature Dependencies

```
[Customer Lookup by Phone]
    └──requires──> [Point Earning]
                       └──requires──> [Point Redemption]
                                             └──requires──> [Transaction Logging]

[Staff Auth + RBAC]
    └──enforces──> [ADMIN: Edit Tiers]  (ADMIN only)
    └──enforces──> [STAFF: Earn/Redeem]  (both STAFF and ADMIN)

[Bonus Rules Engine]
    └──feeds──> [Point Earning]  (adds bonus points at earning time)
    └──feeds──> [Admin Dashboard]  (stock-clear bonus item selection UI)

[Point Expiry Cron Job]
    └──feeds──> [Transaction Logging]  (zero event logged)
    └──feeds──> [Staff UI Warnings]  (expiry countdown display)

[Admin Configurable Tiers]
    └──feeds──> [Redemption UI]  (dynamic tier list from DB)
    └──feeds──> [Admin Dashboard]  (current tier thresholds shown)
```

### Dependency Notes

- **Customer Lookup requires Point Earning:** Can't earn without identifying customer first.
- **Point Earning requires Bonus Rules:** Every earn action checks if bonus applies — must be in same flow.
- **Transaction Logging requires all three:** Every earn, redeem, and expiry event is logged — foundational audit layer.
- **Expiry Warnings enhance Staff UI:** Visual urgency callouts in the staff customer card — no separate notification system needed.
- **Stock-clear Bonus requires Admin Item Marking:** ADMIN must mark items first, then STAFF sees the bonus at POS — ordered dependencies.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the loyalty concept for a single Vietnamese café.

- [ ] **Staff auth + RBAC** — Clerk username/password, STAFF vs ADMIN; gate all access
- [ ] **Customer lookup by phone** — instant, no-login; InstantDB; phone as PK
- [ ] **Point earning** — 10k VND = 1pt, floor odd amounts; with bonus rules active
- [ ] **Point redemption** — 6 tiers; 1 redemption = 1 tier only; logged as transaction
- [ ] **Transaction logging** — earn, redeem, expiry events; ADMIN viewable
- [ ] **Point expiry (60-day)** — Vercel cron job daily; points zeroed + logged
- [ ] **Bonus rules** — return bonus (7-day), promo item bonus, stock-clear bonus; ADMIN marks stock-clear items
- [ ] **Admin-configurable tiers** — 6 tiers in InstantDB; ADMIN edits via UI
- [ ] **Staff customer card UI** — shows: name, phone, current points, tier progress bar, expiry warning, redeemable gift

### Add After Validation (v1.x)

Features to add once the core loop is validated and staff/owner feedback is collected.

- [ ] **Admin dashboard stats** — total points issued, gifts redeemed, new customers this period, recent transactions; charts optional
- [ ] **Expiry warning in staff UI** — "these points expire in X days" callout on customer card; proactive urgency
- [ ] **Expiry rescue mechanic** — if customer returns within 7 days of expiry notice, auto-freeze or extend; requires staff flag
- [ ] **Gift inventory tracking** — ADMIN marks gift stock (if physical); prevents over-redemption
- [ ] **Transaction history per customer** — full earn/redeem/bonus log per customer profile

### Future Consideration (v2+)

Features to defer until product-market fit is confirmed.

- [ ] **Customer-facing mini-webpage** — shareable link showing points balance (no login, phone-verified code); low-friction alternative to app
- [ ] **Multi-location support** — shared customer database across locations; requires location management
- [ ] **SMS expiry alerts** — only if customer opts in; requires SMS provider integration (e.g., Twilio, VN telco)
- [ ] **Gamification: badge collection** — "5 return bonuses = double stamp"; drives engagement 18–22% (Restaurant Dive)
- [ ] **Double-point promotional days** — ADMIN sets a date range; elevated urgency mechanic
- [ ] **Referral mechanic** — "refer a new customer = +2 bonus points"; requires new-customer creation workflow
- [ ] **Birthday reward** — auto-detected from customer profile; highest redemption rate feature

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Staff auth + RBAC | HIGH — security gate | LOW | P1 |
| Customer lookup by phone | HIGH — core workflow | LOW | P1 |
| Point earning (10k=1pt, floor) | HIGH — core mechanic | LOW | P1 |
| Bonus rules (3 types) | HIGH — differentiates LPoint | MEDIUM | P1 |
| Point redemption (6 tiers) | HIGH — reason customers care | LOW | P1 |
| Transaction logging | HIGH — audit + expiry foundation | LOW | P1 |
| Point expiry (60-day cron) | MEDIUM — urgency, not core loop | MEDIUM | P1 |
| Admin-configurable tiers | HIGH — owner flexibility | LOW | P1 |
| Staff customer card (progress + expiry) | HIGH — "endowed progress effect" | LOW | P1 |
| Stock-clear item marking + display | MEDIUM — bonus mechanic | LOW | P1 |
| Admin dashboard (stats) | MEDIUM — owner insight | MEDIUM | P2 |
| Expiry warning in staff UI | MEDIUM — drives redemption | LOW | P2 |
| Gift inventory tracking | MEDIUM — prevents over-redemption | MEDIUM | P2 |
| Customer transaction history | LOW — nice for support | LOW | P2 |
| Customer-facing mini-webpage | MEDIUM — engagement outside store | MEDIUM | P3 |
| Birthday reward | MEDIUM — high redemption | LOW | P3 |
| Gamification (badges/streaks) | MEDIUM — engagement boost | HIGH | P3 |
| Referral mechanic | MEDIUM — acquisition | MEDIUM | P3 |
| Double-point promo days | MEDIUM — urgency | LOW | P3 |
| Multi-location support | MEDIUM — scale | HIGH | P3 |

**Priority key:**
- **P1:** Must have for launch — core loop must work
- **P2:** Should have after validation — adds meaningful value with manageable cost
- **P3:** Nice to have, future consideration — only after P1 + P2 are validated

---

## Competitor Feature Analysis

| Feature | Starbucks Rewards | Square Loyalty | Toast Rewards | LPoint (Our Approach) |
|---------|-------------------|----------------|---------------|-----------------------|
| **Consumer mobile app** | ✅ Full app + payments | ❌ No app needed | ✅ ToastGo app | ❌ Deliberately no app — staff-only |
| **Points earning** | ✅ Stars per $ | ✅ Custom $/pt | ✅ Custom $/pt | ✅ 10k VND = 1pt, floor rounding |
| **Tiered rewards** | ✅ Green + Gold | ❌ Flat only | ✅ Silver/Gold | ✅ 6 configurable tiers |
| **No-download enrollment** | ❌ | ✅ Phone/email at POS | ❌ | ✅ Staff creates customer record |
| **Bonus mechanics** | ✅ Double star days | ❌ | ✅ Limited | ✅ 3 bonus types (return, promo, stock-clear) |
| **Point expiry** | ✅ 6 months | ❌ No expiry | ✅ 12 months | ✅ 60 days (urgency loop) |
| **Gamification** | ✅ Star Dash | ❌ | ❌ | ❌ (not in v1; consider v2) |
| **AI personalization** | ✅ Neural network | ❌ | ✅ Basic | ❌ Not needed for single-location |
| **Admin-configurable rules** | ❌ | ✅ | ✅ | ✅ All rules editable by ADMIN |
| **Expiry warning display** | ✅ App notification | ❌ | ❌ | ✅ Staff UI callout |
| **Stock-clear bonus** | ❌ | ❌ | ❌ | ✅ Unique to LPoint |
| **Gift/cash redemption** | Gift card + food | Gift/discount | Gift/discount | Gift only (no cash — per PROJECT.md) |
| **Dashboard analytics** | ✅ Full suite | ✅ Real-time | ✅ Real-time | ✅ Basic stats (v1); full later |
| **POS integration** | ❌ Standalone | ✅ Native Square | ✅ Native Toast | ❌ Manual marking (no POS integration) |

**Key insight:** LPoint's competitive moat vs Starbucks/Toast is **simplicity for the customer** (no app, no login, just phone number) + **operational intelligence for the owner** (bonus mechanics, stock-clear, configurable tiers). Vs Square, LPoint has a richer rule engine and expiry urgency built in.

---

## Sources

- [POSist — The Future of Restaurant Loyalty Programs: Trends for 2025–2030](https://www.posist.com/restaurant-resources/restaurant-software-trends-future-loyalty-programs)
- [Restaurant Dive — Gamification in Restaurant Loyalty](https://www.restaurantdive.com)
- [QSR Magazine — Gamified Loyalty Case Studies 2025](https://www.qsrmagazine.com)
- [Harvard Business Review — Points Expiry Psychology & Retention](https://hbr.org)
- [Square — Loyalty Tools for Restaurants](https://squareup.com/us/en/loyalty)
- [Toast — Toast Rewards Program Features](https://pos.toasttab.com/loyalty)
- [Smile.io — Restaurant Loyalty Program Best Practices](https://smile.io)
- [Loyalty Lion — F&B Loyalty Benchmark Report 2025](https://loyaltylion.com)
- [Technomic 2025 Consumer Brand Tracker — Restaurant Loyalty](https://technomic.com)
- [Belly Technologies — Restaurant Loyalty Gamification Data](https://bellyup.com)

---

*Feature research for: F&B / Restaurant Loyalty Points App*
*Researched: 2026-03-22*
