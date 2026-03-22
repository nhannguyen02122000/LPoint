# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 01-foundation
**Areas discussed:** Clerk Sign-In UI, Sign-Up Block, InstantDB Schema, Auth Helpers, User Creation, Env Variables

---

## Clerk Sign-In UI

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk hosted (Recommended) | Use Clerk's hosted `<SignIn />` component. Fast, secure, easy setup | ✓ |
| Custom sign-in UI | Build own sign-in page. More control but more complex. Use Clerk API | |

**User's choice:** Clerk hosted
**Notes:** Clerk handles username/password flow. Chosen for speed and security.

---

## Sign-Up Block

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to sign-in (Recommended) | Sign-up page redirects to sign-in. User sees "sign up disabled" from Clerk | ✓ |
| Show 404 page | Return 404 — hide sign-up existence entirely | |
| Show static page | Show static page with message | |

**User's choice:** Redirect to sign-in
**Notes:** Simple, no extra code needed.

---

## InstantDB Schema Design

| Option | Description | Selected |
|--------|-------------|----------|
| InstantDB best practices (Recommended) | Flattened data, links for relationships. Researcher/planner decides optimal structure | ✓ |
| User has reference schema | User will paste or describe a schema | |

**User's choice:** InstantDB best practices
**Notes:** Researcher will determine optimal entity structure based on InstantDB conventions.

---

## Auth Helpers

| Option | Description | Selected |
|--------|-------------|----------|
| 3 helpers: getSession + requireAuth + requireRole (Recommended) | Full set. getSession(), requireAuth(), requireRole('ADMIN'|'STAFF') | ✓ |
| Only requireRole | Use Clerk's auth() directly. Simpler | |

**User's choice:** 3 helpers
**Notes:** Want full set for cleaner code throughout all phases.

---

## User Creation

| Option | Description | Selected |
|--------|-------------|----------|
| Clerk Dashboard (Recommended) | Manual creation via Clerk Dashboard. Set username/password + role in public_metadata | ✓ |
| In-app admin panel | UI for admin to create users + send invite email. Needs user management API routes | |

**User's choice:** Clerk Dashboard
**Notes:** Consistent with requirements — Clerk is the source of truth for STAFF/ADMIN accounts. No user management UI needed.

---

## Env Variables Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Full set (Recommended) | All vars upfront: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, NEXT_PUBLIC_INSTANTDB_APP_ID, INSTANTDB_ADMIN_TOKEN, CRON_SECRET | ✓ |
| Minimal | Only Clerk keys + InstantDB app ID. Add CRON_SECRET later at Phase 9 | |

**User's choice:** Full set upfront
**Notes:** Want to know all env vars needed for the project from the start.

---

## Claude's Discretion

- Exact directory structure for `lib/auth.ts`
- Exact schema structure for each InstantDB entity
- Whether to use Clerk's `auth()` or `@clerk/nextjs/server` for helpers
- `CRON_SECRET` generation method

## Deferred Ideas

None — discussion stayed within Phase 1 scope.
