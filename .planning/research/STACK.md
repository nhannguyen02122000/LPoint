# Stack Research

**Domain:** Loyalty points / reward system (B2B SaaS for small F&B retail)
**Researched:** 2026-03-22
**Confidence:** HIGH — versions verified against npm registry (2026-03-22), peer deps confirmed

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | `16.2.1` | Full-stack React framework (App Router, Server Components, API Routes) | Already scaffolded. React 19 + Next.js 16 is the current edge. App Router is the standard going forward. |
| **Clerk** | `@clerk/nextjs@7.0.6` | STAFF/ADMIN authentication — username/password, RBAC via `publicMetadata` | Already integrated. v7 is the latest stable with Next.js 16 and React 19 support. Username+password only (no signup) is Clerk's recommended pattern for internal tools. |
| **InstantDB** | `@instantdb/react@0.22.169` | Customer records, point transactions, tier config, expiry logs | Already integrated. The 0.22 minor line is actively maintained with 169+ patches. `react >= 16` peer dep — fully compatible with React 19. Phone-as-PK fits the lookup-by-phone requirement perfectly. |
| **Tailwind CSS** | `^4.2.2` | Utility-first styling | Already scaffolded. v4 is now stable (v4.2.2 latest). Uses `@import "tailwindcss"` instead of `@tailwind` directives — **breaking change from v3**. No PostCSS config file needed with Vite; Next.js uses `@tailwindcss/postcss`. |
| **React** | `19.2.4` | UI library | Shipped with Next.js 16.2.1. React 19 enables RSC streaming, `use()` hook, and server-side mutations. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **Zod** | `^4.3.6` | Runtime TypeScript schema validation | Validate API payloads, form data, and InstantDB mutations. Preferred over `yup` for TypeScript-native DX. |
| **react-hook-form** | `^7.72.0` | Performant form state management | All forms: login, customer create/edit, tier config. Pairs with Zod via `@hookform/resolvers`. |
| **@hookform/resolvers** | `^5.2.2` | Bridge react-hook-form → Zod | Required for RHF + Zod integration. |
| **date-fns** | `^4.1.0` | Date manipulation (point expiry calc, transaction timestamps) | Replace native `Date` for readability and timezone safety. |
| **lucide-react** | `^0.577.0` | Icon library | Consistent SVG icons. Replaces any ad-hoc icon solutions. |
| **clsx** | `^2.1.1` | Conditional className utility | Compose Tailwind class strings conditionally. |
| **@tailwindcss/postcss** | `^4.2.2` | PostCSS plugin for Tailwind v4 | Already in devDeps. Handles CSS compilation in Next.js. |
| **@tailwindcss/vite** | `^4.2.2` | Vite plugin for Tailwind v4 | Only needed if adding a Vite-based tool later (e.g., Storybook). Skip for pure Next.js. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** `^5` | Static type safety across the stack | Next.js 16 ships with TS. Keep strict mode on. |
| **ESLint** `^9` | Linting | Already scaffolded via `eslint-config-next`. |
| **Vercel** | Hosting + cron jobs | Host the Next.js app. Use `vercel.json` or API route `/api/cron/point-expiry` with a `@vercel/cron` route matcher for the daily point-zeroing job. |

---

## Installation

```bash
# Auth — Clerk (already configured in project)
# npm install @clerk/nextjs   # Already installed

# Data — InstantDB React bindings (already configured in project)
# npm install @instantdb/react  # Already installed

# Forms
npm install react-hook-form @hookform/resolvers zod

# Utilities
npm install date-fns lucide-react clsx

# Dev tooling — Tailwind v4 PostCSS (already in devDeps)
# npm install -D @tailwindcss/postcss  # Already installed
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|------------------------|
| **Clerk** | Auth.js / NextAuth | Clerk is preferred here because STAFF/ADMIN auth needs username/password with no self-signup, role in `publicMetadata`, and webhook syncing to InstantDB — all first-class Clerk features. Auth.js requires more boilerplate for this pattern. |
| **InstantDB** | PostgreSQL + Prisma | If the shop scales to multi-tenant or needs complex relational queries (e.g., cross-customer analytics), swap to Postgres. For v1 with phone-as-PK and simple CRUD, InstantDB's client-side sync model is faster to ship. |
| **Tailwind v4** | Tailwind v3 | v4 is stable and the recommended path forward. Stay on v3 only if supporting IE11 or very old browsers — explicitly out of scope for this project. |
| **Zod** | `yup` / `zod` vs. runtime validation | Zod is TypeScript-native with zero runtime overhead for inferred types. `yup` is older and less type-safe. |
| **lucide-react** | Heroicons / Radix Icons | lucide has better tree-shaking and a consistent 24px stroke weight. Radix Icons requires more setup. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **`@tailwindcss/postcss` v3 config** — `tailwind.config.js` / `postcss.config.js` | Tailwind v4 has no `tailwind.config.js`. It uses CSS-based config via `@import "tailwindcss"`. Adding v3-style config will cause silent failures. | Use the v4 pattern already in the scaffold: CSS-first, no JS config file. |
| **`@clerk/nextjs` v5 or below | v6+ is required for Next.js 15+. v5 dropped support for App Router patterns used in this project. | Upgrade to v7 (current) — the project is already on v7. |
| **`@instantdb/core` without `@instantdb/react`** | Direct `instant` client usage works but loses React hooks (`useQuery`, `useMutation`). You would re-implement reactivity manually. | Use `@instantdb/react` for the React hook API (`useQuery`, `useData`, `useMutation`). |
| **Native `Date` for point expiry math** | `new Date()` / `Date.parse()` has inconsistent timezone behavior across Vercel edge runtimes. | Use `date-fns` (`addDays`, `differenceInDays`, `startOfDay`) for deterministic expiry calculations. |
| **Client-side-only InstantDB reads** | InstantDB is reactive — if you read data server-side without `db.query()`, you bypass the reactive layer and lose real-time updates on the STAFF dashboard. | Use InstantDB's `useQuery` client-side for reactive UI. Use `instant.db.query(...)` in Server Actions / Route Handlers for initial SSR data. |
| **Server Components for point mutations** | Point earning/redemption require immediate DB writes with optimistic UI feedback. Server Components run once on the server; you need client-side `useMutation` for responsive UX. | Keep mutation logic in Client Components + Server Actions for validation. |

---

## Stack Patterns by Variant

**If multi-tenant expansion is needed later (multiple shops):**
- Add **PostgreSQL** (Neon or Supabase) + **Drizzle ORM** or **Prisma**
- Keep InstantDB for customer-facing phone lookup (low latency, offline-capable)
- Use Clerk Organizations for multi-shop STAFF isolation
- Because: InstantDB scales poorly beyond ~10k active customers per app

**If real-time collaborative STAFF dashboards are needed:**
- InstantDB already provides real-time sync via WebSockets
- No additional infrastructure needed — `useQuery` hooks auto-update
- Because: each STAFF sees point redemptions/update instantly

**If a customer-facing mobile app is added in the future:**
- Clerk supports mobile SDKs (Expo, Swift, Kotlin)
- InstantDB has a mobile SDK (iOS/Android)
- LPoint would need a major refactor (add customer auth, expose API)
- Because: currently customers have no login — a mobile app would require a fundamentally different auth model

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.2.1` | `react@19.2.4`, `react-dom@19.2.4` | Shipped together. React 19 required. |
| `@clerk/nextjs@7.0.6` | `next@^16.0.10` or `^16.1.0-0` | **Explicit Next.js 16 support confirmed in peer deps.** Also supports 15.2.8–15.6.x. |
| `@clerk/nextjs@7.0.6` | `react@^18.0.0` or `~19.x.x` | React 18 and 19 both supported. |
| `@instantdb/react@0.22.169` | `react@>=16` | React 16, 17, 18, 19 all supported. No React 19 restrictions. |
| `tailwindcss@4.2.2` | `next@16.x` via `@tailwindcss/postcss@4.2.2` | PostCSS plugin is the correct integration path for Next.js. No Vite plugin needed. |
| `zod@4.3.6` | `react-hook-form@^7`, `@hookform/resolvers@^5` | Compatible. `@hookform/resolvers` v5 adds native Zod v4 support. |

---

## Sources

- `npm view next version` — `16.2.1` (verified 2026-03-22)
- `npm view @clerk/nextjs version` — `7.0.6` (verified 2026-03-22)
- `npm view @clerk/nextjs@7.0.6 peerDependencies` — Next.js `^16.0.10 || ^16.1.0-0` confirmed
- `npm view @instantdb/react version` — `0.22.169` (verified 2026-03-22)
- `npm view @instantdb/react@0.22.169 peerDependencies` — `react@>=16` confirmed
- `npm view tailwindcss version` — `4.2.2` (verified 2026-03-22)
- [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide) — v4.0 stable, v4.2 latest minor; confirmed v4 import pattern
- [clerk.com/docs/references/nextjs/overview](https://clerk.com/docs/references/nextjs/overview) — Next.js App Router + Pages Router support confirmed
- [clerk.com/docs](https://clerk.com/docs) — Clerk v7 feature set (async auth, middleware chaining, webhook improvements)
- `npm view zod version` — `4.3.6`
- `npm view react-hook-form version` — `7.72.0`
- `npm view @hookform/resolvers version` — `5.2.2`
- `npm view date-fns version` — `4.1.0`
- `npm view lucide-react version` — `0.577.0`
- `npm view clsx version` — `2.1.1`

---

*Stack research for: LPoint loyalty/points system*
*Researched: 2026-03-22*
