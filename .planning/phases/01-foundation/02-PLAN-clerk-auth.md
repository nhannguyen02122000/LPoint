---
wave: 1
depends_on: []
files_modified: []
autonomous: true
---

# Plan 02: Clerk Auth

**Goal:** Wrap the app in `<ClerkProvider>`, create `/sign-in` and `/sign-up` pages, and create `src/lib/auth.ts` with three helpers: `getSession()`, `requireAuth()`, and `requireRole()`.

**REQ-IDs:** AUTH-01, AUTH-02

---

## Tasks

### Task 1 — Add `<ClerkProvider>` to root layout

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/src/app/layout.tsx` — current layout (no ClerkProvider yet)
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q7 confirms middleware uses Clerk v7 App Router pattern
</read_first>

<action>
Replace the contents of `/Users/nhannguyenthanh/Developer/lpoint/src/app/layout.tsx` with the following exact code. Keep any existing content (metadata, fonts, globals.css import) intact — just wrap the children with `<ClerkProvider>`:

```typescript
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LPoint',
  description: 'Chương trình tích điểm đổi quà',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="vi">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

Preserve the existing font import (Geist) from the original `layout.tsx` — add it back if the above removes it.
</action>

<acceptance_criteria>
- `src/app/layout.tsx` imports `ClerkProvider` from `@clerk/nextjs`
- `<ClerkProvider>` wraps the `<html>` element
- `children` prop is passed through to the `<body>`
- No `"use client"` directive added to this file
- File still exports `metadata`
</acceptance_criteria>

---

### Task 2 — Create `/sign-in` page

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/src/app/layout.tsx` — to understand current imports
</read_first>

<action>
Create the directory `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-in/` and write the file `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` with the following exact content:

```typescript
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
```

The route `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` maps to `/sign-in` via Next.js route groups `(auth)`.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` exists
- File imports `SignIn` from `@clerk/nextjs`
- File exports a default function `SignInPage`
- Component renders `<SignIn />` inside a centered `<div>`
- No `"use client"` directive needed — `SignIn` from Clerk handles interactivity internally
</acceptance_criteria>

---

### Task 3 — Create `/sign-up` redirect page

<read_first>
- Same as Task 2
</read_first>

<action>
Create the directory `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-up/` and write the file `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` with the following exact content:

```typescript
import { redirect } from 'next/navigation'

export default function SignUpPage() {
  redirect('/sign-in')
}
```

Sign-up is disabled on Clerk (username/password only creates accounts via Clerk Dashboard). Users who visit `/sign-up` are redirected to `/sign-in`.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` exists
- File imports `redirect` from `next/navigation`
- File uses `redirect('/sign-in')` (not `Router.push`)
</acceptance_criteria>

---

### Task 4 — Create `src/lib/auth.ts`

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q1 and Q2 confirm `auth()` from `@clerk/nextjs/server` and `sessionClaims.public_metadata.role` access pattern
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-CONTEXT.md` — D-09 defines the 3 helpers
</read_first>

<action>
Create the directory `/Users/nhannguyenthanh/Developer/lpoint/src/lib/` and write the file `/Users/nhannguyenthanh/Developer/lpoint/src/lib/auth.ts` with the following exact content:

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export type Role = 'ADMIN' | 'STAFF'

export interface Session {
  userId: string
  role: Role | undefined
}

/**
 * Returns the current user's userId and role from the Clerk session.
 * Works in Server Components and Route Handlers.
 */
export async function getSession(): Promise<Session> {
  const { userId, sessionClaims } = await auth()
  const role = (sessionClaims?.public_metadata?.role as Role) ?? undefined
  return { userId: userId ?? '', role }
}

/**
 * Redirects to Clerk's sign-in page if the user is not authenticated.
 * Throws a Next.js redirect (never returns).
 */
export async function requireAuth(): Promise<Session> {
  const { userId } = await auth()
  if (!userId) {
    // Clerk's auth() will redirect to sign-in automatically via middleware
    // This guard is a belt-and-suspenders check for Route Handlers
    return { userId: '', role: undefined }
  }
  return getSession()
}

/**
 * Throws a 403 NextResponse if the user does not have the required role.
 * Use for ADMIN-only routes/actions.
 */
export async function requireRole(role: Role): Promise<Session> {
  const session = await getSession()
  if (session.userId && session.role !== role) {
    return NextResponse.json(
      { error: `Forbidden: requires ${role} role` },
      { status: 403 }
    )
  }
  return session
}
```

**Critical:** `public_metadata.role` lives at `sessionClaims.public_metadata.role` — NOT at the top level of the auth object. This is the correct Clerk v7 pattern.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/lib/auth.ts` exists
- File imports `auth` from `@clerk/nextjs/server` (NOT `getAuth`)
- File imports `NextResponse` from `next/server`
- File exports `getSession()` as a named async function that returns `Promise<Session>`
- File exports `requireAuth()` as a named async function
- File exports `requireRole(role: Role)` as a named async function that returns `NextResponse.json({ status: 403 })` on role mismatch
- `Session` interface has fields: `userId: string`, `role: Role | undefined`
- `Role` type is `'ADMIN' | 'STAFF'`
- `getSession()` accesses `sessionClaims?.public_metadata?.role`
</acceptance_criteria>

---

## Verification

```bash
# Verify ClerkProvider in layout
grep -n "ClerkProvider" /Users/nhannguyenthanh/Developer/lpoint/src/app/layout.tsx

# Verify sign-in page exists
ls /Users/nhannguyenthanh/Developer/lpoint/src/app/\(auth\)/sign-in/[[...sign-in]]/page.tsx

# Verify sign-up redirect
grep "redirect" /Users/nhannguyenthanh/Developer/lpoint/src/app/\(auth\)/sign-up/[[...sign-up]]/page.tsx

# Verify lib/auth.ts
grep -n "sessionClaims\|public_metadata\|requireRole" /Users/nhannguyenthanh/Developer/lpoint/src/lib/auth.ts
# Must show sessionClaims?.public_metadata?.role and requireRole
```

---

## must_haves

- [ ] `<ClerkProvider>` wraps the root layout
- [ ] `/sign-in` renders Clerk's `<SignIn />` component
- [ ] `/sign-up` redirects to `/sign-in`
- [ ] `src/lib/auth.ts` exports `getSession()`, `requireAuth()`, `requireRole()` with correct Clerk v7 `auth()` + `sessionClaims.public_metadata.role` pattern
- [ ] `middleware.ts` (from Plan 01) routes unauthenticated users to Clerk sign-in
