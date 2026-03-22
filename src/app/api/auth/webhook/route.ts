import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhook } from '@clerk/backend/webhooks'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'CLERK_WEBHOOK_SIGNING_SECRET not set' },
      { status: 500 }
    )
  }

  let eventType: string
  let clerk_user_id: string | undefined

  try {
    const evt = await verifyWebhook(req, {
      signingSecret: WEBHOOK_SECRET,
    })
    eventType = evt.object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clerk_user_id = (evt.data as any)?.id as string | undefined
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Phase 1: Signature verified, event routed ──────────────────────────────
  // InstantDB writes are deferred to Phase 4.
  // When Phase 4 is implemented, add InstantDB transact calls here:
  //
  // if (eventType === 'user.created' || eventType === 'user.updated') {
  //   await db.transact(
  //     db.tx.USERS(clerk_user_id).update({ ... })
  //   )
  // } else if (eventType === 'user.deleted') {
  //   // Delete USERS record — implement if needed in Phase 4
  // }
  // ─────────────────────────────────────────────────────────────────────────

  // Log event type for observability (Phase 4 will replace this with actual DB writes)
  console.log(`[webhook] ${eventType} for user ${clerk_user_id}`)

  return NextResponse.json({ received: true }, { status: 200 })
}
