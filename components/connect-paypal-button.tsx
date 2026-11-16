'use client'

import { useState } from 'react'
import { ArrowUpRight, LoaderCircle } from 'lucide-react'
import { startPayPalAuthorizationAction } from '@/app/actions/paypal'
import { Button } from '@/components/ui/button'

export function ConnectPayPalButton({
  returnTo = '/account',
}: {
  returnTo?: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleConnect() {
    setPending(true)
    setError('')

    const isFramed = window.self !== window.top
    const authorizationTab = isFramed ? window.open('about:blank', '_blank') : null

    if (isFramed && !authorizationTab) {
      setError('Allow pop-ups to continue to PayPal authorization.')
      setPending(false)
      return
    }

    if (authorizationTab) authorizationTab.opener = null

    try {
      const result = await startPayPalAuthorizationAction(returnTo)
      if (!result.url) {
        authorizationTab?.close()
        setError(result.error ?? 'We could not start PayPal authorization.')
        setPending(false)
        return
      }

      if (authorizationTab) {
        authorizationTab.location.replace(result.url)
      } else {
        window.location.href = result.url
      }
    } catch (err) {
      authorizationTab?.close()
      console.error('[realitycheck] Connect PayPal error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'We could not start PayPal authorization. Please check Vercel Connect settings.',
      )
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={handleConnect} disabled={pending}>
        {pending ? (
          <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
        ) : (
          <ArrowUpRight aria-hidden="true" data-icon="inline-start" />
        )}
        {pending ? 'Opening PayPal…' : 'Connect PayPal'}
      </Button>
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
