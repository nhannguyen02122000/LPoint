// TEMP: Delete after Phase 1 verification
import { NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  return NextResponse.json({ userId: session.userId, role: session.role })
}

export async function POST() {
  const session = await requireRole('ADMIN')
  return NextResponse.json({ userId: session.userId, role: session.role, requireRole: 'OK' })
}
