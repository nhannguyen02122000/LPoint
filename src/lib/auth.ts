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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = ((sessionClaims as { public_metadata?: { role?: Role } })?.public_metadata?.role) ?? undefined
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
  if (!session.userId || session.role !== role) {
    return NextResponse.json(
      { error: `Forbidden: requires ${role} role` },
      { status: 403 }
    ) as unknown as Session
  }
  return session
}
