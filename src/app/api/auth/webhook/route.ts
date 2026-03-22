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
