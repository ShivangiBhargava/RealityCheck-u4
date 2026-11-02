import 'server-only'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getCurrentSession() {
  return auth.api.getSession({ headers: await headers() })
}

export async function requireUser() {
  const session = await getCurrentSession()
  if (!session?.user) redirect('/sign-in')
  return session.user
}

export async function getRequestUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  return session?.user ?? null
}
