import 'server-only'

import {
  getToken,
  NoValidTokenError,
  startAuthorization,
  UserAuthorizationRequiredError,
} from '@vercel/connect'
import { headers } from 'next/headers'

export const PAYPAL_CONNECTOR_UID = 'paypal/realitycheck-paypal-payouts'
export const PAYPAL_PAYOUT_SCOPE = 'https://uri.paypal.com/payments/payouts'

function getSubject(userId: string) {
  return { type: 'user' as const, id: userId }
}

export function getPayPalTokenForUser(userId: string) {
  return getToken(PAYPAL_CONNECTOR_UID, {
    subject: getSubject(userId),
    scopes: [PAYPAL_PAYOUT_SCOPE],
  })
}

export async function getPayPalConnectionStatus(
  userId: string,
): Promise<'connected' | 'not_connected' | 'unavailable'> {
  try {
    await getPayPalTokenForUser(userId)
    return 'connected'
  } catch (error) {
    if (
      error instanceof UserAuthorizationRequiredError ||
      error instanceof NoValidTokenError
    ) {
      return 'not_connected'
    }
    console.error('[realitycheck] PayPal connection status unavailable')
    return 'unavailable'
  }
}

async function getOrigin() {
  if (process.env.NODE_ENV !== 'production' && process.env.V0_RUNTIME_URL) {
    return process.env.V0_RUNTIME_URL
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  if (!host) throw new Error('Unable to resolve the callback origin')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  return `${protocol}://${host}`
}

function getSafeReturnPath(returnTo: string | undefined) {
  if (!returnTo) return '/account'
  try {
    const origin = 'https://realitycheck.invalid'
    const parsed = new URL(returnTo, origin)
    if (parsed.origin !== origin) return '/account'
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return '/account'
  }
}

export async function createPayPalAuthorizationUrl(
  userId: string,
  returnTo?: string,
) {
  const callbackUrl = new URL(getSafeReturnPath(returnTo), await getOrigin()).toString()
  const authorization = await startAuthorization(
    PAYPAL_CONNECTOR_UID,
    {
      subject: getSubject(userId),
      scopes: [PAYPAL_PAYOUT_SCOPE],
    },
    { callbackUrl },
  )
  return authorization.url
}
