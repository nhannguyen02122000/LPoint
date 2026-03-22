---
status: testing
phase: 01-foundation
source:
  - 01-PLAN-01-SUMMARY.md
  - 02-PLAN-clerk-auth-SUMMARY.md
  - 03-PLAN-instantdb-schema-SUMMARY.md
  - 04-PLAN-clerk-webhook-SUMMARY.md
  - 05-PLAN-clerk-setup-guide-SUMMARY.md
started: 2026-03-22T08:50:00Z
updated: 2026-03-22T08:50:00Z
---

## Current Test

number: 1
name: Cold Start — App Builds
expected: |
  Run `npm run build`. The Next.js app compiles without TypeScript errors, ESLint errors, or missing dependency errors. ClerkProvider, middleware, and InstantDB client initialize correctly.

await: user response

## Tests

### 1. Cold Start — App Builds
expected: |
  Run `npm run build`. The Next.js app compiles without TypeScript errors, ESLint errors, or missing dependency errors. ClerkProvider, middleware, and InstantDB client initialize correctly.
result: issue
reported: "Build error: 4 type issues found and fixed: (1) webhook route used wrong import path @clerk/nextjs/api/webhooks → @clerk/backend/webhooks (2) verifyWebhook called with wrong signature — now passes NextRequest directly (3) sessionClaims.public_metadata type mismatch — added explicit cast (4) requireRole returned NextResponse instead of Session — fixed return type. All fixed, build now passes."
severity: minor

### 2. Clerk Sign-In Page Loads
expected: |
  Visit `/sign-in` (with Clerk keys configured in `.env.local`). Clerk hosted sign-in form renders. User can enter username and password. Sign-up link redirects to `/sign-in` (not to a Clerk sign-up form).
result: [pending]

### 3. /sign-up Redirects
expected: |
  Visit `/sign-up`. Browser immediately redirects to `/sign-in`. No Clerk sign-up form is shown.
result: [pending]

### 4. lib/auth.ts Helpers Exist
expected: |
  `src/lib/auth.ts` exports `getSession()`, `requireAuth()`, and `requireRole()`. Each function exists and has correct Clerk v7 pattern (`auth()` from `@clerk/nextjs/server`, `sessionClaims.public_metadata.role`).
result: [pending]

### 5. middleware.ts Protects Routes
expected: |
  `middleware.ts` exists at project root. It protects all routes except `/api/auth/webhook`. Unauthenticated requests to any other route redirect to Clerk sign-in.
result: [pending]

### 6. InstantDB Schema Pushed
expected: |
  `src/lib/schema.ts` defines all 6 entities (USERS, CUSTOMER, TRANSACTION, TIER, EXPIRY_LOG, MENU_ITEM). `schema-version.txt` exists with a version number. Schema was pushed to InstantDB app `f843f303-5ab1-48aa-bddb-9f9ea9a2fdb6`.
result: [pending]

### 7. Webhook Handler at /api/auth/webhook
expected: |
  `src/app/api/auth/webhook/route.ts` exists. It verifies Svix signature headers (`svix-id`, `svix-timestamp`, `svix-signature`). It handles `user.created`, `user.updated`, `user.deleted` events. Returns 200 on success.
result: [pending]

### 8. Clerk Dashboard Setup Guide
expected: |
  `01-SETUP-GUIDE.md` exists in the phase directory. It lists the 7 steps to configure Clerk (disable sign-up methods, create ADMIN/STAFF users, configure webhook, add env vars).
result: [pending]

## Summary

total: 8
passed: 0
issues: 1
pending: 7
skipped: 0
blocked: 0

## Gaps

- truth: "npm run build completes without TypeScript or ESLint errors"
  status: failed
  reason: "Build failed with 4 type errors — all fixed inline: wrong webhook import path, verifyWebhook call signature, sessionClaims.public_metadata cast, requireRole return type. Build passes after fixes."
  severity: minor
  test: 1
