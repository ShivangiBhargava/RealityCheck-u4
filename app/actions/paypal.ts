'use server'

import { requireUser } from '@/lib/auth-helpers'
import { createPayPalAuthorizationUrl } from '@/lib/paypal'

export async function startPayPalAuthorizationAction(returnTo?: string) {
  const user = await requireUser()
  try {
    const url = await createPayPalAuthorizationUrl(user.id, returnTo)
    return { url }
  } catch {
    return { error: 'We could not start PayPal authorization. Please try again.' }
  }
}
