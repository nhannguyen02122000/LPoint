# Phase 1: Foundation - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Clerk auth configured with username/password (sign-up disabled), role in `public_metadata`, InstantDB schema defined and pushed, Clerk webhook handler at `/api/auth/webhook`, and `lib/auth.ts` helpers exported. This is the foundation — no UI pages in this phase.

</domain>

<decisions>
## Implementation Decisions

### Clerk Sign-In Approach
- **D-01:** Use Clerk hosted sign-in component (`<SignIn />`). Not custom UI.
- **D-02:** Sign-up page redirects to sign-in page. Clerk handles the "sign up disabled" message.

### Clerk User Management
- **D-03:** New STAFF/ADMIN accounts created manually via Clerk Dashboard.
- **D-04:** Role stored in `public_metadata.role` ("ADMIN" or "STAFF") on each Clerk user.
- **D-05:** No user management UI in the app — Clerk Dashboard is the source of truth for account lifecycle.

### InstantDB Schema
- **D-06:** Use InstantDB best practices: flattened data, links for relationships, no deeply nested objects.
- **D-07:** Entities required in schema: `CUSTOMER`, `TRANSACTION`, `TIER`, `EXPIRY_LOG`, `MENU_ITEM`, `USERS` (mirror of Clerk users for webhook sync).
- **D-08:** `npx instantdb push` must succeed with zero errors before Phase 2 starts. Schema version pinned to `schema-version.txt`.

### Auth Helpers
- **D-09:** `lib/auth.ts` exports 3 helpers:
  - `getSession(): { userId, role }` — returns current user + role from Clerk session
  - `requireAuth(): void` — redirects to sign-in if not authenticated
  - `requireRole(role: 'ADMIN' | 'STAFF'): void` — returns 403 if wrong role
- **D-10:** Helpers work in both Server Components and Route Handlers.

### Environment Variables
- **D-11:** `.env.example` includes all vars upfront: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_INSTANTDB_APP_ID`, `INSTANTDB_ADMIN_TOKEN`, `CRON_SECRET`.
- **D-12:** Comments in `.env.example` explain each variable's purpose.

### Clerk Webhook
- **D-13:** Webhook handler at `POST /api/auth/webhook` verifies `svix-signature` headers.
- **D-14:** Handles `user.created`, `user.updated`, `user.deleted` events — syncs to InstantDB `USERS` entity.

### Clerk Setup Notification
- **D-15:** After Phase 1, user must configure Clerk: disable email/password sign-up, disable SSO, enable username/password only. Researcher/planner will include setup guide steps.

### Claude's Discretion
- Exact directory structure for `lib/auth.ts`
- Exact schema structure for each InstantDB entity (researcher decides based on InstantDB best practices)
- Whether to use Clerk's `auth()` or `@clerk/nextjs/server` for helpers
- `CRON_SECRET` generation method

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Clerk Integration
- `.planning/PROJECT.md` § Constraints — Clerk-only, no SSO, no customer self-signup
- `.planning/REQUIREMENTS.md` § Authentication — AUTH-01, AUTH-02, SYNC-01

### Stack
- `.planning/research/STACK.md` — Clerk v7 + InstantDB react 0.22 confirmed compatible with Next.js 16

### Architecture
- `.planning/research/ARCHITECTURE.md` § Build Order — Phase 1 must complete before Phase 2 (RBAC)

### Pitfalls
- `.planning/research/PITFALLS.md` § Clerk/InstantDB Integration — webhook sync failure, RBAC bypass

### Environment
- `base_requirements.txt` § ENV variables — exact env var names confirmed
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — this is a greenfield phase. No existing auth, schema, or webhook code.

### Established Patterns
- Next.js App Router structure (`src/app/`)
- Tailwind v4 via `globals.css` with `@theme inline`
- Geist font via `next/font/google`
- TypeScript strict mode enabled

### Integration Points
- `/api/auth/webhook` — new Route Handler at `src/app/api/auth/webhook/route.ts`
- `src/lib/auth.ts` — new utility at `src/lib/auth.ts` (note: `src/lib/` does not exist yet)
- `src/lib/instantdb.ts` — new InstantDB client instance
- `src/lib/schema.ts` — InstantDB schema definition

### Packages Needed
- `@clerk/nextjs` (confirmed in research — latest version)
- `@instantdb/react` (confirmed in research)
- `@instantdb/core`
- `zod` (for Phase 4+ validation)
- `date-fns` (for Phase 3+ point expiry math)
- `svix` (for webhook signature verification)

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose Clerk Dashboard for user creation — no user management UI in app
- User wants full `.env.example` upfront with CRON_SECRET even though Phase 9 uses it
- Clerk hosted sign-in chosen over custom UI for speed and security

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---
*Phase: 01-foundation*
*Context gathered: 2026-03-22*
