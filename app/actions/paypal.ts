'use server'

import { requireUser } from '@/lib/auth-helpers'
import { createPayPalAuthorizationUrl } from '@/lib/paypal'

export async function startPayPalAuthorizationAction(returnTo?: string) {
  try {
    const user = await requireUser()
    const url = await createPayPalAuthorizationUrl(user.id, returnTo)
    return { url }
  } catch (error) {
    console.error('[realitycheck] startPayPalAuthorizationAction error:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'We could not start PayPal authorization. Please verify Vercel Connect settings.'
    return { error: message }
  }
}
