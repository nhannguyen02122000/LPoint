---
wave: 1
depends_on: []
files_modified: []
autonomous: true
---

# Plan 01: Packages & Config

**Goal:** Install all dependencies, create `.env.example` with all env vars upfront, and create `middleware.ts` protecting all routes except the Clerk webhook endpoint.

**REQ-IDs:** AUTH-01, AUTH-02

---

## Tasks

### Task 1 — Install npm dependencies

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/package.json` — current dependency list
</read_first>

<action>
Run the following command from `/Users/nhannguyenthanh/Developer/lpoint/`:

```bash
npm install @clerk/nextjs @instantdb/react @instantdb/core svix zod
```

Dependencies:
- `@clerk/nextjs` — Clerk auth integration for Next.js
- `@instantdb/react` — InstantDB React client
- `@instantdb/core` — InstantDB core client
- `svix` — Webhook signature verification (used by Clerk webhook)
- `zod` — Runtime schema validation (needed by Phase 4, install now)
</action>

<acceptance_criteria>
- `package.json` contains `"@clerk/nextjs"`, `"@instantdb/react"`, `"@instantdb/core"`, `"svix"`, `"zod"` in dependencies
- `package-lock.json` was updated
- `node_modules/@clerk/nextjs` directory exists
- `node_modules/@instantdb/react` directory exists
- `node_modules/svix` directory exists
</acceptance_criteria>

---

### Task 2 — Create `.env.example`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.env.local` — to understand current state (may be empty or have placeholder values)
</read_first>

<action>
Write the file `/Users/nhannguyenthanh/Developer/lpoint/.env.example` with the following exact content:

```bash
# ─── Clerk Authentication ────────────────────────────────────────────────────
# Found in Clerk Dashboard → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Webhook signing secret — found in Clerk Dashboard → Webhooks → select endpoint → Signing Secret
# Only needed after you configure the webhook endpoint (see Phase 1 Setup Guide)
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# ─── InstantDB ───────────────────────────────────────────────────────────────
# Found in InstantDB Dashboard → App → API Keys
NEXT_PUBLIC_INSTANTDB_APP_ID=your-app-id-here
INSTANTDB_ADMIN_TOKEN=your-admin-token-here

# ─── Vercel Cron (Phase 9) ───────────────────────────────────────────────────
# Generate with: openssl rand -hex 32
# Used to authenticate Vercel cron job requests (added upfront for convenience)
CRON_SECRET=your-random-secret-here
```
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/.env.example` exists
- File contains the literal string `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
- File contains the literal string `CLERK_SECRET_KEY=sk_test_...`
- File contains the literal string `CLERK_WEBHOOK_SIGNING_SECRET=whsec_...`
- File contains the literal string `NEXT_PUBLIC_INSTANTDB_APP_ID=your-app-id-here`
- File contains the literal string `INSTANTDB_ADMIN_TOKEN=your-admin-token-here`
- File contains the literal string `CRON_SECRET=your-random-secret-here`
- File contains the comment `# Generate with: openssl rand -hex 32`
</acceptance_criteria>

---

### Task 3 — Create `middleware.ts`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/src/app/layout.tsx` — to understand the current root layout structure
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q7 for exact middleware pattern
</read_first>

<action>
Write the file `/Users/nhannguyenthanh/Developer/lpoint/middleware.ts` (root of project, same level as `package.json`) with the following exact content:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/api/auth/webhook(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

This protects all routes except `/api/auth/webhook` (which must be public for Clerk to POST events). `auth.protect()` without arguments redirects unauthenticated users to Clerk's sign-in page.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/middleware.ts` exists
- File contains the import `from '@clerk/nextjs/server'`
- File contains `createRouteMatcher(['/api/auth/webhook(.*)'])`
- File contains `await auth.protect()`
- File contains `export const config` with `matcher` array
- File is NOT inside `src/` — it is at the project root
</acceptance_criteria>

---

## Verification

After all tasks complete:

```bash
# Verify middleware.ts is at project root
ls /Users/nhannguyenthanh/Developer/lpoint/middleware.ts

# Verify env.example
grep -c "CLERK_SECRET_KEY\|INSTANTDB_ADMIN_TOKEN\|CRON_SECRET" /Users/nhannguyenthanh/Developer/lpoint/.env.example
# Must output 3

# Verify packages installed
ls /Users/nhannguyenthanh/Developer/lpoint/node_modules/@clerk/nextjs/package.json
ls /Users/nhannguyenthanh/Developer/lpoint/node_modules/svix/package.json
```

---

## must_haves

- [ ] `@clerk/nextjs` installed in `package.json`
- [ ] `middleware.ts` exists at project root with webhook excluded from auth
- [ ] `.env.example` contains all 7 env vars with comments explaining each
- [ ] All npm installs succeed with no peer dependency warnings
