---
wave: 1
depends_on: []
files_modified: []
autonomous: true
---

# Plan 04: Clerk Webhook Handler

**Goal:** Create the Route Handler at `POST /api/auth/webhook` that verifies Svix signatures and handles `user.created`, `user.updated`, and `user.deleted` events. InstantDB writes are stubbed (deferred to Phase 4).

**REQ-IDs:** SYNC-01

---

## Tasks

### Task 1 — Create webhook route handler

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q4 contains the complete webhook handler pattern with all exact code
- `/Users/nhannguyenthanh/Developer/lpoint/middleware.ts` — confirms webhook is excluded from Clerk auth
</read_first>

<action>
Create the directory `/Users/nhannguyenthanh/Developer/lpoint/src/app/api/auth/webhook/` and write the file `/Users/nhannguyenthanh/Developer/lpoint/src/app/api/auth/webhook/route.ts` with the following exact content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/nextjs/api/webhooks'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SIGNING_SECRET not set' },
      { status: 500 }
    )
  }

  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  let evt: ReturnType<typeof verifyWebhook>

  try {
    evt = verifyWebhook(body, {
      svix_id,
      svix_timestamp,
      svix_signature,
      secret: WEBHOOK_SECRET,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const { object: eventType, data } = evt
  const clerk_user_id = data.id as string

  // ── Phase 1: Signature verified, event routed ──────────────────────────────
  // InstantDB writes are deferred to Phase 4.
  // When Phase 4 is implemented, add InstantDB transact calls here:
  //
  // if (eventType === 'user.created' || eventType === 'user.updated') {
  //   const role = (data.public_metadata as { role?: string })?.role
  //   await db.transact(
  //     db.tx.USERS(clerk_user_id).update({
  //       username: data.username ?? '',
  //       first_name: data.first_name ?? null,
  //       last_name: data.last_name ?? null,
  //       image_url: data.image_url ?? null,
  //       role: role ?? null,
  //       last_sign_in_at: data.last_sign_in_at ?? null,
  //       updated_at: Date.now(),
  //     })
  //   )
  // } else if (eventType === 'user.deleted') {
  //   // Delete USERS record — implement if needed in Phase 4
  // }
  // ───────────────────────────────────────────────────────────────────────────

  // Log event type for observability (Phase 4 will replace this with actual DB writes)
  console.log(`[webhook] ${eventType} for user ${clerk_user_id}`)

  return NextResponse.json({ received: true }, { status: 200 })
}
```

Key decisions:
- Uses Clerk's built-in `verifyWebhook` from `@clerk/nextjs/api/webhooks` (no raw `svix` package needed)
- Returns 200 on success — Clerk retries 4xx/5xx responses, which could cause duplicate events
- Returns 500 if `CLERK_WEBHOOK_SIGNING_SECRET` is not configured (user must add this after Clerk Dashboard setup)
- InstantDB transact calls are stubbed with comments — Phase 4 implements them
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/src/app/api/auth/webhook/route.ts` exists
- File imports `verifyWebhook` from `@clerk/nextjs/api/webhooks`
- File checks for `svix-id`, `svix-timestamp`, `svix-signature` headers and returns 400 if missing
- File calls `verifyWebhook(body, { svix_id, svix_timestamp, svix_signature, secret: WEBHOOK_SECRET })`
- File returns 400 on signature verification failure
- File reads `data.public_metadata.role` from the verified event
- File handles `user.created`, `user.updated`, `user.deleted` (via if/else on `eventType`)
- File returns `NextResponse.json({ received: true }, { status: 200 })` on success
- File does NOT have `"use client"` directive
</acceptance_criteria>

---

## Verification

```bash
# Verify file exists and has correct structure
grep -n "verifyWebhook\|svix-id\|user.created\|user.deleted\|NextResponse.json.*received" \
  /Users/nhannguyenthanh/Developer/lpoint/src/app/api/auth/webhook/route.ts

# Must show all of:
# - verifyWebhook import and call
# - svix-id header check
# - user.created and user.deleted handling
# - { received: true } response

# Verify webhook is excluded from middleware auth
grep "webhook" /Users/nhannguyenthanh/Developer/lpoint/middleware.ts
# Must show '/api/auth/webhook(.*)'
```

---

## must_haves

- [ ] `POST /api/auth/webhook` route handler created at correct path
- [ ] Svix signature headers (`svix-id`, `svix-timestamp`, `svix-signature`) are verified before processing
- [ ] Invalid signature returns 400
- [ ] `CLERK_WEBHOOK_SIGNING_SECRET` missing returns 500
- [ ] All three events (`user.created`, `user.updated`, `user.deleted`) are handled (stubbed InstantDB writes)
- [ ] `middleware.ts` (Plan 01) excludes `/api/auth/webhook` from auth protection
- [ ] Route returns 200 on success to prevent Clerk retry storms
